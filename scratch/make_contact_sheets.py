import os
from PIL import Image, ImageDraw

def make_grid(img_paths, cols, thumb_w, thumb_h, out_path):
    rows = (len(img_paths) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * thumb_w, rows * thumb_h), (20, 20, 20))
    draw = ImageDraw.Draw(canvas)
    for idx, p in enumerate(img_paths):
        r = idx // cols
        c = idx % cols
        try:
            im = Image.open(p).convert("RGB").resize((thumb_w, thumb_h))
            canvas.paste(im, (c * thumb_w, r * thumb_h))
            draw.rectangle([c * thumb_w, r * thumb_h, c * thumb_w + 90, r * thumb_h + 22], fill=(0, 0, 0))
            draw.text((c * thumb_w + 4, r * thumb_h + 4), os.path.basename(p), fill=(255, 255, 0))
        except Exception:
            pass
    canvas.save(out_path, quality=88)
    print(f"Saved {out_path}")

# Pick every 2nd frame from v3_dense (95 frames = 1 fps)
v3_files = [os.path.join("scratch/v3_dense", f) for f in sorted(os.listdir("scratch/v3_dense"))[::2]]
make_grid(v3_files[:48], 8, 220, 390, "scratch/sheet_v3_part1.jpg")
make_grid(v3_files[48:], 8, 220, 390, "scratch/sheet_v3_part2.jpg")

# Also make a grid of all 28 ceremony images from 1816, 1826, 1836
cer_files = [os.path.join("scratch/ceremony", f) for f in sorted(os.listdir("scratch/ceremony")) if f.endswith(".jpg")]
make_grid(cer_files, 4, 360, 240, "scratch/sheet_ceremony.jpg")
