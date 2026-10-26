import socket
import urllib.request
import re
import os
from PIL import Image

orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4

print("Files in scratch/v9_all:", sorted(os.listdir("scratch/v9_all")) if os.path.exists("scratch/v9_all") else "None")

# Fetch Post 1803 and 1804
url = "https://t.me/s/al_khorazmiyschool?before=1806"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req, timeout=8).read().decode('utf-8', errors='replace')
blocks = html.split('tgme_widget_message_wrap')
for b in blocks[1:]:
    pid_m = re.search(r'data-post="al_khorazmiyschool/(\d+)"', b)
    if not pid_m:
        continue
    pid = int(pid_m.group(1))
    if pid in [1803, 1804]:
        vids = re.findall(r'<video[^>]*src="([^"]+)"', b)
        print(f"Post {pid} videos: {len(vids)}")
        for idx, vu in enumerate(vids):
            out_v = f"scratch/vid_{pid}.mp4"
            if not os.path.exists(out_v):
                vdata = urllib.request.urlopen(urllib.request.Request(vu, headers={'User-Agent': 'Mozilla/5.0'}), timeout=15).read()
                with open(out_v, "wb") as f:
                    f.write(vdata)
                print(f"Downloaded {out_v} ({len(vdata)} bytes)")
