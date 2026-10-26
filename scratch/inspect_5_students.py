import os
from PIL import Image, ImageEnhance, ImageFilter

os.makedirs("scratch/zoom5", exist_ok=True)

# 1. Check frames around f_107 in video_3 (extract 10 fps between t=52s and t=56s)
import subprocess, imageio_ffmpeg
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
vid = "video_3.orig.mp4" if os.path.exists("video_3.orig.mp4") else "video_3.mp4"
subprocess.run([
    ffmpeg_exe, "-y", "-ss", "51", "-t", "5", "-i", vid,
    "-vf", "fps=6",
    "scratch/zoom5/f107_%02d.jpg"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# 2. Crop and upscale certificates & tashakkurnomas for award_1, 6, 12, 13, 14
# Let's find the exact bounding boxes of the certificates in award_1, 6, 12, 13, 14
crops = {
    "award_1_cert": ("award_1.jpg", (450, 460, 535, 620)),
    "award_1_tash": ("award_1.jpg", (280, 435, 380, 540)),
    "award_6_cert": ("award_6.jpg", (450, 475, 545, 655)),
    "award_6_tash": ("award_6.jpg", (320, 445, 435, 560)),
    "award_12_cert": ("award_12.jpg", (250, 440, 390, 680)),
    "award_12_tash": ("award_12.jpg", (370, 535, 505, 680)),
    "award_13_cert": ("award_13.jpg", (435, 420, 535, 615)),
    "award_13_tash": ("award_13.jpg", (290, 450, 415, 585)),
    "award_14_cert": ("award_14.jpg", (395, 480, 500, 680)),
    "award_14_tash": ("award_14.jpg", (200, 520, 350, 625)),
}

for name, (fname, box) in crops.items():
    im = Image.open(fname).convert("RGB").crop(box)
    w, h = im.size
    im = im.resize((w * 4, h * 4), Image.Resampling.LANCZOS)
    im = ImageEnhance.Contrast(im).enhance(1.8)
    im = ImageEnhance.Sharpness(im).enhance(2.5)
    im.save(f"scratch/zoom5/{name}.jpg", quality=95)

print("Done zoom5! Extracted frames:", sorted(os.listdir("scratch/zoom5")))
