# -*- coding: utf-8 -*-
"""
Generates:
1. intro_emblem_3d.webp: A realistic 3D metallic emerald-teal render of the exact uploaded logo emblem
   with specular bevel highlights, inner depth, and rim lighting.
2. Exact SVG contour paths of the emblem for the neon laser-drawing animation.
"""
from PIL import Image, ImageFilter, ImageChops

# Load the high-res emblem alpha (760x520, where emblem is in y=0..352)
emblem_src = Image.open("intro_part_emblem.webp").convert("RGBA")
w, h = emblem_src.size

# Crop tightly around the emblem (x=70..690, y=30..355) -> 620x325
crop_box = (70, 30, 690, 355)
em = emblem_src.crop(crop_box)
ew, eh = em.size
_, _, _, alpha = em.split()

# Create a smooth heightmap from alpha using multi-scale Gaussian blurs (simulates 3D dome/bevel profile)
h1 = alpha.filter(ImageFilter.GaussianBlur(radius=2.0))
h2 = alpha.filter(ImageFilter.GaussianBlur(radius=5.0))
h3 = alpha.filter(ImageFilter.GaussianBlur(radius=10.0))

px_a = alpha.load()
px_h1 = h1.load()
px_h2 = h2.load()
px_h3 = h3.load()

out_3d = Image.new("RGBA", (ew, eh), (0, 0, 0, 0))
px_out = out_3d.load()

for y in range(eh):
    for x in range(ew):
        a = px_a[x, y]
        if a <= 5:
            continue
        # Compute surface normal (nx, ny) from heightmap finite differences
        x_prev = max(0, x - 2)
        x_next = min(ew - 1, x + 2)
        y_prev = max(0, y - 2)
        y_next = min(eh - 1, y + 2)

        # Combine multi-scale height
        hx_prev = 0.5 * px_h1[x_prev, y] + 0.35 * px_h2[x_prev, y] + 0.15 * px_h3[x_prev, y]
        hx_next = 0.5 * px_h1[x_next, y] + 0.35 * px_h2[x_next, y] + 0.15 * px_h3[x_next, y]
        hy_prev = 0.5 * px_h1[x, y_prev] + 0.35 * px_h2[x, y_prev] + 0.15 * px_h3[x, y_prev]
        hy_next = 0.5 * px_h1[x, y_next] + 0.35 * px_h2[x, y_next] + 0.15 * px_h3[x, y_next]

        dx = (hx_prev - hx_next) / 255.0
        dy = (hy_prev - hy_next) / 255.0

        # Light direction from top-left-front (-0.45, -0.65, 0.6)
        diffuse = max(0.0, min(1.5, 0.65 + dx * 1.35 + dy * 1.65))
        # Specular highlight on top-facing bevels
        spec = max(0.0, dx * 0.7 + dy * 0.95) ** 2.4

        # Ridge / center height for metallic sheen
        ridge = (0.4 * px_h1[x, y] + 0.6 * px_h2[x, y]) / 255.0

        # Base luxury emerald-teal metallic color (#0a9b98 -> #2dd4bf -> #bbf7d0 specular)
        r = int(min(255, max(6,  10 * diffuse + 35 * ridge + 185 * spec)))
        g = int(min(255, max(35, 148 * diffuse + 55 * ridge + 140 * spec)))
        b = int(min(255, max(38, 145 * diffuse + 52 * ridge + 135 * spec)))

        px_out[x, y] = (r, g, b, a)

out_3d.save("intro_emblem_3d.webp", "WEBP", quality=98)
print("Saved intro_emblem_3d.webp:", out_3d.size)

# Also trace clean SVG contour paths from a downsampled binary grid using marching squares / boundary tracing
# Let's trace boundary contours on a 310x162 grid (2x downsampled) and smooth them
gw, gh = ew // 2, eh // 2
small_a = alpha.resize((gw, gh), Image.Resampling.BILINEAR)
spx = small_a.load()
grid = [[1 if spx[x, y] > 110 else 0 for x in range(gw)] for y in range(gh)]

# Find boundary pixels (where grid[y][x] == 1 and at least one 4-neighbor is 0)
visited = set()
paths_svg = []

# 8-neighborhood clockwise offsets
dirs = [(1,0), (1,1), (0,1), (-1,1), (-1,0), (-1,-1), (0,-1), (1,-1)]

def is_edge(x, y):
    if grid[y][x] == 0:
        return False
    for nx, ny in ((x+1,y), (x-1,y), (x,y+1), (x,y-1)):
        if nx < 0 or nx >= gw or ny < 0 or ny >= gh or grid[ny][nx] == 0:
            return True
    return False

edge_pts = set()
for y in range(gh):
    for x in range(gw):
        if is_edge(x, y):
            edge_pts.add((x, y))

for start in sorted(edge_pts):
    if start in visited:
        continue
    chain = [start]
    visited.add(start)
    cur = start
    while True:
        cx, cy = cur
        found_next = None
        for dx, dy in dirs:
            nx, ny = cx + dx, cy + dy
            if (nx, ny) in edge_pts and (nx, ny) not in visited:
                found_next = (nx, ny)
                break
        if not found_next:
            # try 2-pixel jump if tiny gap
            for dx in range(-2, 3):
                for dy in range(-2, 3):
                    nx, ny = cx + dx, cy + dy
                    if (nx, ny) in edge_pts and (nx, ny) not in visited:
                        found_next = (nx, ny)
                        break
                if found_next:
                    break
        if not found_next:
            break
        chain.append(found_next)
        visited.add(found_next)
        cur = found_next

    if len(chain) >= 25:
        # Subsample every 3rd point and average for smoothness
        pts = chain[::3]
        if len(pts) >= 6:
            d_parts = [f"M {pts[0][0]*2:.1f} {pts[0][1]*2:.1f}"]
            for i in range(1, len(pts)):
                mx = (pts[i-1][0] + pts[i][0]) * 1.0
                my = (pts[i-1][1] + pts[i][1]) * 1.0
                d_parts.append(f"L {mx:.1f} {my:.1f}")
            d_parts.append("Z")
            paths_svg.append(" ".join(d_parts))

print(f"Extracted {len(paths_svg)} SVG contour paths!")
with open("scratch/emblem_paths.txt", "w", encoding="utf-8") as f:
    for p in paths_svg:
        f.write(p + "\n")
