# -*- coding: utf-8 -*-
import re

with open("scratch/emblem_paths.txt", "r", encoding="utf-8") as f:
    paths = [line.strip() for line in f if line.strip()]

svg_paths_html = "\n".join(
    f'                <path d="{p}" pathLength="1000" class="laser-path" />'
    for p in paths
)
svg_gold_paths_html = "\n".join(
    f'                <path d="{p}" pathLength="1000" class="laser-path-gold" />'
    for p in paths
)

new_html_block = f"""<!-- CINEMATIC LOGO INTRO SPLASH SCREEN (MAX 4.4s) -->
<div id="netflixIntro" class="netflix-intro-overlay" aria-label="Al-Khorazmiy kirish animatsiyasi">
    <canvas id="introParticleCanvas" class="intro-particle-canvas"></canvas>
    <div class="intro-god-rays"></div>
    <div class="intro-ambient-glow"></div>

    <div class="intro-cinema-stage" id="netflixIntroStage">
        <!-- Emblem Stage (620x325 exact aspect ratio) -->
        <div class="intro-emblem-wrap">
            <!-- Anamorphic Lens Flare at Center -->
            <div class="intro-lens-flare"></div>

            <!-- 1. Neon Laser Contour Tracing SVG -->
            <svg class="intro-laser-svg" viewBox="0 0 620 325" fill="none" xmlns="http://www.w3.org/2000/svg">
{svg_paths_html}
{svg_gold_paths_html}
            </svg>

            <!-- 2. 3D Sculpted Metallic Emerald Emblem -->
            <img src="intro_emblem_3d.webp" alt="Al-Xorazmiy Emblem" class="intro-emblem-3d">

            <!-- 3. Specular Light Sweep Masked to Emblem -->
            <div class="intro-emblem-sheen"></div>
        </div>

        <!-- Cinematic Typography Stage -->
        <div class="intro-typo-wrap">
            <div class="intro-main-name">AL-XORAZMIY</div>
            <div class="intro-sub-row">
                <span class="intro-sub-line left"></span>
                <span class="intro-sub-word">SCHOOL</span>
                <span class="intro-sub-line right"></span>
            </div>
            <div class="intro-motto-row">ILM &bull; TARBIYA &bull; INNOVATSIYA</div>
        </div>
    </div>
</div>"""

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

html, n1 = re.subn(
    r"<!-- CINEMATIC LOGO INTRO SPLASH SCREEN[\s\S]*?</div>\s*</div>",
    new_html_block,
    html,
    count=1
)
assert n1 == 1, f"Expected 1 replacement in index.html, got {n1}"
with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("index.html updated with Pro SVG + 3D Emblem Intro!")

new_css_block = """        /* ==========================================================
           PRO HOLLYWOOD / NETFLIX 3D & LASER LOGO INTRO (4.4s)
           ========================================================== */
        body.intro-playing {
            overflow: hidden !important;
        }
        .netflix-intro-overlay {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at 50% 45%, #072629 0%, #031114 55%, #010608 100%);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            perspective: 1200px;
            opacity: 1;
            transform: scale(1);
            transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
                        transform 0.85s cubic-bezier(0.7, 0, 0.2, 1),
                        filter 0.75s ease;
        }
        .netflix-intro-overlay.hide {
            opacity: 0;
            transform: scale(1.85);
            filter: blur(14px) brightness(1.5);
            pointer-events: none;
        }
        .intro-particle-canvas {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }
        .intro-god-rays {
            position: absolute;
            width: 140vmax;
            height: 140vmax;
            background: conic-gradient(
                from 0deg at 50% 50%,
                transparent 0deg,
                rgba(20, 184, 166, 0.06) 25deg,
                transparent 55deg,
                rgba(251, 191, 36, 0.04) 95deg,
                transparent 130deg,
                rgba(20, 184, 166, 0.07) 175deg,
                transparent 215deg,
                rgba(20, 184, 166, 0.05) 265deg,
                transparent 310deg,
                rgba(251, 191, 36, 0.04) 340deg,
                transparent 360deg
            );
            mask-image: radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%);
            -webkit-mask-image: radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%);
            animation: introRaysRotate 14s linear infinite;
            pointer-events: none;
            z-index: 2;
        }
        @keyframes introRaysRotate {
            0% { transform: rotate(0deg) scale(0.8); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: rotate(45deg) scale(1.1); opacity: 0.9; }
        }
        .intro-ambient-glow {
            position: absolute;
            width: min(650px, 90vw);
            height: min(650px, 90vw);
            border-radius: 50%;
            background: radial-gradient(circle, rgba(20, 184, 166, 0.28) 0%, rgba(8, 147, 145, 0.08) 45%, transparent 70%);
            filter: blur(20px);
            animation: introAmbientPulse 4.2s ease-out forwards;
            pointer-events: none;
            z-index: 2;
        }
        @keyframes introAmbientPulse {
            0% { opacity: 0; transform: scale(0.3); }
            35% { opacity: 1; transform: scale(1); }
            75% { opacity: 0.95; transform: scale(1.12); }
            100% { opacity: 0; transform: scale(1.4); }
        }
        .intro-cinema-stage {
            position: relative;
            z-index: 5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: min(520px, 88vw);
            animation: introCameraPush 4.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes introCameraPush {
            0% { transform: translateZ(-80px) scale(0.88); }
            75% { transform: translateZ(0px) scale(1.03); }
            100% { transform: translateZ(60px) scale(1.12); }
        }
        .intro-emblem-wrap {
            position: relative;
            width: 100%;
            aspect-ratio: 620 / 325;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        /* 1. Laser SVG Outline Drawing */
        .intro-laser-svg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            overflow: visible;
            z-index: 3;
            filter: drop-shadow(0 0 10px rgba(45, 212, 191, 0.9)) drop-shadow(0 0 24px rgba(8, 147, 145, 0.7));
            animation: laserSvgFadeOut 0.8s 1.9s ease-out forwards;
        }
        .laser-path {
            stroke: #5eead4;
            stroke-width: 2.8;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: laserTrace 1.55s 0.05s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .laser-path-gold {
            stroke: #fde047;
            stroke-width: 3.5;
            stroke-linecap: round;
            stroke-dasharray: 140 1000;
            stroke-dashoffset: 1000;
            filter: drop-shadow(0 0 12px #fbbf24);
            animation: laserSpark 1.5s 0.05s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes laserTrace {
            0% { stroke-dashoffset: 1000; opacity: 0.3; }
            15% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes laserSpark {
            0% { stroke-dashoffset: 1000; opacity: 1; }
            85% { opacity: 1; }
            100% { stroke-dashoffset: -140; opacity: 0; }
        }
        @keyframes laserSvgFadeOut {
            0% { opacity: 1; }
            100% { opacity: 0.18; }
        }
        /* 2. 3D Sculpted Metallic Emerald Emblem */
        .intro-emblem-3d {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            z-index: 2;
            opacity: 0;
            filter: drop-shadow(0 18px 38px rgba(0, 0, 0, 0.85))
                    drop-shadow(0 0 28px rgba(20, 184, 166, 0.45));
            animation: emblem3dReveal 1.3s 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes emblem3dReveal {
            0% {
                opacity: 0;
                transform: scale(0.95);
                filter: brightness(2.2) contrast(1.3) blur(6px) drop-shadow(0 0 45px rgba(45, 212, 191, 0.95));
            }
            60% {
                opacity: 1;
                transform: scale(1);
                filter: brightness(1.25) contrast(1.12) blur(0px) drop-shadow(0 14px 32px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 30px rgba(20, 184, 166, 0.65));
            }
            100% {
                opacity: 1;
                transform: scale(1);
                filter: brightness(1.12) contrast(1.08) blur(0px) drop-shadow(0 18px 38px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 22px rgba(20, 184, 166, 0.45));
            }
        }
        /* 3. Masked Metallic Specular Sheen Sweep */
        .intro-emblem-sheen {
            position: absolute;
            inset: 0;
            z-index: 4;
            pointer-events: none;
            -webkit-mask-image: url('../intro_emblem_3d.webp');
            mask-image: url('../intro_emblem_3d.webp');
            -webkit-mask-size: contain;
            mask-size: contain;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            background: linear-gradient(
                112deg,
                transparent 36%,
                rgba(255, 255, 255, 0.15) 44%,
                rgba(254, 240, 138, 0.85) 50%,
                rgba(255, 255, 255, 0.15) 56%,
                transparent 64%
            );
            background-size: 240% 100%;
            background-position: 160% 0;
            animation: emblemSheenSweep 1.35s 1.65s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes emblemSheenSweep {
            0% { background-position: 160% 0; }
            100% { background-position: -60% 0; }
        }
        /* 4. Anamorphic Horizontal Cinema Lens Flare */
        .intro-lens-flare {
            position: absolute;
            top: 56%;
            left: 50%;
            width: 130%;
            height: 3px;
            transform: translate(-50%, -50%) scaleX(0);
            background: linear-gradient(90deg, transparent 0%, rgba(45, 212, 191, 0.8) 25%, #ffffff 50%, rgba(251, 191, 36, 0.85) 75%, transparent 100%);
            box-shadow: 0 0 25px 4px rgba(45, 212, 191, 0.75), 0 0 55px 10px rgba(251, 191, 36, 0.45);
            border-radius: 50%;
            z-index: 6;
            opacity: 0;
            pointer-events: none;
            animation: anamorphicFlare 1.4s 1.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes anamorphicFlare {
            0% { opacity: 0; transform: translate(-50%, -50%) scaleX(0.05); }
            35% { opacity: 1; transform: translate(-50%, -50%) scaleX(1.05); }
            100% { opacity: 0; transform: translate(-50%, -50%) scaleX(1.35); }
        }
        /* 5. Cinematic Typography */
        .intro-typo-wrap {
            margin-top: 14px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        .intro-main-name {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: clamp(26px, 4.4vw, 44px);
            font-weight: 700;
            background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 55%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.9));
            opacity: 0;
            letter-spacing: 0.38em;
            transform: translateY(16px);
            animation: cinemaTitleIn 1.15s 1.05s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes cinemaTitleIn {
            0% {
                opacity: 0;
                letter-spacing: 0.42em;
                transform: translateY(18px) scale(0.94);
                filter: blur(8px) drop-shadow(0 6px 20px rgba(0, 0, 0, 0.9));
            }
            100% {
                opacity: 1;
                letter-spacing: 0.14em;
                transform: translateY(0) scale(1);
                filter: blur(0px) drop-shadow(0 6px 20px rgba(0, 0, 0, 0.9));
            }
        }
        .intro-sub-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-top: 8px;
            opacity: 0;
            animation: cinemaSubIn 0.95s 1.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes cinemaSubIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .intro-sub-word {
            font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
            font-size: clamp(13px, 2vw, 18px);
            font-weight: 600;
            color: #2dd4bf;
            letter-spacing: 0.48em;
            padding-left: 0.48em;
            text-shadow: 0 0 16px rgba(45, 212, 191, 0.55);
        }
        .intro-sub-line {
            height: 1.5px;
            width: 0;
            background: linear-gradient(90deg, transparent, #2dd4bf);
            box-shadow: 0 0 10px rgba(45, 212, 191, 0.7);
            animation: cinemaLineExpand 0.95s 1.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .intro-sub-line.right {
            background: linear-gradient(90deg, #2dd4bf, transparent);
        }
        @keyframes cinemaLineExpand {
            0% { width: 0; }
            100% { width: clamp(45px, 9vw, 85px); }
        }
        .intro-motto-row {
            margin-top: 14px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: clamp(10px, 1.4vw, 12.5px);
            font-weight: 700;
            letter-spacing: 0.32em;
            color: rgba(251, 191, 36, 0.88);
            text-shadow: 0 0 14px rgba(251, 191, 36, 0.4);
            opacity: 0;
            animation: cinemaSubIn 0.9s 1.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }"""

with open("css/style.css", "r", encoding="utf-8") as f:
    css = f.read()

css, n2 = re.subn(
    r"        /\* ==========================================================\s*CINEMATIC LOGO INTRO SPLASH SCREEN[\s\S]*?(?=\s*/\* Typography & Section Headers \*/)",
    new_css_block + "\n\n",
    css,
    count=1
)
assert n2 == 1, f"Expected 1 replacement in css/style.css, got {n2}"
with open("css/style.css", "w", encoding="utf-8") as f:
    f.write(css)
print("css/style.css updated with Pro Hollywood/Netflix CSS!")

new_js_block = """/* ==========================================================
       1. PRO HOLLYWOOD / NETFLIX 3D & LASER INTRO (4.4s < 5s)
       ========================================================== */
    (function initNetflixIntro() {
        const introOverlay = document.getElementById('netflixIntro');
        const canvas = document.getElementById('introParticleCanvas');
        if (!introOverlay) return;

        let introClosed = false;
        let animFrameId = null;

        // 60fps Cinema Bokeh & Spark Particle Engine
        if (canvas && canvas.getContext) {
            const ctx = canvas.getContext('2d');
            let cw = (canvas.width = window.innerWidth);
            let ch = (canvas.height = window.innerHeight);

            const particles = Array.from({ length: 46 }, (_, i) => {
                const isGold = i % 3 === 0;
                return {
                    x: Math.random() * cw,
                    y: Math.random() * ch,
                    r: Math.random() * 2.2 + 0.6,
                    vx: (Math.random() - 0.5) * 0.45,
                    vy: -Math.random() * 0.7 - 0.15,
                    alpha: Math.random() * 0.65 + 0.15,
                    color: isGold ? '251, 191, 36' : '45, 212, 191'
                };
            });

            function renderParticles() {
                if (introClosed) return;
                ctx.clearRect(0, 0, cw, ch);
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    if (p.y < -10) p.y = ch + 10;
                    if (p.x < -10) p.x = cw + 10;
                    if (p.x > cw + 10) p.x = -10;

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = `rgba(${p.color}, 0.8)`;
                    ctx.fill();
                }
                animFrameId = requestAnimationFrame(renderParticles);
            }
            renderParticles();
        }

        function closeNetflixIntro() {
            if (introClosed) return;
            introClosed = true;
            if (animFrameId) cancelAnimationFrame(animFrameId);
            introOverlay.classList.add('hide');
            document.body.classList.remove('intro-playing');

            setTimeout(() => {
                introOverlay.style.display = 'none';
            }, 820);
        }

        // Lock page scroll while intro is active
        document.body.classList.add('intro-playing');

        // Transition out at 3.65s -> finishes completely at ~4.45s (strictly <= 5s)
        setTimeout(closeNetflixIntro, 3650);

        // Allow clicking to close early if desired
        introOverlay.addEventListener('click', closeNetflixIntro);
    })();"""

with open("js/main.js", "r", encoding="utf-8") as f:
    js = f.read()

js, n3 = re.subn(
    r"/\* ==========================================================\s*1\. CINEMATIC LOGO INTRO SPLASH SCREEN[\s\S]*?\}\)\(\);",
    new_js_block,
    js,
    count=1
)
assert n3 == 1, f"Expected 1 replacement in js/main.js, got {n3}"
with open("js/main.js", "w", encoding="utf-8") as f:
    f.write(js)
print("js/main.js updated with 60fps Particle & Intro Controller!")
