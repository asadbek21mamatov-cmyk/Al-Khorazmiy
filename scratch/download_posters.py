import socket
import urllib.request
import re
import html as html_mod
import os
from PIL import Image
import io

# Force IPv4
orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4

def fetch_range(before_id):
    url = f"https://t.me/s/al_khorazmiyschool?before={before_id}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='replace')

os.makedirs("scratch/posters", exist_ok=True)
os.makedirs("scratch/ceremony", exist_ok=True)

all_posts = {}
for b_id in range(1940, 1340, -20):
    try:
        html = fetch_range(b_id)
    except Exception as e:
        print(f"Error fetching {b_id}: {e}")
        continue
    blocks = html.split('tgme_widget_message_wrap')
    for b in blocks[1:]:
        pid_m = re.search(r'data-post="al_khorazmiyschool/(\d+)"', b)
        if not pid_m:
            continue
        pid = int(pid_m.group(1))
        txt_m = re.search(r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', b, re.DOTALL)
        txt = ""
        if txt_m:
            txt = re.sub(r'<br\s*/?>', '\n', txt_m.group(1))
            txt = re.sub(r'<[^>]+>', '', txt)
            txt = html_mod.unescape(txt).strip()
        imgs = re.findall(r"background-image:url\('(https://cdn[^']+)'\)", b)
        all_posts[pid] = (txt, imgs)

keywords = ['sertifikat', 'cefr', 'ielts', 'daraja', 'milliy sertifikat', 'natijalar yomg', 'qaynoq natijalar']

with open("scratch/cert_posts_summary.txt", "w", encoding="utf-8") as f:
    for pid in sorted(all_posts.keys()):
        txt, imgs = all_posts[pid]
        low = txt.lower()
        if any(k in low for k in keywords) or pid in [1816, 1826, 1836]:
            f.write(f"=== POST {pid} ({len(imgs)} imgs) ===\n{txt}\n\n")
            if pid in [1816, 1826, 1836]:
                for idx, im_url in enumerate(imgs):
                    out_p = f"scratch/ceremony/p{pid}_{idx+1}.jpg"
                    if not os.path.exists(out_p):
                        req = urllib.request.Request(im_url, headers={'User-Agent': 'Mozilla/5.0'})
                        data = urllib.request.urlopen(req, timeout=10).read()
                        with open(out_p, "wb") as imf:
                            imf.write(data)
            elif len(imgs) <= 4:
                for idx, im_url in enumerate(imgs):
                    out_p = f"scratch/posters/p{pid}_{idx+1}.jpg"
                    if not os.path.exists(out_p):
                        req = urllib.request.Request(im_url, headers={'User-Agent': 'Mozilla/5.0'})
                        data = urllib.request.urlopen(req, timeout=10).read()
                        with open(out_p, "wb") as imf:
                            imf.write(data)
                        print(f"Downloaded {out_p}")

print("Done downloading posters!")
