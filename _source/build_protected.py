# -*- coding: utf-8 -*-
"""
Al-Khorazmiy International School — Source & DevTools Protection Compiler
Compiles readable sources in `_source/` into encrypted, self-mounting,
anti-inspect production `index.html` and `admin.html` with zero external
CSS/JS source files exposed in Browser DevTools -> Sources.
"""

import base64
import json
import os
import re
import secrets

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "_source")


def strip_css_comments(css: str) -> str:
    # Remove /* ... */ comments safely (preserving strings/urls)
    css = re.sub(r"/\*[\s\S]*?\*/", "", css)
    lines = [ln.strip() for ln in css.splitlines() if ln.strip()]
    return "\n".join(lines)


def strip_html_comments(html_str: str) -> str:
    html_str = re.sub(r"<!--[\s\S]*?-->", "", html_str)
    lines = [ln.strip() for ln in html_str.splitlines() if ln.strip()]
    return "\n".join(lines)


def encrypt_payload(payload_obj: dict, seed: int) -> str:
    raw = json.dumps(payload_obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    out = bytearray(len(raw))
    s = seed & 0xFFFFFFFF
    for i, b in enumerate(raw):
        s ^= (s << 13) & 0xFFFFFFFF
        s ^= (s >> 17) & 0xFFFFFFFF
        s ^= (s << 5) & 0xFFFFFFFF
        out[i] = b ^ (s & 0xFF) ^ ((i * 31) & 0xFF)
    return base64.b64encode(bytes(out)).decode("ascii")


NETLIFY_SWEEP_JS = r"""
(function(){
    var A={'nl-badge-frame':1,'nl-hud-frame':1,netflixIntro:1,header:1,mobileOverlay:1,mobileMenu:1,lightboxModal:1,successModal:1,backToTop:1,authScreen:1,appShell:1,toast:1};
    var T={MAIN:1,FOOTER:1,HEADER:1,SCRIPT:1,STYLE:1,LINK:1,NOSCRIPT:1};
    function h(e){if(!e||!e.style)return;e.style.setProperty('display','none','important');e.style.setProperty('visibility','hidden','important');e.style.setProperty('opacity','0','important');e.style.setProperty('pointer-events','none','important');if(e.parentNode)e.parentNode.removeChild(e);}
    function b(e){
        if(!e||e.nodeType!==1)return false;
        if(e.id&&A[e.id])return false;
        var s=((e.id||'')+' '+(typeof e.className==='string'?e.className:'')+' '+e.tagName).toLowerCase();
        if(e.tagName==='IFRAME'&&(e.id==='nl-badge-frame'||e.id==='nl-hud-frame'))return true;
        var t=(e.getAttribute&&e.getAttribute('title'))||'';
        if(t.toLowerCase().indexOf('netlify')!==-1)return true;
        if(e.tagName==='IFRAME'&&s.indexOf('netlify')!==-1)return true;
        var l=(e.getAttribute&&(e.getAttribute('href')||e.getAttribute('src')||''))||'';
        if(l.toLowerCase().indexOf('netlify.com')!==-1)return true;
        if(e.parentElement===document.body&&!T[e.tagName]&&!A[e.id]){
            var x=(e.textContent||'').toLowerCase();
            if(x.indexOf('powered by netlify')!==-1)return true;
            if(e.tagName==='IFRAME')return true;
            var c=window.getComputedStyle?window.getComputedStyle(e):null;
            if(c&&c.position==='fixed'&&(e.__hs||e.shadowRoot||e.querySelector('iframe')))return true;
        }
        return false;
    }
    if(window.Element&&Element.prototype.attachShadow){
        var o=Element.prototype.attachShadow;
        Element.prototype.attachShadow=function(i){var host=this;host.__hs=true;var sr=o.call(host,i);setTimeout(function(){var inn=(sr&&sr.innerHTML?sr.innerHTML:'').toLowerCase();if(inn.indexOf('netlify')!==-1||b(host))h(host);},0);return sr;};
    }
    function sw(){
        if(!document.body)return;
        var k=Array.prototype.slice.call(document.body.children);
        for(var i=0;i<k.length;i++)if(b(k[i]))h(k[i]);
        var m=document.querySelectorAll('a[href*="netlify.com"],iframe[src*="netlify"],[id*="netlify"],[class*="netlify"]');
        for(var j=0;j<m.length;j++)h(m[j]);
    }
    if(window.MutationObserver){
        new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var ad=ms[i].addedNodes;for(var j=0;j<ad.length;j++){var n=ad[j];if(n&&n.nodeType===1){if(b(n))h(n);else(function(nd){setTimeout(function(){if(b(nd))h(nd);},25);})(n);}}}}).observe(document.documentElement,{childList:true,subtree:true});
    }
    window.addEventListener('DOMContentLoaded',sw);
    window.addEventListener('load',function(){sw();setTimeout(sw,500);});
})();
""".strip()


GUARD_JS = r"""
(function(){
    var me=document.currentScript;if(me&&me.parentNode)me.parentNode.removeChild(me);
    var lk=false;
    function ld(){
        if(lk)return;lk=true;
        try{if(document.adoptedStyleSheets)document.adoptedStyleSheets=[];}catch(_){}
        try{if(document.documentElement)document.documentElement.innerHTML='';}catch(_){}
        try{console.clear();}catch(_){}
        try{window.location.replace('about:blank');}catch(_){try{window.location.href='about:blank';}catch(__){}}
    }
    window.addEventListener('contextmenu',function(e){e.preventDefault();e.stopPropagation();return false;},true);
    window.addEventListener('keydown',function(e){
        var c=e.code||'',k=(e.key||'').toUpperCase(),kc=e.keyCode||e.which||0,ct=e.ctrlKey||e.metaKey;
        if(c==='F12'||k==='F12'||kc===123){e.preventDefault();e.stopPropagation();return false;}
        if((ct&&e.shiftKey&&(c==='KeyI'||c==='KeyJ'||c==='KeyC'||c==='KeyK'||k==='I'||k==='J'||k==='C'||k==='K'||kc===73||kc===74||kc===67||kc===75))||(e.metaKey&&e.altKey&&(c==='KeyI'||c==='KeyJ'||c==='KeyC'||c==='KeyU'||kc===73||kc===74||kc===67||kc===85))){e.preventDefault();e.stopPropagation();return false;}
        if(ct&&!e.shiftKey&&!e.altKey&&(c==='KeyU'||c==='KeyS'||k==='U'||k==='S'||kc===85||kc===83)){e.preventDefault();e.stopPropagation();return false;}
    },true);
    window.addEventListener('dragstart',function(e){var t=e.target;if(t&&(t.tagName==='IMG'||t.tagName==='VIDEO')){e.preventDefault();}},true);
    if(typeof Worker!=='undefined'&&typeof Blob!=='undefined'&&typeof URL!=='undefined'){
        var w=null,rdy=false,p=false,tk=0,lt=0;
        try{
            var bl=new Blob(['self.postMessage(0);self.onmessage=function(){var t=Date.now();debugger;self.postMessage(Date.now()-t)};'],{type:'application/javascript'});
            var u=URL.createObjectURL(bl);w=new Worker(u);
            w.onmessage=function(e){
                if(!rdy){rdy=true;try{URL.revokeObjectURL(u);}catch(_){}return;}
                p=false;tk=0;
                if(typeof e.data==='number'&&e.data>150){ld();}
            };
            w.onerror=function(){rdy=false;p=false;w=null;};
        }catch(_){w=null;}
        if(w){
            setInterval(function(){
                if(lk||!w||!rdy)return;
                if(document.visibilityState!=='visible'){p=false;tk=0;return;}
                if(!p){
                    p=true;tk=0;lt=Date.now();
                    try{w.postMessage(1);}catch(_){p=false;}
                }else{
                    var nw=Date.now(),dt=nw-lt;lt=nw;
                    if(dt>=200&&dt<=950){tk++;if(tk>=2){try{w.terminate();}catch(_){}ld();}}else{tk=0;}
                }
            },320);
        }
    }
})();
""".strip()


def make_bootstrapper(b64_payload: str, seed: int) -> str:
    # Compact self-deleting runtime loader
    loader = (
        "(function(){"
        "var sc=document.currentScript;if(sc&&sc.parentNode)sc.parentNode.removeChild(sc);"
        f"var d='{b64_payload}',s={seed}>>>0,r=atob(d),n=r.length,u=new Uint8Array(n);"
        "for(var i=0;i<n;i++){"
        "s=(s^(s<<13))>>>0;s=(s^(s>>>17))>>>0;s=(s^(s<<5))>>>0;"
        "u[i]=r.charCodeAt(i)^(s&255)^(Math.imul(i,31)&255);"
        "}"
        "var o=JSON.parse(new TextDecoder('utf-8').decode(u));d=null;r=null;u=null;"
        "if(o.c){try{var sh=new CSSStyleSheet();sh.replaceSync(o.c);"
        "document.adoptedStyleSheets=[].concat(Array.from(document.adoptedStyleSheets||[]),[sh]);"
        "}catch(_){var st=document.createElement('style');st.textContent=o.c;document.head.appendChild(st);}}"
        "if(o.h){document.body.insertAdjacentHTML('beforeend',o.h);}"
        "if(o.j){(new Function(o.j))();}"
        "o=null;"
        "if(location.hash&&location.hash.length>1){setTimeout(function(){try{var el=document.querySelector(location.hash);if(el)el.scrollIntoView();}catch(_){}},60);}"
        "})();"
    )
    return loader


def minify_head_preserve_jsonld(head_inner: str) -> str:
    # Minify JSON-LD blocks cleanly
    def _compact_ld(m):
        try:
            parsed = json.loads(m.group(1))
            return '<script type="application/ld+json">' + json.dumps(parsed, ensure_ascii=False, separators=(",", ":")) + "</script>"
        except Exception:
            return m.group(0)

    head_inner = re.sub(
        r'<script\s+type="application/ld\+json"\s*>([\s\S]*?)</script>',
        _compact_ld,
        head_inner,
        flags=re.IGNORECASE,
    )
    return strip_html_comments(head_inner)


def build_index():
    with open(os.path.join(SRC, "index.html"), "r", encoding="utf-8") as f:
        raw_html = f.read()
    with open(os.path.join(SRC, "css", "style.css"), "r", encoding="utf-8") as f:
        css_main = f.read()
    with open(os.path.join(SRC, "liquid-navbar", "liquid-navbar.css"), "r", encoding="utf-8") as f:
        css_nav = f.read()
    with open(os.path.join(SRC, "js", "i18n.js"), "r", encoding="utf-8") as f:
        js_i18n = f.read()
    with open(os.path.join(SRC, "js", "main.js"), "r", encoding="utf-8") as f:
        js_main = f.read()
    with open(os.path.join(SRC, "liquid-navbar", "liquid-navbar.js"), "r", encoding="utf-8") as f:
        js_nav = f.read()

    head_match = re.search(r"<head>([\s\S]*?)</head>", raw_html, flags=re.IGNORECASE)
    body_match = re.search(r"<body>([\s\S]*?)</body>", raw_html, flags=re.IGNORECASE)
    if not head_match or not body_match:
        raise RuntimeError("Could not parse <head> or <body> in _source/index.html")

    head_inner = head_match.group(1)
    # Remove external local CSS links and inline Netlify script from <head>
    head_inner = re.sub(r'<link[^>]+href="(?:css/style\.css|assets/liquid-navbar/liquid-navbar\.css)"[^>]*>', "", head_inner)
    head_inner = re.sub(r"<!--\s*Auto-hide Edge-injected[\s\S]*?</script>", "", head_inner)
    head_clean = minify_head_preserve_jsonld(head_inner)

    body_inner = body_match.group(1)
    # Remove nl-badge-frame & nl-hud-frame (we place them explicitly) and bottom script tags
    body_inner = re.sub(r'<span\s+id="nl-(?:badge|hud)-frame"[^>]*></span>', "", body_inner)
    body_inner = re.sub(r'<script\s+src="(?:js/i18n\.js|js/main\.js|assets/liquid-navbar/liquid-navbar\.js)"[^>]*></script>', "", body_inner)
    body_clean = strip_html_comments(body_inner)

    combined_css = strip_css_comments(css_main + "\n" + css_nav)
    combined_js = (
        NETLIFY_SWEEP_JS
        + "\n"
        + js_i18n
        + "\nwindow.I18N = I18N;\n"
        + js_main
        + "\n"
        + js_nav
    )

    seed = secrets.randbits(31) | 0x10203041
    b64 = encrypt_payload({"c": combined_css, "h": body_clean, "j": combined_js}, seed)
    boot_js = make_bootstrapper(b64, seed)

    guard_minified = "".join(ln.strip() for ln in GUARD_JS.splitlines())

    out_html = (
        '<!DOCTYPE html><html lang="uz" data-theme="dark"><head>'
        + head_clean
        + "<script>"
        + guard_minified
        + "</script></head><body>"
        + '<span id="nl-badge-frame" hidden style="display:none!important;width:0!important;height:0!important;"></span>'
        + '<span id="nl-hud-frame" hidden style="display:none!important;width:0!important;height:0!important;"></span>'
        + "<script>"
        + boot_js
        + "</script>"
        + '<noscript><div style="padding:40px;text-align:center;font-family:sans-serif;color:#fff;background:#060b16;min-height:100vh;">Saytni ko\'rish uchun brauzeringizda JavaScript yoqilgan bo\'lishi kerak.</div></noscript>'
        + "</body></html>"
    )

    out_path = os.path.join(ROOT, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(out_html)
    print(f"[OK] Built protected index.html ({len(out_html):,} bytes)")


def build_admin():
    with open(os.path.join(SRC, "admin.html"), "r", encoding="utf-8") as f:
        raw_html = f.read()

    head_match = re.search(r"<head>([\s\S]*?)</head>", raw_html, flags=re.IGNORECASE)
    body_match = re.search(r"<body>([\s\S]*?)</body>", raw_html, flags=re.IGNORECASE)
    if not head_match or not body_match:
        raise RuntimeError("Could not parse <head> or <body> in _source/admin.html")

    head_inner = head_match.group(1)
    style_match = re.search(r"<style>([\s\S]*?)</style>", head_inner, flags=re.IGNORECASE)
    admin_css = strip_css_comments(style_match.group(1)) if style_match else ""

    head_inner = re.sub(r"<style>[\s\S]*?</style>", "", head_inner, flags=re.IGNORECASE)
    head_inner = re.sub(r"<!--\s*Auto-hide Edge-injected[\s\S]*?</script>", "", head_inner)
    head_clean = strip_html_comments(head_inner)

    body_inner = body_match.group(1)
    body_inner = re.sub(r'<span\s+id="nl-(?:badge|hud)-frame"[^>]*></span>', "", body_inner)

    script_match = re.search(r"<script>([\s\S]*?)</script>\s*$", body_inner, flags=re.IGNORECASE)
    admin_js = script_match.group(1) if script_match else ""
    body_inner = re.sub(r"<script>[\s\S]*?</script>\s*$", "", body_inner, flags=re.IGNORECASE)
    body_clean = strip_html_comments(body_inner)

    combined_js = NETLIFY_SWEEP_JS + "\n" + admin_js

    seed = secrets.randbits(31) | 0x20406081
    b64 = encrypt_payload({"c": admin_css, "h": body_clean, "j": combined_js}, seed)
    boot_js = make_bootstrapper(b64, seed)
    guard_minified = "".join(ln.strip() for ln in GUARD_JS.splitlines())

    out_html = (
        '<!DOCTYPE html><html lang="uz"><head>'
        + head_clean
        + "<script>"
        + guard_minified
        + "</script></head><body>"
        + '<span id="nl-badge-frame" hidden style="display:none!important;width:0!important;height:0!important;"></span>'
        + '<span id="nl-hud-frame" hidden style="display:none!important;width:0!important;height:0!important;"></span>'
        + "<script>"
        + boot_js
        + "</script></body></html>"
    )

    out_path = os.path.join(ROOT, "admin.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(out_html)
    print(f"[OK] Built protected admin.html ({len(out_html):,} bytes)")


if __name__ == "__main__":
    build_index()
    build_admin()
