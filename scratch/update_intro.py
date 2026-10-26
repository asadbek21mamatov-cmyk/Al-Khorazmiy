# -*- coding: utf-8 -*-
import re

# 1. Update index.html
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

new_html_block = """<!-- CINEMATIC LOGO INTRO SPLASH SCREEN (MAX 4.3s) -->
<div id="netflixIntro" class="netflix-intro-overlay" aria-label="Al-Khorazmiy kirish animatsiyasi">
    <div class="intro-ambient-glow"></div>
    <div class="intro-ripple-ring ring-1"></div>
    <div class="intro-ripple-ring ring-2"></div>

    <div class="intro-logo-box" id="netflixIntroStage">
        <img src="intro_ring_top.webp" alt="" class="intro-layer layer-ring-top">
        <img src="intro_ring_bot.webp" alt="" class="intro-layer layer-ring-bot">
        <img src="intro_wing_ul.webp" alt="" class="intro-layer layer-wing-ul">
        <img src="intro_wing_ur.webp" alt="" class="intro-layer layer-wing-ur">
        <img src="intro_wing_ll.webp" alt="" class="intro-layer layer-wing-ll">
        <img src="intro_wing_lr.webp" alt="" class="intro-layer layer-wing-lr">
        <img src="intro_part_title.webp" alt="AL-XORAZMIY" class="intro-layer layer-title">
        <img src="intro_part_sub.webp" alt="SCHOOL" class="intro-layer layer-sub">
        <div class="intro-shimmer-sweep"></div>
    </div>
</div>"""

html, n1 = re.subn(
    r"<!-- NETFLIX-STYLE CINEMATIC INTRO SPLASH SCREEN -->[\s\S]*?</div>\s*</div>",
    new_html_block,
    html,
    count=1
)
assert n1 == 1, f"Expected 1 replacement in index.html, got {n1}"
with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("index.html updated!")

# 2. Update css/style.css
with open("css/style.css", "r", encoding="utf-8") as f:
    css = f.read()

new_css_block = """        /* ==========================================================
           CINEMATIC LOGO INTRO SPLASH SCREEN (UNDER 5 SECONDS)
           ========================================================== */
        body.intro-playing {
            overflow: hidden !important;
        }
        .netflix-intro-overlay {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at center, #ffffff 0%, #f4fbfa 60%, #e4f3f2 100%);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            opacity: 1;
            transform: scale(1);
            transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                        transform 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                        filter 0.7s ease;
        }
        .netflix-intro-overlay.hide {
            opacity: 0;
            transform: scale(1.12);
            filter: blur(6px);
            pointer-events: none;
        }
        .intro-ambient-glow {
            position: absolute;
            width: 520px;
            height: 520px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(8, 147, 145, 0.18) 0%, rgba(8, 147, 145, 0.05) 45%, transparent 70%);
            animation: introGlowPulse 3.6s ease-in-out forwards;
            pointer-events: none;
        }
        @keyframes introGlowPulse {
            0% { opacity: 0; transform: scale(0.4); }
            45% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 0.85; transform: scale(1.2); }
        }
        .intro-ripple-ring {
            position: absolute;
            width: 240px;
            height: 240px;
            border-radius: 50%;
            border: 2px solid rgba(8, 147, 145, 0.35);
            opacity: 0;
            pointer-events: none;
        }
        .intro-ripple-ring.ring-1 {
            animation: introRippleOut 2.4s 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .intro-ripple-ring.ring-2 {
            animation: introRippleOut 2.6s 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes introRippleOut {
            0% { opacity: 0.75; transform: scale(0.35); }
            100% { opacity: 0; transform: scale(2.8); }
        }
        .intro-logo-box {
            position: relative;
            width: min(500px, 86vw);
            aspect-ratio: 760 / 520;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            animation: introBoxBreathe 4.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes introBoxBreathe {
            0% { transform: scale(0.92); }
            60% { transform: scale(1); }
            100% { transform: scale(1.04); }
        }
        .intro-layer {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            pointer-events: none;
            will-change: transform, opacity, filter, clip-path;
        }
        /* 1. Top & Bottom Rings */
        .layer-ring-top {
            opacity: 0;
            animation: ringTopIn 0.85s 0.05s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes ringTopIn {
            0% { opacity: 0; transform: translateY(55px) scale(0.2); filter: blur(4px); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .layer-ring-bot {
            opacity: 0;
            animation: ringBotIn 0.85s 0.12s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes ringBotIn {
            0% { opacity: 0; transform: translateY(-55px) scale(0.2); filter: blur(4px); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        /* 2. Upper Left & Right Wings */
        .layer-wing-ul {
            opacity: 0;
            transform-origin: 50% 42%;
            animation: wingUlIn 0.95s 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes wingUlIn {
            0% { opacity: 0; transform: translateX(40px) scaleX(0.15) rotate(-18deg); filter: blur(4px); }
            100% { opacity: 1; transform: translateX(0) scaleX(1) rotate(0deg); filter: blur(0); }
        }
        .layer-wing-ur {
            opacity: 0;
            transform-origin: 50% 42%;
            animation: wingUrIn 0.95s 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes wingUrIn {
            0% { opacity: 0; transform: translateX(-40px) scaleX(0.15) rotate(18deg); filter: blur(4px); }
            100% { opacity: 1; transform: translateX(0) scaleX(1) rotate(0deg); filter: blur(0); }
        }
        /* 3. Lower Left & Right Wings */
        .layer-wing-ll {
            opacity: 0;
            transform-origin: 48% 48%;
            animation: wingLlIn 0.9s 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes wingLlIn {
            0% { opacity: 0; transform: translate(32px, -10px) scale(0.3) rotate(-14deg); }
            100% { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        .layer-wing-lr {
            opacity: 0;
            transform-origin: 52% 48%;
            animation: wingLrIn 0.9s 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes wingLrIn {
            0% { opacity: 0; transform: translate(-32px, -10px) scale(0.3) rotate(14deg); }
            100% { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        /* 4. AL-XORAZMIY Title */
        .layer-title {
            opacity: 0;
            animation: titleRiseIn 0.85s 1.05s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes titleRiseIn {
            0% { opacity: 0; transform: translateY(22px) scale(0.92); filter: blur(6px); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        /* 5. —— SCHOOL —— Subtitle */
        .layer-sub {
            opacity: 0;
            animation: subExpandIn 0.85s 1.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes subExpandIn {
            0% { opacity: 0; clip-path: inset(0 50% 0 50%); transform: translateY(8px); }
            100% { opacity: 1; clip-path: inset(0 0% 0 0%); transform: translateY(0); }
        }
        /* 6. Diagonal Light Shimmer Sweep */
        .intro-shimmer-sweep {
            position: absolute;
            inset: 0;
            background: linear-gradient(
                115deg,
                transparent 35%,
                rgba(255, 255, 255, 0.78) 50%,
                transparent 65%
            );
            transform: translateX(-130%);
            animation: introShimmerGlide 1.2s 2.1s ease-in-out forwards;
            pointer-events: none;
            mix-blend-mode: overlay;
        }
        @keyframes introShimmerGlide {
            0% { transform: translateX(-130%); }
            100% { transform: translateX(130%); }
        }"""

css, n2 = re.subn(
    r"        /\* ==========================================================\s*NETFLIX-STYLE CINEMATIC INTRO SPLASH SCREEN[\s\S]*?(?=\s*/\* Typography & Section Headers \*/)",
    new_css_block + "\n\n",
    css,
    count=1
)
assert n2 == 1, f"Expected 1 replacement in css/style.css, got {n2}"
with open("css/style.css", "w", encoding="utf-8") as f:
    f.write(css)
print("css/style.css updated!")

# 3. Update js/main.js
with open("js/main.js", "r", encoding="utf-8") as f:
    js = f.read()

new_js_block = """/* ==========================================================
       1. CINEMATIC LOGO INTRO SPLASH SCREEN (MAX 4.2s < 5s)
       ========================================================== */
    (function initNetflixIntro() {
        const introOverlay = document.getElementById('netflixIntro');
        if (!introOverlay) return;

        let introClosed = false;

        function closeNetflixIntro() {
            if (introClosed) return;
            introClosed = true;
            introOverlay.classList.add('hide');
            document.body.classList.remove('intro-playing');

            setTimeout(() => {
                introOverlay.style.display = 'none';
            }, 720);
        }

        // Lock page scroll while intro is active
        document.body.classList.add('intro-playing');

        // Automatically transition out at 3.55s (total duration with 0.7s fade = ~4.25s, strictly <= 5s)
        setTimeout(closeNetflixIntro, 3550);

        // Allow clicking anywhere on intro to close early if desired
        introOverlay.addEventListener('click', closeNetflixIntro);
    })();"""

js, n3 = re.subn(
    r"/\* ==========================================================\s*1\. NETFLIX-STYLE CINEMATIC INTRO SPLASH SCREEN[\s\S]*?\}\)\(\);",
    new_js_block,
    js,
    count=1
)
assert n3 == 1, f"Expected 1 replacement in js/main.js, got {n3}"
with open("js/main.js", "w", encoding="utf-8") as f:
    f.write(js)
print("js/main.js updated!")
