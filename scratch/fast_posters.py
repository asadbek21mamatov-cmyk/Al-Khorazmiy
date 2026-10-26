import socket
import urllib.request
import re
import os
from concurrent.futures import ThreadPoolExecutor

# Force IPv4
orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4

os.makedirs("scratch/posters", exist_ok=True)

target_posts = {
    1525, 1532, 1620, 1637, 1688, 1689, 1690, 1691,
    1706, 1710, 1714, 1716, 1743, 1751, 1769, 1770,
    1772, 1773, 1776, 1777, 1778, 1779, 1797, 1799,
    1800, 1801
}

before_pages = [1805, 1785, 1755, 1720, 1695, 1640, 1540]

def fetch_page(b_id):
    url = f"https://t.me/s/al_khorazmiyschool?before={b_id}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req, timeout=8).read().decode('utf-8', errors='replace')
    found = []
    blocks = html.split('tgme_widget_message_wrap')
    for b in blocks[1:]:
        pid_m = re.search(r'data-post="al_khorazmiyschool/(\d+)"', b)
        if not pid_m:
            continue
        pid = int(pid_m.group(1))
        if pid in target_posts:
            imgs = re.findall(r"background-image:url\('(https://cdn[^']+)'\)", b)
            for idx, u in enumerate(imgs):
                found.append((pid, idx+1, u))
    return found

all_imgs = []
with ThreadPoolExecutor(max_workers=7) as ex:
    for res in ex.map(fetch_page, before_pages):
        all_imgs.extend(res)

# deduplicate
unique_imgs = {(pid, idx): u for pid, idx, u in all_imgs}
print(f"Found {len(unique_imgs)} poster images", flush=True)

def dl_img(item):
    (pid, idx), u = item
    out_p = f"scratch/posters/p{pid}_{idx}.jpg"
    if not os.path.exists(out_p):
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req, timeout=8).read()
        with open(out_p, "wb") as f:
            f.write(data)
    return out_p

with ThreadPoolExecutor(max_workers=10) as ex:
    done = list(ex.map(dl_img, unique_imgs.items()))

print(f"Downloaded {len(done)} files!", flush=True)
