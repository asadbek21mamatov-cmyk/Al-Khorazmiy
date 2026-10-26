import socket
import urllib.request
import re
import os
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4

os.makedirs("scratch/ceremony", exist_ok=True)

url = "https://t.me/s/al_khorazmiyschool?before=1845"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req, timeout=8).read().decode('utf-8', errors='replace')

blocks = html.split('tgme_widget_message_wrap')
ceremony_imgs = []
for b in blocks[1:]:
    pid_m = re.search(r'data-post="al_khorazmiyschool/(\d+)"', b)
    if not pid_m:
        continue
    pid = int(pid_m.group(1))
    if pid in [1816, 1826, 1836]:
        imgs = re.findall(r"background-image:url\('(https://cdn[^']+)'\)", b)
        for idx, u in enumerate(imgs):
            ceremony_imgs.append((pid, idx+1, u))
    if pid in [1803, 1804]:
        vids = re.findall(r'<video[^>]*src="([^"]+)"', b)
        print(f"Post {pid} videos: {len(vids)}")
        for v_idx, v_url in enumerate(vids):
            v_out = f"scratch/ceremony/vid_{pid}_{v_idx+1}.mp4"
            if not os.path.exists(v_out):
                v_data = urllib.request.urlopen(urllib.request.Request(v_url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=15).read()
                with open(v_out, "wb") as vf:
                    vf.write(v_data)
                print(f"Downloaded {v_out} ({len(v_data)} bytes)")

def dl_c(item):
    pid, idx, u = item
    out_p = f"scratch/ceremony/p{pid}_{idx}.jpg"
    if not os.path.exists(out_p):
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req, timeout=8).read()
        with open(out_p, "wb") as f:
            f.write(data)
    return (pid, idx, out_p)

with ThreadPoolExecutor(max_workers=10) as ex:
    c_files = list(ex.map(dl_c, ceremony_imgs))

c_pixels = {}
for pid, idx, p in c_files:
    im = Image.open(p).convert('RGB').resize((32, 32))
    c_pixels[(pid, idx)] = list(im.getdata())

for i in range(1, 16):
    aw = Image.open(f"award_{i}.jpg").convert('RGB').resize((32, 32))
    aw_px = list(aw.getdata())
    best_k = None
    best_err = 1e18
    for k, px in c_pixels.items():
        err = sum((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2 for a, b in zip(aw_px, px))
        if err < best_err:
            best_err = err
            best_k = k
    print(f"award_{i}.jpg -> Post {best_k[0]} img #{best_k[1]} (err={best_err})")
