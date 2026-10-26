import os
import subprocess

os.makedirs("scratch/v3_dense", exist_ok=True)
vid = "video_3.orig.mp4" if os.path.exists("video_3.orig.mp4") else "video_3.mp4"

import imageio_ffmpeg
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

# Extract 2 frames per second from video_3
subprocess.run([
    ffmpeg_exe, "-y", "-i", vid,
    "-vf", "fps=2",
    "scratch/v3_dense/f_%03d.jpg"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

files = sorted(os.listdir("scratch/v3_dense"))
print(f"Extracted {len(files)} frames from {vid}")
