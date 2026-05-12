(function () {
    const DITHER_FG = [0.102, 0.102, 0.102]; /* #1a1a1a */
    const DITHER_BG = [0.0,   0.0,   0.0  ]; /* #000000 */
    const MAX_CLICKS = 30;

    const canvas = document.getElementById('dither-bg');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `
        attribute vec2 a_pos;
        void main() { gl_Position = vec4(a_pos, 0, 1); }
    `;

    const fs = `
        precision mediump float;
        uniform vec2  u_res;
        uniform float u_time;
        uniform float u_dpr;
        uniform vec3  u_fg;
        uniform vec3  u_bg;
        uniform vec2  u_mouse;
        uniform sampler2D u_bayer;
        uniform vec4  u_clicks[${MAX_CLICKS}];

        /* --- 2D Simplex Noise --- */
        vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
        vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                               -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = x0.x > x0.y ? vec2(1.0,0.0) : vec2(0.0,1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                           + i.x + vec3(0.0, i1.x, 1.0));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                    dot(x12.zw,x12.zw)), 0.0);
            m = m * m * m * m;
            vec3 x  = 2.0 * fract(p * C.www) - 1.0;
            vec3 h  = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x  = a0.x  * x0.x   + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            float ps      = 4.0 * u_dpr;
            vec2 blockPos = floor(gl_FragCoord.xy / ps);
            vec2 snapped  = blockPos * ps;
            vec2 uv       = snapped / u_res;
            float aspect  = u_res.x / u_res.y;

            vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

            float ca = 0.69466, sa = 0.71934;
            p = vec2(ca*p.x - sa*p.y, sa*p.x + ca*p.y);

            p *= 0.4;
            p.x += 0.03;

            // Mouse influence
            vec2 mouseNorm = u_mouse / u_res;
            mouseNorm.y = 1.0 - mouseNorm.y;
            vec2 mouseCoord = vec2((mouseNorm.x - 0.5) * aspect, mouseNorm.y - 0.5);
            mouseCoord = vec2(ca*mouseCoord.x - sa*mouseCoord.y, sa*mouseCoord.x + ca*mouseCoord.y);
            mouseCoord *= 0.4;
            mouseCoord.x += 0.03;

            // Distance from mouse (creates pull/distortion)
            float mouseDist = length(p - mouseCoord);
            float mouseInfluence = exp(-mouseDist * 2.5) * 1.2;

            float t   = u_time * 0.45 * 0.15;
            float n   = snoise(p * 2.0 + vec2(t, t * 0.6));

            // Add strong mouse-based distortion
            vec2 distortion = (p - mouseCoord) * mouseInfluence * 0.8;
            n += snoise((p + distortion) * 2.0 + vec2(t, t * 0.6)) * mouseInfluence * 0.6;
            n += snoise((p - distortion * 0.5) * 2.0 + vec2(t, t * 0.6)) * mouseInfluence * 0.3;

            float lum = n * 0.5 + 0.5;

            // Add gray blobs at click/drag points
            for (int i = 0; i < ${MAX_CLICKS}; i++) {
                vec4 click = u_clicks[i];
                float click_age = u_time - click.z;
                if (click_age >= 0.0 && click_age < 4.0) {
                    vec2 c_uv = click.xy;
                    vec2 c_p = vec2((c_uv.x - 0.5) * aspect, c_uv.y - 0.5);
                    c_p = vec2(ca*c_p.x - sa*c_p.y, sa*c_p.x + ca*c_p.y);
                    c_p *= 0.4;
                    c_p.x += 0.03;

                    float dist = length(p - c_p);
                    float radius = 0.02 + click_age * 0.04;
                    float falloff = 1.0 - smoothstep(0.0, radius, dist);
                    float fade = 1.0 - smoothstep(0.0, 4.0, click_age);
                    lum += falloff * fade * 0.6;
                }
            }

            lum = smoothstep(0.42, 0.85, lum);

            float bayer = texture2D(u_bayer, blockPos / 8.0).r;
            float d     = step(bayer + 0.008, lum);

            gl_FragColor = vec4(mix(u_bg, u_fg, d), 1.0);
        }
    `;

    function makeShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const bayerVals = [
         0,32, 8,40, 2,34,10,42,
        48,16,56,24,50,18,58,26,
        12,44, 4,36,14,46, 6,38,
        60,28,52,20,62,30,54,22,
         3,35,11,43, 1,33, 9,41,
        51,19,59,27,49,17,57,25,
        15,47, 7,39,13,45, 5,37,
        63,31,55,23,61,29,53,21
    ];
    const bayerTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bayerTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 8, 8, 0,
        gl.LUMINANCE, gl.UNSIGNED_BYTE,
        new Uint8Array(bayerVals.map(v => Math.round(v / 63 * 255))));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.uniform1i(gl.getUniformLocation(prog, 'u_bayer'), 0);

    const uRes  = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uDpr  = gl.getUniformLocation(prog, 'u_dpr');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_fg'), DITHER_FG);
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_bg'), DITHER_BG);

    const uClicks = [];
    for (let i = 0; i < MAX_CLICKS; i++) {
        uClicks.push(gl.getUniformLocation(prog, `u_clicks[${i}]`));
    }
    const clicks = Array(MAX_CLICKS).fill(null).map(() => ({ x: 0, y: 0, time: -999 }));

    let dpr, w, h, start, currentTime = 0;
    let mouseX = 0, mouseY = 0;

    let isDragging = false;
    let lastSpawnX = 0, lastSpawnY = 0;
    const SPAWN_DIST = 40; // pixels between blob spawns while dragging

    function spawnBlob(clientX, clientY) {
        const x = clientX / window.innerWidth;
        const y = 1.0 - clientY / window.innerHeight;
        let oldestIdx = 0;
        for (let i = 1; i < MAX_CLICKS; i++) {
            if (clicks[i].time < clicks[oldestIdx].time) oldestIdx = i;
        }
        clicks[oldestIdx] = { x, y, time: currentTime };
        lastSpawnX = clientX;
        lastSpawnY = clientY;
    }

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX * (dpr || 1);
        mouseY = e.clientY * (dpr || 1);
        if (isDragging) {
            const dx = e.clientX - lastSpawnX;
            const dy = e.clientY - lastSpawnY;
            if (dx * dx + dy * dy >= SPAWN_DIST * SPAWN_DIST) {
                spawnBlob(e.clientX, e.clientY);
            }
        }
    }, { passive: true });

    window.addEventListener('mousedown', (e) => {
        isDragging = true;
        spawnBlob(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('blur', () => { isDragging = false; });

    function resize() {
        dpr = Math.min(window.devicePixelRatio, 2);
        w = Math.floor(window.innerWidth  * dpr);
        h = Math.floor(window.innerHeight * dpr);
        canvas.width  = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
        gl.uniform1f(uDpr, dpr);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    function frame(ts) {
        if (!start) start = ts;
        currentTime = (ts - start) / 1000;
        gl.uniform1f(uTime, currentTime);
        gl.uniform2f(uMouse, mouseX, mouseY);
        for (let i = 0; i < MAX_CLICKS; i++) {
            gl.uniform4f(uClicks[i], clicks[i].x, clicks[i].y, clicks[i].time, 0);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();
