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

const DOCK_QUERY = "(max-width: 900px)"

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

function currentTone(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"
}

function headerOffset() {
  return (document.getElementById("header")?.offsetHeight ?? 80) + 8
}

function HeaderLiquidNav({ host }: { host: HTMLElement }) {
  const [lang, setLang] = React.useState(currentLang)
  const [tone, setTone] = React.useState(currentTone)
  const [active, setActive] = React.useState(0)
  const [dock, setDock] = React.useState(() => window.matchMedia(DOCK_QUERY).matches)
  const [fitCompact, setFitCompact] = React.useState(false)
  const [fitPass, setFitPass] = React.useState(0)
  const lockUntil = React.useRef(0)

  /* follow site language + dark/light theme (both live on <html>) */
  React.useEffect(() => {
    const mo = new MutationObserver(() => {
      setLang(currentLang())
      setTone(currentTone())
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "data-theme"] })
    return () => mo.disconnect()
  }, [])

  /* phones -> bottom dock (icons only) */
  React.useEffect(() => {
    const mq = window.matchMedia(DOCK_QUERY)
    const on = () => setDock(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  /* desktop: show labels when they fit in the header row, otherwise icons only */
  React.useEffect(() => {
    let t = 0
    const retry = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => {
        setFitCompact(false)
        setFitPass((n) => n + 1)
      }, 120)
    }
    window.addEventListener("resize", retry)
    return () => {
      window.removeEventListener("resize", retry)
      window.clearTimeout(t)
    }
  }, [])
  React.useEffect(() => {
    setFitCompact(false)
    setFitPass((n) => n + 1)
  }, [lang])
  React.useLayoutEffect(() => {
    if (dock || fitCompact) return
    const row = host.closest(".navbar-inner") as HTMLElement | null
    if (!row) return
    const styles = getComputedStyle(row)
    const gap = parseFloat(styles.columnGap || "0") || 0
    const kids = Array.from(row.children).filter((el) => (el as HTMLElement).offsetWidth > 0) as HTMLElement[]
    const used = kids.reduce((sum, el) => sum + el.offsetWidth, 0) + gap * Math.max(0, kids.length - 1) + 32
    const avail = row.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight)
    if (used > avail) setFitCompact(true)
  }, [dock, fitCompact, fitPass, host])

  /* scroll-spy: highlight the section currently on screen */
  React.useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id))
    const onScroll = () => {
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
      tone={tone}
      compact={dock || fitCompact}
      sound={false}
    />
  )
}

function mount() {
  const host = document.getElementById("liquidNavRoot")
  if (!host || host.dataset.mounted) return
  host.dataset.mounted = "1"
  createRoot(host).render(<HeaderLiquidNav host={host} />)
  document.documentElement.classList.add("liquid-nav-ready")
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount)
else mount()
