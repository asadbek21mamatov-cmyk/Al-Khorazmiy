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

pages = list(range(1020, 20, -20)) + list(range(2100, 1800, -20))
all_posts = {}
with ThreadPoolExecutor(max_workers=15) as ex:
    for page_res in ex.map(fetch_page, pages):
        for pid, txt, imgs in page_res:
            all_posts[pid] = (txt, imgs)

keywords = ['sertifikat', 'cefr', 'ielts', 'daraja', 'milliy', 'natijalar']
to_dl = []
for pid in sorted(all_posts.keys()):
    txt, imgs = all_posts[pid]
    low = txt.lower()
    if any(k in low for k in keywords):
        first_line = " | ".join([line.strip() for line in txt.splitlines() if line.strip()][:4])
        print(f"POST {pid} ({len(imgs)} imgs): {first_line[:160]}", flush=True)
        if 1 <= len(imgs) <= 4 and pid > 1200:
            for idx, u in enumerate(imgs):
                out_p = f"scratch/posters/p{pid}_{idx+1}.jpg"
                if not os.path.exists(out_p):
                    to_dl.append((out_p, u))
