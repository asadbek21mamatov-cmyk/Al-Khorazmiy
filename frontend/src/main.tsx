import "./index.css"
import * as React from "react"
import { createRoot } from "react-dom/client"
import { Info, Images, Clapperboard, Newspaper, FilePenLine, Phone } from "lucide-react"
import { LiquidNavbar, NimbusIcons, type LiquidNavItem, type NimbusFx } from "@/components/ui/liquid-glass-navbar"

/* `I18N` is a top-level `const` declared by the static site's js/i18n.js */
declare const I18N: Record<string, Record<string, string>> | undefined

type Section = { id: string; key: string; fallback: string; icon: React.ReactNode; fx: NimbusFx }

const ico = { size: 18, strokeWidth: 1.8, "aria-hidden": true } as const

const SECTIONS: Section[] = [
  { id: "hero", key: "nav_home", fallback: "Bosh sahifa", icon: NimbusIcons.home, fx: "glow" },
  { id: "about", key: "nav_about", fallback: "Maktab haqida", icon: <Info {...ico} />, fx: "spin" },
  { id: "gallery", key: "nav_gallery", fallback: "Galereya", icon: <Images {...ico} />, fx: "pop" },
  { id: "videos", key: "nav_videos", fallback: "Videolar", icon: <Clapperboard {...ico} />, fx: "plane" },
  { id: "news", key: "nav_news", fallback: "Yangiliklar", icon: <Newspaper {...ico} />, fx: "wave" },
  { id: "admission", key: "nav_admission", fallback: "Ariza Qoldirish", icon: <FilePenLine {...ico} />, fx: "drop" },
  { id: "contact", key: "nav_contact", fallback: "Aloqa", icon: <Phone {...ico} />, fx: "wave" },
]

function currentLang() {
  return document.documentElement.lang || localStorage.getItem("al_lang") || "uz"
}

function translate(lang: string, key: string, fallback: string) {
  try {
    const dict = typeof I18N !== "undefined" ? I18N[lang] || I18N.uz : undefined
    const raw = dict?.[key]
    if (!raw) return fallback
    const tmp = document.createElement("div")
    tmp.innerHTML = raw
    return (tmp.textContent || fallback).trim()
  } catch {
    return fallback
  }
}

function headerOffset() {
  return (document.getElementById("header")?.offsetHeight ?? 80) + 18
}

function HeaderLiquidNav() {
  const [lang, setLang] = React.useState(currentLang)
  const [active, setActive] = React.useState(0)
  const lockUntil = React.useRef(0)

  /* follow site language changes */
  React.useEffect(() => {
    const mo = new MutationObserver(() => {
      setLang(currentLang())
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] })
    return () => mo.disconnect()
  }, [])

  /* scroll-spy + Dynamic Island condense state on scroll */
  React.useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id))
    const headerEl = document.getElementById("header")
    const onScroll = () => {
      if (headerEl) {
        headerEl.classList.toggle("island-condensed", window.scrollY > 60)
      }
      if (performance.now() < lockUntil.current) return
      const y = window.scrollY + headerOffset() + 40
      let cur = 0
      els.forEach((el, i) => {
        if (el && y >= el.getBoundingClientRect().top + window.scrollY) cur = i
      })
      setActive(cur)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const items: LiquidNavItem[] = React.useMemo(
    () => SECTIONS.map((s) => ({ label: translate(lang, s.key, s.fallback), icon: s.icon, fx: s.fx })),
    [lang]
  )

  const go = (i: number) => {
    const sec = SECTIONS[i]
    const el = document.getElementById(sec.id)
    setActive(i)
    lockUntil.current = performance.now() + 1100
    if (!el) return
    const top = i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY - headerOffset()
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
    history.replaceState(null, "", `#${sec.id}`)
  }

  return (
    <LiquidNavbar
      items={items}
      active={active}
      onChange={(i) => go(i)}
      tone="dark"
      dynamicIsland={true}
      sound={false}
    />
  )
}

function mount() {
  const host = document.getElementById("liquidNavRoot")
  if (!host || host.dataset.mounted) return
  host.dataset.mounted = "1"
  createRoot(host).render(<HeaderLiquidNav />)
  document.documentElement.classList.add("liquid-nav-ready")
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount)
else mount()
