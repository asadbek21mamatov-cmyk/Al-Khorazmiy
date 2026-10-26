import socket
import urllib.request
import re
import html as html_mod
import os

# Force IPv4
orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4

def fetch_range(before_id):
    url = f"https://t.me/s/al_khorazmiyschool?before={before_id}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='replace')

all_posts = {}
for b_id in range(1860, 1600, -20):
    html = fetch_range(b_id)
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

for pid in sorted(all_posts.keys()):
    txt, imgs = all_posts[pid]
    if txt or imgs:
        print(f"=== POST {pid} ({len(imgs)} imgs) ===")
        if txt:
            print(txt)
        for im_url in imgs:
            print("  IMG:", im_url[:80] + "...")
