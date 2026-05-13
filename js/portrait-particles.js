(function () {
    const canvas = document.querySelector('canvas.about-portrait');
    if (!canvas || !canvas.dataset.src) return;

    const ctx = canvas.getContext('2d');
    const SIZE = canvas.width;
    const CELL = 4;
    const COLS = Math.floor(SIZE / CELL);
    const ROWS = Math.floor(SIZE / CELL);
    /* image is drawn into a smaller centered region so there's padding around it for displaced particles to fly into */
    const IMG_SIZE = 480;
    const IMG_OFFSET = (SIZE - IMG_SIZE) / 2;

    /* Continuous warp field — mirrors the dither bg's exp-falloff displacement around the cursor */
    const WARP_SCALE = 120;     /* distance over which influence falls off; larger = wider bulge */
    const WARP_STRENGTH = 0.85; /* how far particles get pushed at the warp's peak */
    const SPRING = 0.06;        /* lower = more smear (particles lag behind the moving warp) */
    const DAMPING = 0.86;

    /* Animated blob mask — tested per particle in canvas space so the edge lands on the cell grid.
       Values are absolute pixels so the visible blob stays the same size if the canvas grows for padding. */
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const BLOB_BASE = 211;
    const BLOB_AMP1 = 8.6;
    const BLOB_AMP2 = 4.8;
    const BLOB_W1 = 3;
    const BLOB_W2 = 5;
    const BLOB_SPEED1 = 0.00025;
    const BLOB_SPEED2 = 0.00015;

    /* Brightness shimmer — slow wave that flips borderline dither cells over time */
    const SHIMMER_AMOUNT = 0.05;     /* peak ± brightness shift (0..1 space) */
    const SHIMMER_SPEED = 0.0008;
    const SHIMMER_WAVELENGTH = 0.02; /* spatial frequency — higher = more localized variation */

    const startTime = performance.now();

    /* 8x8 Bayer ordered-dither matrix — 64 tonal levels for smoother gradation (matches the bg dither) */
    const BAYER = [
        [ 0, 32,  8, 40,  2, 34, 10, 42],
        [48, 16, 56, 24, 50, 18, 58, 26],
        [12, 44,  4, 36, 14, 46,  6, 38],
        [60, 28, 52, 20, 62, 30, 54, 22],
        [ 3, 35, 11, 43,  1, 33,  9, 41],
        [51, 19, 59, 27, 49, 17, 57, 25],
        [15, 47,  7, 39, 13, 45,  5, 37],
        [63, 31, 55, 23, 61, 29, 53, 21]
    ];
    const BAYER_DIM = 8;
    const BAYER_DENOM = BAYER_DIM * BAYER_DIM;

    ctx.imageSmoothingEnabled = false;

    const particles = [];
    let mouseX = -9999;
    let mouseY = -9999;
    let rafId = null;

    const img = new Image();
    img.onload = init;
    img.onerror = function () {
        console.error('[portrait-particles] failed to load image:', canvas.dataset.src);
    };
    img.src = canvas.dataset.src;

    function init() {
        const off = document.createElement('canvas');
        off.width = SIZE;
        off.height = SIZE;
        const octx = off.getContext('2d');
        octx.imageSmoothingEnabled = false;
        /* center-crop source to a square, then draw it into a centered IMG_SIZE region of the buffer */
        const srcSize = Math.min(img.width, img.height);
        const srcX = (img.width - srcSize) / 2;
        const srcY = (img.height - srcSize) / 2;
        octx.drawImage(img, srcX, srcY, srcSize, srcSize, IMG_OFFSET, IMG_OFFSET, IMG_SIZE, IMG_SIZE);
        let data;
        try {
            data = octx.getImageData(0, 0, SIZE, SIZE).data;
        } catch (err) {
            console.error('[portrait-particles] getImageData blocked (likely file:// or CORS). Serve via a local web server.', err);
            return;
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                /* average brightness across the cell */
                let sum = 0;
                for (let yy = 0; yy < CELL; yy++) {
                    for (let xx = 0; xx < CELL; xx++) {
                        const i = ((r * CELL + yy) * SIZE + (c * CELL + xx)) * 4;
                        sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
                    }
                }
                const avg = sum / (CELL * CELL) / 255;
                const threshold = (BAYER[r % BAYER_DIM][c % BAYER_DIM] + 0.5) / BAYER_DENOM;

                /* precompute polar coords of home cell center for the blob mask test (saves a sqrt + atan2 per frame) */
                const hcx = c * CELL + CELL / 2 - CX;
                const hcy = r * CELL + CELL / 2 - CY;
                particles.push({
                    homeX: c * CELL,
                    homeY: r * CELL,
                    homeAngle: Math.atan2(hcy, hcx),
                    homeDist: Math.sqrt(hcx * hcx + hcy * hcy),
                    x: c * CELL,
                    y: r * CELL,
                    vx: 0,
                    vy: 0,
                    avg: avg,
                    threshold: threshold
                });
            }
        }

        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseleave', onLeave);
        rafId = requestAnimationFrame(tick);
    }

    function onMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (SIZE / rect.width);
        mouseY = (e.clientY - rect.top) * (SIZE / rect.height);
    }

    function onLeave() {
        mouseX = -9999;
        mouseY = -9999;
    }

    function tick() {
        ctx.clearRect(0, 0, SIZE, SIZE);
        const t = performance.now() - startTime;
        const phase1 = t * BLOB_SPEED1;
        const phase2 = t * BLOB_SPEED2;
        const hasMouse = mouseX > -9000;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            /* compute warp target: home + exp-falloff push away from cursor (field sampled at home position) */
            let targetX = p.homeX;
            let targetY = p.homeY;
            if (hasMouse) {
                const dx = p.homeX - mouseX;
                const dy = p.homeY - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const influence = Math.exp(-dist / WARP_SCALE) * WARP_STRENGTH;
                targetX += dx * influence;
                targetY += dy * influence;
            }

            /* spring toward the warped target — slow spring + damping produces the smear */
            p.vx += (targetX - p.x) * SPRING;
            p.vy += (targetY - p.y) * SPRING;
            p.vx *= DAMPING;
            p.vy *= DAMPING;
            p.x += p.vx;
            p.y += p.vy;

            /* re-evaluate lit each frame with a slow space-varying brightness shimmer — borderline cells flicker */
            const shimmer = Math.sin(t * SHIMMER_SPEED + (p.homeX + p.homeY) * SHIMMER_WAVELENGTH) * SHIMMER_AMOUNT;
            if (p.avg + shimmer <= p.threshold) continue;
            /* blob mask test against HOME position — particles whose homes are inside the blob are always drawn, even if displaced beyond it */
            const blobR = BLOB_BASE
                + BLOB_AMP1 * Math.sin(BLOB_W1 * p.homeAngle + phase1)
                + BLOB_AMP2 * Math.cos(BLOB_W2 * p.homeAngle + phase2);
            if (p.homeDist > blobR) continue;
            /* snap draw position to the CELL grid so particles only ever occupy whole-pixel slots */
            const drawX = Math.round(p.x / CELL) * CELL;
            const drawY = Math.round(p.y / CELL) * CELL;
            ctx.fillStyle = '#fff';
            ctx.fillRect(drawX, drawY, CELL, CELL);
        }

        rafId = requestAnimationFrame(tick);
    }
}());
