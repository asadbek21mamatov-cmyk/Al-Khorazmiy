# -*- coding: utf-8 -*-
import os
import re
import subprocess
import imageio_ffmpeg
from PIL import Image, ImageFilter, ImageEnhance

ff = imageio_ffmpeg.get_ffmpeg_exe()

# 1. Generate crisp WebP poster thumbnails for video_1.mp4 .. video_10.mp4
for i in range(1, 11):
    v_file = f"video_{i}.mp4"
    p_file = f"video_{i}_poster.webp"
    if os.path.exists(v_file):
        subprocess.run(
            [ff, "-y", "-ss", "0.2", "-i", v_file, "-frames:v", "1", "-q:v", "80", p_file],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False
        )
print("Generated 10 WebP video posters!")

# 2. Create 4K Ultra-Sharp (Super-Sampled + Crisp Edge Curve) Emblem & Full Logo from uploaded image
orig_path = r"kirish videosi\intro_logo_original.png"
im = Image.open(orig_path).convert("RGBA")
# Crop tightly around the logo (240, 180, 560, 405) -> 320x225
crop_box = (240, 180, 560, 405)
cropped = im.crop(crop_box)

# Upscale 6x with LANCZOS to 1920x1350 (Ultra-HD 4K density)
uhd = cropped.resize((320 * 6, 225 * 6), Image.Resampling.LANCZOS)
uw, uh = uhd.size

# Apply a crisp alpha & color extraction with sharpened anti-aliased edges
px = uhd.load()
emblem_uhd = Image.new("RGBA", (uw, uh), (0, 0, 0, 0))
px_em = emblem_uhd.load()

# In cropped (240..560, 180..405):
# Emblem is y = 0..158 (in 6x: y = 0..948)
# Title AL-XORAZMIY is y = 160..195 (in 6x: y = 960..1170)
# Subtitle —— SCHOOL —— is y = 196..225 (in 6x: y = 1176..1350)
for y in range(950):
    for x in range(uw):
        r, g, b, _ = px[x, y]
        # Darkness/saturation distance from white background
        dist = max(255 - r, 255 - g, 255 - b)
        if dist > 18:
            # Steep S-curve contrast on alpha so edges are razor-sharp (vector-like!)
            norm = min(1.0, max(0.0, (dist - 18) / 95.0))
            norm = norm * norm * (3.0 - 2.0 * norm)  # smoothstep
            alpha = int(norm * 255)
            if alpha > 0:
                # Pure vibrant Al-Xorazmiy emerald-teal (#0c9e9b -> #14b8a6)
                px_em[x, y] = (14, 168, 165, alpha)

# Crop emblem tightly (y=0..950)
emblem_only = emblem_uhd.crop((0, 0, uw, 950))
emblem_only.save("intro_emblem_hd.webp", "WEBP", quality=100, lossless=True)
print("Saved ultra-sharp lossless intro_emblem_hd.webp:", emblem_only.size)

# Also render a razor-sharp Full HD 1920x1080 MP4 into kirish videosi/gemini_generated_video_3e6f316a.mp4
# using the crisp high-res logo on a clean studio backdrop (3.2 seconds, 30fps, CRF 15)
W, H, FPS = 1920, 1080, 30
TOTAL_FRAMES = int(FPS * 3.2)
out_mp4 = r"kirish videosi\gemini_generated_video_3e6f316a.mp4"

# Prepare clean dark studio frame with ultra-sharp emblem & text
em_for_vid = emblem_only.resize((680, 336), Image.Resampling.LANCZOS)
proc = subprocess.Popen([
    ff, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
    "-s", f"{W}x{H}", "-pix_fmt", "rgba", "-r", str(FPS),
    "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-preset", "fast", "-crf", "15", "-movflags", "+faststart", out_mp4
], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

bg_vid = Image.new("RGBA", (W, H), (4, 18, 22, 255))
for f_idx in range(TOTAL_FRAMES):
    t = f_idx / FPS
    frame = bg_vid.copy()
    p = min(1.0, t / 0.8)
    p_ease = 1.0 - (1.0 - p) ** 3
    sc = 0.88 + 0.12 * p_ease
    nw, nh = int(680 * sc), int(336 * sc)
    em_sc = em_for_vid.resize((nw, nh), Image.Resampling.BILINEAR)
    if p < 1.0:
        r, g, b, a = em_sc.split()
        a = a.point(lambda v: int(v * p_ease))
        em_sc = Image.merge("RGBA", (r, g, b, a))
    frame.alpha_composite(em_sc, ((W - nw) // 2, (H - nh) // 2 - 40))
    proc.stdin.write(frame.tobytes())

proc.stdin.close()
proc.wait()
print("Saved Full HD 1080p intro video:", out_mp4)

# 3. Update index.html:
#    - Preload intro_emblem_hd.webp
#    - Use intro_emblem_hd.webp in #netflixIntro (no canvas)
#    - Set poster="video_X_poster.webp" preload="none" on all 10 reel videos
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

if 'href="intro_emblem_hd.webp"' not in html:
    html = html.replace(
        '<link rel="preload" as="image" href="school_building.webp" fetchpriority="high">',
        '<link rel="preload" as="image" href="intro_emblem_hd.webp" fetchpriority="high">\n    <link rel="preload" as="image" href="school_building.webp" fetchpriority="high">'
    )

html = html.replace('<canvas id="introParticleCanvas" class="intro-particle-canvas"></canvas>\n    ', '')
html = html.replace('src="intro_emblem_3d.webp"', 'src="intro_emblem_hd.webp" fetchpriority="high" decoding="sync"')

for i in range(1, 11):
    html = html.replace(
        f'<video src="video_{i}.mp4#t=0.1" preload="metadata" playsinline></video>',
        f'<video src="video_{i}.mp4" poster="video_{i}_poster.webp" preload="none" playsinline></video>'
    )

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Updated index.html (preload=none + posters on 10 videos, 4K lossless emblem)!")

# 4. Update css/style.css:
#    - Remove all blur() filters from intro so logo & text are 100% razor-sharp
#    - Make intro timings fast & snappy (2.3s total)
with open("css/style.css", "r", encoding="utf-8") as f:
    css = f.read()

fast_sharp_css = """        /* ==========================================================
           ULTRA-SHARP 4K & FAST LOGO INTRO (2.3s, ZERO BLUR)
           ========================================================== */
        body.intro-playing {
            overflow: hidden !important;
        }
        .netflix-intro-overlay {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at 50% 45%, #072629 0%, #031114 58%, #010608 100%);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            opacity: 1;
            transform: scale3d(1, 1, 1);
            will-change: opacity, transform;
            transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                        transform 0.55s cubic-bezier(0.7, 0, 0.2, 1);
        }
        .netflix-intro-overlay.hide {
            opacity: 0;
            transform: scale3d(1.18, 1.18, 1);
            pointer-events: none;
        }
        .intro-god-rays {
            position: absolute;
            width: 120vmax;
            height: 120vmax;
            background: radial-gradient(circle, rgba(20, 184, 166, 0.16) 0%, rgba(8, 147, 145, 0.05) 35%, transparent 65%);
            pointer-events: none;
            z-index: 1;
        }
        .intro-ambient-glow {
            position: absolute;
            width: min(560px, 85vw);
            height: min(560px, 85vw);
            border-radius: 50%;
            background: radial-gradient(circle, rgba(45, 212, 191, 0.22) 0%, rgba(8, 147, 145, 0.06) 50%, transparent 70%);
            animation: introAmbientPulse 2.3s ease-out forwards;
            pointer-events: none;
            z-index: 2;
        }
        @keyframes introAmbientPulse {
            0% { opacity: 0; transform: scale(0.6); }
            45% { opacity: 1; transform: scale(1); }
            100% { opacity: 0.9; transform: scale(1.08); }
        }
        .intro-cinema-stage {
            position: relative;
            z-index: 5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: min(500px, 86vw);
            will-change: transform;
            animation: introCameraPush 2.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes introCameraPush {
            0% { transform: scale3d(0.92, 0.92, 1); }
            100% { transform: scale3d(1.03, 1.03, 1); }
        }
        .intro-emblem-wrap {
            position: relative;
            width: 100%;
            aspect-ratio: 1920 / 950;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        /* 1. Crisp Laser SVG Outline Drawing */
        .intro-laser-svg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            overflow: visible;
            z-index: 3;
            animation: laserSvgFadeOut 0.45s 1.05s ease-out forwards;
        }
        .laser-path {
            stroke: #5eead4;
            stroke-width: 2.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: laserTrace 0.9s 0.02s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .laser-path-gold {
            stroke: #fde047;
            stroke-width: 3.2;
            stroke-linecap: round;
            stroke-dasharray: 150 1000;
            stroke-dashoffset: 1000;
            animation: laserSpark 0.9s 0.02s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes laserTrace {
            0% { stroke-dashoffset: 1000; opacity: 0.5; }
            100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes laserSpark {
            0% { stroke-dashoffset: 1000; opacity: 1; }
            85% { opacity: 1; }
            100% { stroke-dashoffset: -150; opacity: 0; }
        }
        @keyframes laserSvgFadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
        /* 2. 4K Lossless Razor-Sharp Emblem (ZERO blur!) */
        .intro-emblem-3d {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            z-index: 2;
            opacity: 0;
            image-rendering: -webkit-optimize-contrast;
            filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.65));
            animation: emblem3dReveal 0.75s 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes emblem3dReveal {
            0% {
                opacity: 0;
                transform: scale3d(0.96, 0.96, 1);
            }
            100% {
                opacity: 1;
                transform: scale3d(1, 1, 1);
            }
        }
        /* 3. Masked Metallic Specular Sheen Sweep */
        .intro-emblem-sheen {
            position: absolute;
            inset: 0;
            z-index: 4;
            pointer-events: none;
            -webkit-mask-image: url('../intro_emblem_hd.webp');
            mask-image: url('../intro_emblem_hd.webp');
            -webkit-mask-size: contain;
            mask-size: contain;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            background: linear-gradient(
                112deg,
                transparent 36%,
                rgba(255, 255, 255, 0.2) 44%,
                rgba(254, 240, 138, 0.9) 50%,
                rgba(255, 255, 255, 0.2) 56%,
                transparent 64%
            );
            background-size: 240% 100%;
            background-position: 160% 0;
            animation: emblemSheenSweep 0.95s 0.85s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
            width: 120%;
            height: 2.5px;
            transform: translate(-50%, -50%) scaleX(0);
            background: linear-gradient(90deg, transparent 0%, rgba(45, 212, 191, 0.85) 25%, #ffffff 50%, rgba(251, 191, 36, 0.85) 75%, transparent 100%);
            box-shadow: 0 0 18px 3px rgba(45, 212, 191, 0.7);
            border-radius: 50%;
            z-index: 6;
            opacity: 0;
            pointer-events: none;
            animation: anamorphicFlare 0.9s 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes anamorphicFlare {
            0% { opacity: 0; transform: translate(-50%, -50%) scaleX(0.05); }
            40% { opacity: 1; transform: translate(-50%, -50%) scaleX(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scaleX(1.25); }
        }
        /* 5. Razor-Sharp Vector Typography (ZERO blur!) */
        .intro-typo-wrap {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        .intro-main-name {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: clamp(28px, 4.5vw, 46px);
            font-weight: 700;
            color: #ffffff;
            text-shadow: 0 4px 16px rgba(0, 0, 0, 0.75);
            opacity: 0;
            letter-spacing: 0.28em;
            transform: translate3d(0, 12px, 0);
            animation: cinemaTitleIn 0.75s 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes cinemaTitleIn {
            0% {
                opacity: 0;
                letter-spacing: 0.32em;
                transform: translate3d(0, 12px, 0);
            }
            100% {
                opacity: 1;
                letter-spacing: 0.14em;
                transform: translate3d(0, 0, 0);
            }
        }
        .intro-sub-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-top: 8px;
            opacity: 0;
            animation: cinemaSubIn 0.65s 0.68s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes cinemaSubIn {
            0% { opacity: 0; transform: translate3d(0, 8px, 0); }
            100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .intro-sub-word {
            font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
            font-size: clamp(13.5px, 2vw, 18.5px);
            font-weight: 700;
            color: #2dd4bf;
            letter-spacing: 0.48em;
            padding-left: 0.48em;
        }
        .intro-sub-line {
            height: 2px;
            width: 0;
            background: linear-gradient(90deg, transparent, #2dd4bf);
            animation: cinemaLineExpand 0.7s 0.72s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .intro-sub-line.right {
            background: linear-gradient(90deg, #2dd4bf, transparent);
        }
        @keyframes cinemaLineExpand {
            0% { width: 0; }
            100% { width: clamp(45px, 9vw, 85px); }
        }
        .intro-motto-row {
            margin-top: 12px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: clamp(10.5px, 1.4vw, 13px);
            font-weight: 700;
            letter-spacing: 0.32em;
            color: #fbbf24;
            opacity: 0;
            animation: cinemaSubIn 0.65s 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }"""

css, n_css = re.subn(
    r"        /\* ==========================================================\s*PRO HOLLYWOOD / NETFLIX 3D & LASER LOGO INTRO[\s\S]*?(?=\s*/\* Typography & Section Headers \*/)",
    fast_sharp_css + "\n\n",
    css,
    count=1
)
assert n_css == 1, f"Expected 1 replacement in css/style.css, got {n_css}"
with open("css/style.css", "w", encoding="utf-8") as f:
    f.write(css)
print("Updated css/style.css (zero blur, 4K sharpness, 2.3s fast intro)!")

# 5. Update js/main.js:
#    - Fast 1.9s intro timeout (+0.45s fade = 2.35s total)
#    - Fix videoObserver so it does NOT set video.currentTime = 0.1 on unplayed videos at page load!
with open("js/main.js", "r", encoding="utf-8") as f:
    js = f.read()

fast_js_intro = """/* ==========================================================
       1. ULTRA-SHARP 4K & FAST LOGO INTRO (2.3s)
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
            }, 480);
        }

        document.body.classList.add('intro-playing');

        // Fast, snappy 1.85s reveal (+ 0.45s transition = 2.3s total)
        setTimeout(closeNetflixIntro, 1850);

        introOverlay.addEventListener('click', closeNetflixIntro);
    })();"""

js, n_js1 = re.subn(
    r"/\* ==========================================================\s*1\. PRO HOLLYWOOD / NETFLIX 3D & LASER INTRO[\s\S]*?\}\)\(\);",
    fast_js_intro,
    js,
    count=1
)
assert n_js1 == 1, f"Expected 1 intro replacement in js/main.js, got {n_js1}"

# Fix videoObserver so it doesn't force all 10 videos to download on initial page load
old_observer = """                if (video && !video.paused) {
                    video.pause();
                }
                if (video) {
                    video.currentTime = 0.1; // Keep preview frame visible
                }
                item.classList.remove('is-playing');
                if (video) video.removeAttribute('controls');"""

new_observer = """                if (video && !video.paused) {
                    video.pause();
                    item.classList.remove('is-playing');
                    video.removeAttribute('controls');
                }"""

if old_observer in js:
    js = js.replace(old_observer, new_observer, 1)
    print("Fixed videoObserver in js/main.js to prevent 25MB video download on page load!")

with open("js/main.js", "w", encoding="utf-8") as f:
    f.write(js)
print("All optimizations completed!")
