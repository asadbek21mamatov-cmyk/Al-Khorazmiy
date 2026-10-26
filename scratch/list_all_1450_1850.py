import socket
import urllib.request
import re
import html as html_mod
import os
from concurrent.futures import ThreadPoolExecutor

orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4

def fetch_page(b_id):
    url = f"https://t.me/s/al_khorazmiyschool?before={b_id}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req, timeout=8).read().decode('utf-8', errors='replace')
    except Exception:
        return []
    res = []
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
        res.append((pid, txt, imgs))
    return res

pages = list(range(1850, 1350, -15))
all_posts = {}
with ThreadPoolExecutor(max_workers=15) as ex:
    for page_res in ex.map(fetch_page, pages):
        for pid, txt, imgs in page_res:
            all_posts[pid] = (txt, imgs)

with open("scratch/all_1350_1850.txt", "w", encoding="utf-8") as f:
    for pid in sorted(all_posts.keys()):
        txt, imgs = all_posts[pid]
        first_line = " | ".join([line.strip() for line in txt.splitlines() if line.strip()])
        f.write(f"POST {pid} ({len(imgs)} imgs): {first_line}\n")

print(f"Saved {len(all_posts)} posts to scratch/all_1350_1850.txt", flush=True)
