/**
 * Al-Khorazmiy International School
 * Main Client Scripts: UI, i18n switcher, Theme, Sliders, Lightbox & Form
 */

/* ==========================================================
       1. 3D RAY-LIT CINEMA STUDIO INTRO (3.0s WEBGL GPU ENGINE)
       ========================================================== */
    (function initNetflixIntro() {
        const introOverlay = document.getElementById('netflixIntro');
        const canvas = document.getElementById('introWebglCanvas');
        const imgEl = document.getElementById('introEmblemTex');
        if (!introOverlay) return;

        const params = new URLSearchParams(window.location.search);
        const freezeParam = params.get('intro_freeze');
        const freezeTime = freezeParam !== null ? parseFloat(freezeParam) : null;

        let introClosed = false;
        let rafId = 0;
        let glRef = null;

        function closeNetflixIntro() {
            if (introClosed || freezeTime !== null) return;
            introClosed = true;
            introOverlay.classList.add('hide');
            document.body.classList.remove('intro-playing');

            setTimeout(() => {
                if (rafId) cancelAnimationFrame(rafId);
                introOverlay.style.display = 'none';
                if (glRef) {
                    const ext = glRef.getExtension('WEBGL_lose_context');
                    if (ext) ext.loseContext();
                }
            }, 500);
        }

        document.body.classList.add('intro-playing');

        const gl = canvas ? (canvas.getContext('webgl', {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: freezeTime !== null
        }) || canvas.getContext('experimental-webgl')) : null;

        if (!gl) {
            introOverlay.classList.add('no-webgl');
            if (freezeTime === null) setTimeout(closeNetflixIntro, 2520);
            return;
        }
        glRef = gl;

        const vsSource = `
            attribute vec2 aPos;
            void main() {
                gl_Position = vec4(aPos, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision highp float;
            uniform vec2 uRes;
            uniform float uTime;
            uniform sampler2D uTex;

            float hash21(vec2 p) {
                p = fract(p * vec2(123.34, 456.21));
                p += dot(p, p + 45.32);
                return fract(p.x * p.y);
            }

            float sampleMetal(vec2 uv) {
                if (uv.x < 0.015 || uv.x > 0.985 || uv.y < 0.015 || uv.y > 0.985) return 0.0;
                float a = texture2D(uTex, uv).a;
                return clamp((a - 0.504) / 0.496, 0.0, 1.0);
            }

            vec3 sampleSceneRGB(vec2 uv) {
                vec2 cuv = clamp(uv, 0.002, 0.998);
                vec3 rgb = texture2D(uTex, cuv).rgb;
                // Smooth outer falloff outside unit square so 21:9 / 9:16 has ZERO seam
                vec2 over = max(abs(uv - 0.5) - 0.48, 0.0);
                float outDist = length(over);
                vec3 deepObsidian = vec3(0.011, 0.055, 0.068);
                return mix(rgb, deepObsidian * 0.65, clamp(outDist * 6.0, 0.0, 1.0));
            }

            void main() {
                float t = uTime;

                // Top-down aspect-normalized coordinates centered at screen midpoint
                vec2 fragTop = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
                float minDim = min(uRes.x, uRes.y);
                vec2 p = (fragTop - 0.5 * uRes) / minDim;

                // Responsive framing (desktop 16:9 vs mobile portrait)
                float aspect = uRes.x / max(uRes.y, 1.0);
                float baseFit = mix(1.18, 0.92, clamp((aspect - 0.58) / 0.95, 0.0, 1.0));

                // 3D Cinema Camera Trajectory:
                // 0.0s -> 1.85s: Monumental 3D upward tilt straightening into heroic front view + smooth dolly
                // 2.28s -> 3.00s: Netflix / IMAX portal dive right through the glowing emblem center
                float tiltEase = 1.0 - smoothstep(0.0, 1.80, t);
                float tilt = 0.16 * tiltEase * tiltEase;

                float dolly = mix(0.86, 1.05, smoothstep(0.0, 2.30, t));
                float warpPhase = smoothstep(2.26, 3.00, t);
                float warpZoom = exp(warpPhase * warpPhase * 1.65);
                float totalZoom = baseFit * dolly * warpZoom;

                // Pivot slightly moves toward emblem heart (0.5, 0.455) during portal dive
                vec2 centerTex = mix(vec2(0.500, 0.542), vec2(0.500, 0.455), warpPhase);

                // Project onto 3D tilted monument plane
                vec2 pWarped = p / max(1.0 + p.y * tilt, 0.35);
                vec2 texUv = pWarped / totalZoom + centerTex;

                // Subtle optical chromatic dispersion ONLY at outer rim during final warp dive
                float disp = warpPhase * warpPhase * 0.014 * length(p);
                vec2 dirP = normalize(p + vec2(1e-5));

                vec3 baseRGB;
                if (disp > 0.0002) {
                    baseRGB.r = sampleSceneRGB(texUv + dirP * disp).r;
                    baseRGB.g = sampleSceneRGB(texUv).g;
                    baseRGB.b = sampleSceneRGB(texUv - dirP * disp).b;
                } else {
                    baseRGB = sampleSceneRGB(texUv);
                }

                float metal = sampleMetal(texUv);

                // 4-tap central difference for exact 3D bevel edge & surface normal
                float eps = 1.4 / 1254.0;
                float mR = sampleMetal(texUv + vec2(eps, 0.0));
                float mL = sampleMetal(texUv - vec2(eps, 0.0));
                float mD = sampleMetal(texUv + vec2(0.0, eps));
                float mU = sampleMetal(texUv - vec2(0.0, eps));
                vec2 grad = vec2(mR - mL, mD - mU);
                float rim = clamp(length(grad) * 2.35, 0.0, 1.0);
                vec3 normal = normalize(vec3(-grad.x * 5.8, -grad.y * 5.8, 1.0));

                // =====================================================
                // ACT I (0.00s - 0.95s): LASER BEVEL IGNITION IN DARKNESS
                // =====================================================
                vec2 heart = vec2(0.500, 0.448);
                float isTypo = smoothstep(0.615, 0.635, texUv.y);

                // Emblem ignites radially from heart; Typography ignites outward from center diamond
                float distEmblem = length((texUv - heart) * vec2(0.92, 1.22));
                float distTypo = abs(texUv.x - 0.500) * 1.15 + max(0.0, texUv.y - 0.64) * 0.85;

                float waveEmblem = smoothstep(0.02, 0.82, t) * 0.56;
                float waveTypo = smoothstep(0.22, 1.05, t) * 0.62;

                float distActive = mix(distEmblem, distTypo, isTypo);
                float waveActive = mix(waveEmblem, waveTypo, isTypo);

                // Razor-hot shockwave front tracing 3D metal bevels
                float frontWidth = 0.068;
                float shockFront = exp(-pow((distActive - waveActive) / frontWidth, 2.0))
                                 * smoothstep(0.0, 0.07, t)
                                 * (1.0 - smoothstep(0.82, 1.28, t));

                float rimRevealed = smoothstep(waveActive + 0.03, waveActive - 0.06, distActive);

                // =====================================================
                // ACT II (0.28s - 2.15s): STUDIO KEY-LIGHT & 3D PBR SPECULAR
                // =====================================================
                float studioReveal = smoothstep(0.18, 0.95, t - distActive * 0.62);
                // Ambient stage breath so dark emerald slate & cast shadows look lush and deep
                float stageLight = studioReveal * mix(0.95, 1.18, smoothstep(0.6, 1.8, t));

                vec3 col = baseRGB * stageLight;

                // 3D Orbiting Cinema Point-Light (glints across curved rings, spheres, wings & serifs)
                float lightProg = smoothstep(0.20, 2.10, t);
                vec3 lightPos = vec3(
                    mix(-0.58, 0.62, lightProg),
                    mix(0.26, 0.72, lightProg),
                    0.36
                );
                vec3 fragPos3 = vec3(texUv - 0.5, 0.0);
                vec3 L = normalize(lightPos - fragPos3);
                vec3 V = vec3(0.0, 0.0, 1.0);
                vec3 H = normalize(L + V);

                float ndoth = max(dot(normal, H), 0.0);
                float pbrSpec = pow(ndoth, 24.0) * metal * smoothstep(0.15, 0.55, t);
                float pbrRim  = pow(ndoth, 8.0) * rim * smoothstep(0.10, 0.50, t);

                // Diagonal Luxury Swiss-Watch Specular Sheen Bar across brushed metal
                float sheenProg = mix(-0.35, 1.45, smoothstep(0.62, 1.88, t));
                float diagCoord = (texUv.x - 0.5) * 0.86 + (texUv.y - 0.52) * 0.51 + 0.5;
                float sheenBar = exp(-pow((diagCoord - sheenProg) / 0.065, 2.0))
                               * smoothstep(0.55, 0.78, t)
                               * (1.0 - smoothstep(1.70, 2.05, t));

                // Electric plasma shimmer along wing bevels (0.75s - 1.95s)
                float wingZone = (1.0 - isTypo) * smoothstep(0.08, 0.25, abs(texUv.x - 0.5));
                float arcWave = sin(texUv.x * 58.0 - t * 14.0 + sin(texUv.y * 42.0 + t * 9.0) * 1.8);
                float electricArc = pow(max(arcWave, 0.0), 10.0) * rim * wingZone
                                  * smoothstep(0.65, 1.05, t) * (1.0 - smoothstep(1.65, 2.15, t));

                // Combine Metallic Reflections (24K Gold + Bright Emerald-Cyan + Platinum Silver)
                vec3 goldCol    = vec3(1.00, 0.84, 0.34);
                vec3 emeraldCol = vec3(0.16, 0.96, 0.84);
                vec3 silverCol  = vec3(0.92, 0.99, 1.00);

                // Act I ignition glow on 3D bevels
                col += rim * shockFront * mix(goldCol, emeraldCol, 0.42) * 2.15;
                col += rim * rimRevealed * (1.0 - studioReveal * 0.72) * emeraldCol * 0.65;

                // Act II 3D PBR + Sheen + Electric Bevel Filaments
                col += pbrSpec * mix(silverCol, goldCol, 0.35) * 0.85;
                col += pbrRim  * emeraldCol * 0.42;
                col += metal * sheenBar * mix(silverCol, goldCol, 0.45) * 0.78;
                col += electricArc * mix(emeraldCol, silverCol, 0.5) * 1.35;

                // =====================================================
                // ACT III (1.15s - 3.00s): VOLUMETRIC NETFLIX PRISM GOD-RAYS
                // =====================================================
                float rayEnv = smoothstep(0.95, 1.85, t) * (0.85 + warpPhase * 1.55);
                if (rayEnv > 0.005) {
                    vec2 rayOrigin = heart;
                    vec2 delta = (texUv - rayOrigin) * (0.64 / 18.0);
                    vec2 sUv = texUv;
                    float accum = 0.0;
                    float goldBias = 0.0;
                    float decay = 1.0;

                    for (int i = 0; i < 18; i++) {
                        sUv -= delta;
                        float mS = sampleMetal(sUv);
                        vec2 dC = (sUv - rayOrigin) * vec2(0.85, 1.25);
                        float core = exp(-length(dC) * 4.6);
                        float ang = atan(dC.y, dC.x);
                        // Shimmering Netflix angular light ribbons
                        float rib1 = 0.5 + 0.5 * sin(ang * 12.0 + t * 2.8);
                        float rib2 = 0.5 + 0.5 * cos(ang * 7.0 - t * 2.1);
                        float ribbon = 0.45 + 0.55 * rib1 * rib2;
                        // Metal wings & rings project bright volumetric shafts!
                        float emitter = core * ribbon * (0.22 + 0.78 * mS);
                        accum += emitter * decay;
                        goldBias += emitter * rib2 * decay;
                        decay *= 0.915;
                    }
                    accum /= 18.0;
                    goldBias /= max(accum * 18.0, 0.001);

                    vec3 rayColor = mix(vec3(0.06, 0.78, 0.72), vec3(1.0, 0.78, 0.28), clamp(goldBias * 0.85, 0.0, 1.0));
                    // Screen-like volumetric add (stronger in air around metal so metal detail stays razor-crisp!)
                    col += rayColor * accum * rayEnv * (1.35 - 0.45 * metal);
                }

                // =====================================================
                // CINEMA ANAMORPHIC LENS FLARE & FLOATING STARDUST BOKEH
                // =====================================================
                // Initial ignition star + climax center flare
                float sparkEnv = exp(-pow((t - 0.14) / 0.14, 2.0)) * 0.95
                               + exp(-pow((t - 2.25) / 0.42, 2.0)) * 0.75
                               + warpPhase * 0.95;
                vec2 dHeart = texUv - heart;
                float anamorphicLine = exp(-abs(dHeart.y) * 155.0) * exp(-abs(dHeart.x) * 3.1);
                float coreGlow = exp(-length(dHeart * vec2(1.0, 1.35)) * 11.0);
                col += (anamorphicLine * mix(emeraldCol, goldCol, 0.4) * 0.65 + coreGlow * silverCol * 0.42) * sparkEnv;

                // Subtle crisp 3D floating golden/emerald dust motes
                vec2 dustUv = p * (3.2 - warpPhase * 0.9);
                dustUv.y += t * 0.07;
                vec2 cell = floor(dustUv * 9.0);
                vec2 fUv = fract(dustUv * 9.0) - 0.5;
                float rnd = hash21(cell);
                if (rnd > 0.62) {
                    vec2 jitter = vec2(fract(rnd * 13.7) - 0.5, fract(rnd * 29.3) - 0.5) * 0.55;
                    jitter.y += sin(t * 2.2 + rnd * 6.28) * 0.08;
                    float dMote = length(fUv - jitter);
                    float mote = smoothstep(0.045, 0.008, dMote) * smoothstep(0.15, 0.8, t);
                    vec3 moteCol = mix(emeraldCol, goldCol, fract(rnd * 7.1));
                    col += mote * moteCol * 0.38;
                }

                // Final Portal Flash bloom right at exit (2.68s -> 3.00s) for silky transition
                float exitBloom = smoothstep(2.62, 3.00, t);
                col += mix(emeraldCol, silverCol, 0.6) * exitBloom * exitBloom * 0.55;

                // Filmic ACES-inspired soft shoulder tone-mapping (prevents harsh clipping, keeps colors rich!)
                col = max(col, 0.0);
                col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);

                // Subtle cinema vignette
                float vig = 1.0 - dot(p * 0.62, p * 0.62);
                col *= clamp(vig, 0.42, 1.0);

                gl_FragColor = vec4(col, 1.0);
            }
        `;

        function compileShader(type, src) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error('Intro shader error:', gl.getShaderInfoLog(s));
                gl.deleteShader(s);
                return null;
            }
            return s;
        }

        const vs = compileShader(gl.VERTEX_SHADER, vsSource);
        const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) {
            introOverlay.classList.add('no-webgl');
            if (freezeTime === null) setTimeout(closeNetflixIntro, 2520);
            return;
        }

        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            introOverlay.classList.add('no-webgl');
            if (freezeTime === null) setTimeout(closeNetflixIntro, 2520);
            return;
        }
        gl.useProgram(prog);

        // Fullscreen triangle (faster & cleaner than 2-triangle quad)
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        const uRes = gl.getUniformLocation(prog, 'uRes');
        const uTime = gl.getUniformLocation(prog, 'uTime');
        const uTex = gl.getUniformLocation(prog, 'uTex');

        function resizeCanvas() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.max(1, Math.floor(window.innerWidth * dpr));
            const h = Math.max(1, Math.floor(window.innerHeight * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
            }
            gl.uniform2f(uRes, canvas.width, canvas.height);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas, { passive: true });

        function startRenderLoop(sourceImage) {
            const tex = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceImage);
            gl.uniform1i(uTex, 0);

            const startTs = performance.now();
            // Total intro duration = exactly 3.00s (fade out starts at 2.52s + 0.48s CSS transition = 3.00s)
            if (freezeTime === null) {
                setTimeout(closeNetflixIntro, 2520);
            }

            function render(now) {
                if (introClosed && freezeTime === null) return;
                resizeCanvas();
                const elapsed = freezeTime !== null ? freezeTime : (now - startTs) * 0.001;
                gl.uniform1f(uTime, elapsed);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                if (freezeTime === null) {
                    rafId = requestAnimationFrame(render);
                }
            }
            rafId = requestAnimationFrame(render);
        }

        if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
            startRenderLoop(imgEl);
        } else if (imgEl) {
            imgEl.addEventListener('load', () => startRenderLoop(imgEl), { once: true });
            imgEl.addEventListener('error', () => {
                introOverlay.classList.add('no-webgl');
                if (freezeTime === null) setTimeout(closeNetflixIntro, 2520);
            }, { once: true });
        } else {
            closeNetflixIntro();
        }
    })();

/* ==========================================================
       2. TRANSLATION ENGINE - INSTANT & BULLETPROOF
       ========================================================== */
    function setLanguage(lang) {
        if (!I18N[lang]) lang = 'uz';
        localStorage.setItem('al_lang', lang);
        document.documentElement.lang = lang;
        
        const dict = I18N[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.innerHTML = dict[key];
            }
        });
        
        // Update flags and active status
        const flagSvgs = { uz: 'flag_uz.svg', ru: 'flag_ru.svg', en: 'flag_gb.svg' };
        const labels = { uz: 'UZ', ru: 'RU', en: 'EN' };
        
        const langFlag = document.getElementById('langFlag');
        const langLabel = document.getElementById('langLabel');
        if (langFlag) {
            langFlag.src = flagSvgs[lang] || 'flag_uz.svg';
            langFlag.alt = labels[lang] || 'UZ';
        }
        if (langLabel) langLabel.textContent = labels[lang] || 'UZ';
        
        document.querySelectorAll('.lang-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-lang') === lang);
        });
    }

    // Initialize Lang
    const savedLang = localStorage.getItem('al_lang') || 'uz';
    setLanguage(savedLang);

    // Lang Dropdown Events
    const langWrap = document.getElementById('langWrap');
    const langBtn = document.getElementById('langToggleBtn');
    const langBox = document.getElementById('langBox');

    if (langBtn && langBox) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langBox.classList.toggle('show');
        });
        
        document.querySelectorAll('.lang-item').forEach(item => {
            item.addEventListener('click', () => {
                const lang = item.getAttribute('data-lang');
                setLanguage(lang);
                langBox.classList.remove('show');
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!langWrap.contains(e.target)) {
                langBox.classList.remove('show');
            }
        });
    }

    /* ==========================================================
       3. 10/10 DARK & LIGHT THEME TOGGLE
       ========================================================== */
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const htmlEl = document.documentElement;

    function applyTheme(isDark) {
        if (isDark) {
            htmlEl.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
            localStorage.setItem('al_theme', 'dark');
        } else {
            htmlEl.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
            localStorage.setItem('al_theme', 'light');
        }
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('al_theme') || 'light';
    applyTheme(savedTheme === 'dark');

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isCurrentDark = htmlEl.getAttribute('data-theme') === 'dark';
            applyTheme(!isCurrentDark);
        });
    }

    /* ==========================================================
       4. REELS VIDEO AUTO-PAUSE & RESTART FROM 0s
       ========================================================== */
    const reelItems = document.querySelectorAll('.reel-item');
    
    // Intersection Observer to Pause when Scrolled Away
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                const item = entry.target;
                const video = item.querySelector('video');
                if (video && !video.paused) {
                    video.pause();
                    item.classList.remove('is-playing');
                    video.removeAttribute('controls');
                }
            }
        });
    }, { threshold: 0.15 });

    reelItems.forEach(item => {
        const video = item.querySelector('video');
        if (!video) return;
        
        videoObserver.observe(item);

        item.addEventListener('click', (e) => {
            if (e.target === video && !video.paused) return;
            
            if (video.paused) {
                // Pause all other videos and reset to preview frame
                document.querySelectorAll('.reel-item video').forEach(v => {
                    if (v !== video) {
                        v.pause();
                        v.currentTime = 0.1;
                        v.parentElement.classList.remove('is-playing');
                        v.removeAttribute('controls');
                    }
                });
                
                video.currentTime = 0; // Restart from 0s on each play
                video.play().then(() => {
                    item.classList.add('is-playing');
                    video.setAttribute('controls', 'controls');
                }).catch(() => {});
            } else {
                video.pause();
                video.currentTime = 0.1;
                item.classList.remove('is-playing');
                video.removeAttribute('controls');
            }
        });
        
        video.addEventListener('ended', () => {
            item.classList.remove('is-playing');
            video.removeAttribute('controls');
            video.currentTime = 0.1;
        });
    });

    /* ==========================================================
       5. MOBILE MENU & NAVIGATION
       ========================================================== */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');

    function closeMobile() {
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (mobileOverlay) mobileOverlay.classList.remove('open');
    }

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            mobileOverlay.classList.add('open');
        });
    }
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobile);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobile);

    document.querySelectorAll('.mobile-nav-links a').forEach(a => {
        a.addEventListener('click', closeMobile);
    });

    // Active Nav Indicator on Scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links > li > a');
    
    window.addEventListener('scroll', () => {
        let cur = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 140) cur = s.id;
        });
        navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
        });
        
        const btt = document.getElementById('backToTop');
        if (btt) {
            btt.classList.toggle('visible', window.scrollY > 400);
        }
    }, { passive: true });

    const btt = document.getElementById('backToTop');
    if (btt) {
        btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    /* ==========================================================
       6. APPLICATION FORM & SECURE BACKEND INTEGRATION
       Applications are securely submitted via bot.py /api/apply
       No Telegram tokens or private credentials exposed to client!
       ========================================================== */
    function escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function capitalizeWords(str) {
        if (!str) return "";
        return str.replace(/(^|[\s\-'ʻ`’])([a-zа-яўқғҳ])/gi, (m, prefix, char) => prefix + char.toUpperCase());
    }

    function formatPhoneNumber(val) {
        let digits = val.replace(/\D/g, '');
        if (!digits.startsWith('998')) {
            digits = '998' + digits;
        }
        digits = digits.substring(0, 12);

        let res = '+998';
        if (digits.length > 3) res += ' ' + digits.substring(3, 5);
        if (digits.length > 5) res += ' ' + digits.substring(5, 8);
        if (digits.length > 8) res += ' ' + digits.substring(8, 10);
        if (digits.length > 10) res += ' ' + digits.substring(10, 12);
        return res;
    }

    const form = document.getElementById('admissionForm');
    const modal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const parentInput = document.getElementById('parentName');
    const childInput = document.getElementById('childName');
    const phoneInput = document.getElementById('phoneNumber');

    // Auto capitalize names on typing
    [parentInput, childInput].forEach(inp => {
        if (!inp) return;
        inp.addEventListener('input', () => {
            const start = inp.selectionStart;
            const end = inp.selectionEnd;
            const original = inp.value;
            const capitalized = capitalizeWords(original);
            if (original !== capitalized) {
                inp.value = capitalized;
                inp.setSelectionRange(start, end);
            }
        });
        inp.addEventListener('blur', () => {
            inp.value = capitalizeWords(inp.value.trim());
        });
    });

    // Auto format phone number with +998 prefix
    if (phoneInput) {
        if (!phoneInput.value || !phoneInput.value.startsWith('+998')) {
            phoneInput.value = '+998 ';
        }

        phoneInput.addEventListener('input', () => {
            phoneInput.value = formatPhoneNumber(phoneInput.value);
        });

        phoneInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && phoneInput.selectionStart <= 5 && phoneInput.selectionEnd <= 5) {
                e.preventDefault();
            }
        });

        phoneInput.addEventListener('focus', () => {
            if (!phoneInput.value || !phoneInput.value.startsWith('+998')) {
                phoneInput.value = '+998 ';
            }
            setTimeout(() => {
                if (phoneInput.selectionStart < 5) {
                    phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
                }
            }, 0);
        });

        phoneInput.addEventListener('click', () => {
            if (phoneInput.selectionStart < 5) {
                phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
            }
        });
    }

    if (form) {
        form.addEventListener('reset', () => {
            setTimeout(() => {
                if (phoneInput) phoneInput.value = '+998 ';
            }, 0);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const parent = capitalizeWords(document.getElementById('parentName').value.trim());
            const child = capitalizeWords(document.getElementById('childName').value.trim());
            const phone = document.getElementById('phoneNumber').value.trim();
            const grade = document.getElementById('gradeLevel').value;

            const curLang = localStorage.getItem('al_lang') || 'uz';
            const dict = (typeof I18N !== 'undefined' && I18N[curLang]) ? I18N[curLang] : {};

            if (!parent || !child || !phone || !grade) {
                alert(dict.form_err_fill || "Iltimos, barcha majburiy maydonlarni to'ldiring!");
                return;
            }

            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length < 12) {
                alert(dict.form_err_phone || "Iltimos, telefon raqamingizni to'liq kiriting (masalan: +998 90 123 45 67)!");
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                const sendingText = dict.form_sending || 'Yuborilmoqda...';
                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${sendingText}`;
            }

            try {
                const now = new Date();
                const timeStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                                ' ' + now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

                // Backend API endpoint (securely routed via bot.py server)
                const isLocalFile = window.location.protocol === 'file:';
                const apiUrl = isLocalFile || window.location.port !== '5000'
                    ? 'http://localhost:5000/api/apply'
                    : '/api/apply';

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            parent: parent,
                            child: child,
                            phone: phone,
                            grade: grade,
                            time: timeStr
                        })
                    });

                    if (response.ok) {
                        const resData = await response.json();
                        if (resData.botDeepLink) {
                            const modalBotLink = document.getElementById('modalBotLink');
                            if (modalBotLink) {
                                modalBotLink.href = resData.botDeepLink;
                            }
                        }
                    }
                } catch (fetchErr) {
                    console.warn("Backend serverga ulanishda ogohlantirish (bot.py ishga tushirilganligini tekshiring):", fetchErr);
                }

                modal.classList.add('show');
                form.reset();
                if (phoneInput) phoneInput.value = '+998 ';
            } catch (err) {
                console.error("Xatolik:", err);
                modal.classList.add('show');
                form.reset();
                if (phoneInput) phoneInput.value = '+998 ';
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.classList.remove('show'));
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
    }

    /* ==========================================================
       7. INTERACTIVE SLIDESHOW & FULLSCREEN LIGHTBOX
       ========================================================== */
    function initSlider(trackId, prevBtnId, nextBtnId, dotsId, autoSlideTime = 2200) {
        const track = document.getElementById(trackId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const dotsContainer = dotsId ? document.getElementById(dotsId) : null;
        if (!track) return;

        let activeOriginals = [];
        let totalOriginals = 0;

        function buildTrackForFilter(filter = 'all') {
            // Remove existing clones
            track.querySelectorAll('.slide-card[data-cloned="true"]').forEach(el => el.remove());

            const allOriginals = Array.from(track.querySelectorAll('.slide-card:not([data-cloned])'));
            activeOriginals = [];

            allOriginals.forEach(c => {
                const cat = c.getAttribute('data-cat');
                const match = (filter === 'all' || !cat || cat === filter);
                c.style.display = match ? '' : 'none';
                if (match) activeOriginals.push(c);
            });

            totalOriginals = activeOriginals.length;
            if (totalOriginals === 0) return;

            activeOriginals.forEach((c, idx) => {
                c.setAttribute('data-index', idx);
                const clone = c.cloneNode(true);
                clone.setAttribute('data-cloned', 'true');
                clone.setAttribute('data-index', idx);
                track.appendChild(clone);
            });

            if (dotsContainer) {
                dotsContainer.innerHTML = '';
                activeOriginals.forEach((_, idx) => {
                    const dot = document.createElement('div');
                    dot.className = 'slider-dot' + (idx === 0 ? ' active' : '');
                    dot.addEventListener('click', () => {
                        const step = getCardStep();
                        track.scrollTo({ left: idx * step, behavior: 'smooth' });
                        resetAuto();
                    });
                    dotsContainer.appendChild(dot);
                });
            }

            track.style.scrollBehavior = 'auto';
            track.scrollLeft = 0;
            track.style.scrollBehavior = '';
            bindTrackLightbox(track);
        }

        function getCardStep() {
            const first = activeOriginals[0] || track.querySelector('.slide-card');
            if (!first) return 298;
            const style = window.getComputedStyle(track);
            const gap = parseFloat(style.gap) || 18;
            return first.offsetWidth + gap;
        }

        function getOriginalsWidth() {
            return getCardStep() * totalOriginals;
        }

        function updateDots() {
            if (!dotsContainer || totalOriginals === 0) return;
            const step = getCardStep();
            const currentIdx = Math.round(track.scrollLeft / step) % totalOriginals;
            dotsContainer.querySelectorAll('.slider-dot').forEach((d, i) => {
                d.classList.toggle('active', i === currentIdx);
            });
        }

        function handleScrollWrap() {
            if (totalOriginals === 0) return;
            const origWidth = getOriginalsWidth();
            if (origWidth > 0 && track.scrollLeft >= origWidth) {
                track.style.scrollBehavior = 'auto';
                track.scrollLeft -= origWidth;
                track.style.scrollBehavior = '';
            }
            updateDots();
        }

        track.addEventListener('scroll', handleScrollWrap, { passive: true });

        function slideNext() {
            if (totalOriginals === 0) return;
            const step = getCardStep();
            const origWidth = getOriginalsWidth();
            if (track.scrollLeft >= origWidth - 10) {
                track.style.scrollBehavior = 'auto';
                track.scrollLeft -= origWidth;
                track.style.scrollBehavior = '';
            }
            track.scrollBy({ left: step, behavior: 'smooth' });
        }

        function slidePrev() {
            if (totalOriginals === 0) return;
            const step = getCardStep();
            const origWidth = getOriginalsWidth();
            if (track.scrollLeft <= 10) {
                track.style.scrollBehavior = 'auto';
                track.scrollLeft += origWidth;
                track.style.scrollBehavior = '';
            }
            track.scrollBy({ left: -step, behavior: 'smooth' });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                slideNext();
                resetAuto();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                slidePrev();
                resetAuto();
            });
        }

        let timer = null;
        let isPaused = false;

        function startAuto() {
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
                if (!isPaused) {
                    slideNext();
                }
            }, autoSlideTime);
        }

        function resetAuto() {
            startAuto();
        }

        track.addEventListener('mouseenter', () => { isPaused = true; });
        track.addEventListener('mouseleave', () => { isPaused = false; });
        track.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
        track.addEventListener('touchend', () => {
            setTimeout(() => { isPaused = false; }, 1500);
        }, { passive: true });

        buildTrackForFilter('all');
        startAuto();

        return { filterBy: buildTrackForFilter, resetAuto };
    }

    // Lightbox Modal Logic
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    let allLightboxItems = [];
    let currentLightboxIdx = 0;

    function openLightbox(items, index) {
        allLightboxItems = items;
        currentLightboxIdx = index;
        updateLightboxContent();
        lightboxModal.classList.add('show');
    }

    function updateLightboxContent() {
        if (!allLightboxItems.length) return;
        const item = allLightboxItems[currentLightboxIdx];
        lightboxImg.src = item.src;
        lightboxCaption.innerHTML = item.title + ' <span style="opacity:0.6;font-size:13px;margin-left:8px;">(' + (currentLightboxIdx + 1) + ' / ' + allLightboxItems.length + ')</span>';
    }

    function bindTrackLightbox(track) {
        track.querySelectorAll('.slide-card').forEach((card) => {
            card.onclick = () => {
                const visibleOriginals = Array.from(track.querySelectorAll('.slide-card:not([data-cloned])')).filter(c => c.style.display !== 'none');
                const items = visibleOriginals.map(c => ({
                    src: c.getAttribute('data-src'),
                    title: (c.querySelector('.slide-card-title') && c.querySelector('.slide-card-title').textContent.trim()) || c.getAttribute('data-title')
                }));
                const index = parseInt(card.getAttribute('data-index') || 0);
                openLightbox(items, index);
            };
        });
    }

    const awardsSlider = initSlider('awardsTrack', 'awardsPrevBtn', 'awardsNextBtn', 'awardsDots', 2200);
    initSlider('facTrack', 'facPrevBtn', 'facNextBtn', null, 2800);

    // Subject Filter Tabs for Awards
    const filterTabs = document.querySelectorAll('#awardsFilterTabs .award-tab-btn');
    filterTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            filterTabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter') || 'all';
            if (awardsSlider) {
                awardsSlider.filterBy(filter);
                awardsSlider.resetAuto();
            }
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => lightboxModal.classList.remove('show'));
    }
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) lightboxModal.classList.remove('show');
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            currentLightboxIdx = (currentLightboxIdx + 1) % allLightboxItems.length;
            updateLightboxContent();
        });
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            currentLightboxIdx = (currentLightboxIdx - 1 + allLightboxItems.length) % allLightboxItems.length;
            updateLightboxContent();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (!lightboxModal.classList.contains('show')) return;
        if (e.key === 'Escape') lightboxModal.classList.remove('show');
        if (e.key === 'ArrowRight') lightboxNext.click();
        if (e.key === 'ArrowLeft') lightboxPrev.click();
    });


    /* ==========================================================
       8. JAHON SCHOOL STYLE SCROLL OBSERVER (SMOOTH SIDE SLIDES)
       ========================================================== */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
    });

    document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up, .reveal-zoom').forEach(el => {
        revealObserver.observe(el);
    });

    // Trigger hero animations on page load
    setTimeout(() => {
        document.querySelectorAll('#hero .reveal-left, #hero .reveal-right').forEach(el => {
            el.classList.add('revealed');
        });
    }, 150);


    /* ==========================================================
       9. FAQ ACCORDION INTERACTION (+ / - TOGGLE & KEYBOARD A11Y)
       ========================================================== */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const header = item.querySelector('.faq-header');
        if (!header) return;

        const toggleFaq = () => {
            const isOpen = item.classList.contains('active');
            
            // Close other items
            faqItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove('active');
                    const otherHeader = other.querySelector('.faq-header');
                    if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active', !isOpen);
            header.setAttribute('aria-expanded', String(!isOpen));
        };

        header.addEventListener('click', toggleFaq);
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFaq();
            }
        });
    });
