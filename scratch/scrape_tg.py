import socket
import urllib.request
import urllib.parse
import re
import html as html_mod

# Force IPv4 so t.me connects instantaneously!
orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4

def fetch_tg(channel="al_khorazmiyschool", query=None, before=None):
    base = f"https://t.me/s/{channel}"
    params = {}
    if query:
        params['q'] = query
    if before:
        params['before'] = str(before)
    url = base + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='replace')

for q in ["sertifikat", "milliy", "IELTS", "CEFR", "natija", "tabriklaymiz", "tashakkur"]:
    html = fetch_tg("al_khorazmiyschool", query=q)
    # Split by message bubble
    blocks = html.split('tgme_widget_message_wrap')
    print(f"=== QUERY '{q}': {len(blocks)-1} messages ===")
    for b in blocks[1:]:
        pid_m = re.search(r'data-post="([^"]+)"', b)
        pid = pid_m.group(1) if pid_m else "?"
        txt_m = re.search(r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', b, re.DOTALL)
        txt = ""
        if txt_m:
            txt = re.sub(r'<br\s*/?>', '\n', txt_m.group(1))
            txt = re.sub(r'<[^>]+>', '', txt)
            txt = html_mod.unescape(txt).strip()
        imgs = re.findall(r"background-image:url\('(https://cdn[^']+)'\)", b)
        print(f"[{pid}] ({len(imgs)} imgs): {txt[:300]}")
        print("-" * 40)
