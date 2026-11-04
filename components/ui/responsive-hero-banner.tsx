"use client";

import React, { useState } from 'react';
import { ArrowUpRight, ArrowRight, Play, Menu, X, Phone } from 'lucide-react';

export interface NavLink {
    label: string;
    href: string;
    isActive?: boolean;
}

export interface Partner {
    logoUrl: string;
    href: string;
    name?: string;
}

export interface SocialLink {
    name: string;
    href: string;
    icon?: 'telegram' | 'instagram' | 'youtube' | 'facebook' | 'phone';
}

export interface ResponsiveHeroBannerProps {
    logoUrl?: string;
    backgroundImageUrl?: string;
    navLinks?: NavLink[];
    ctaButtonText?: string;
    ctaButtonHref?: string;
    badgeText?: string;
    badgeLabel?: string;
    title?: string;
    titleLine2?: string;
    description?: string;
    primaryButtonText?: string;
    primaryButtonHref?: string;
    secondaryButtonText?: string;
    secondaryButtonHref?: string;
    socialsTitle?: string;
    partnersTitle?: string;
    partners?: Partner[];
    socialLinks?: SocialLink[];
    hideHeader?: boolean;
}

const BrandIcons = {
    telegram: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-sky-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
        </svg>
    ),
    instagram: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-pink-400">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
    ),
    youtube: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-red-400">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
    ),
    facebook: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-blue-400">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
    ),
    phone: <Phone className="w-4 h-4 text-emerald-400" />
};

const ResponsiveHeroBanner: React.FC<ResponsiveHeroBannerProps> = ({
    logoUrl = "/logo.webp",
    backgroundImageUrl = "/assets/hero/school_angle.webp",
    navLinks = [
        { label: "Bosh sahifa", href: "#hero", isActive: true },
        { label: "Maktab haqida", href: "#about" },
        { label: "Galereya", href: "#gallery" },
        { label: "Videolar", href: "#videos" },
        { label: "Yangiliklar", href: "#news" },
        { label: "Aloqa", href: "#contact" }
    ],
    ctaButtonText = "Ariza Qoldirish",
    ctaButtonHref = "#admission",
    badgeLabel = "2026–2027",
    badgeText = "Namanganning №1 Xalqaro Maktabi",
    title = "Farzandingizga Xalqaro",
    titleLine2 = "Sifatli Ta'lim Bering",
    description = "Al-Khorazmiy International School — zamonaviy texnologiyalar, chuqurlashtirilgan ingliz tili va STEM fanlari orqali farzandingizni dunyoga tayyorlaydigan innovatsion ta'lim markazi.",
    primaryButtonText = "2026-2027 Qabulga Yozilish",
    primaryButtonHref = "#admission",
    secondaryButtonText = "Maktab haqida",
    secondaryButtonHref = "#about",
    socialsTitle = "Bizni ijtimoiy tarmoqlarda kuzating",
    partnersTitle,
    socialLinks = [
        { name: "Telegram", href: "https://t.me/al_khorazmiy_school", icon: "telegram" },
        { name: "Instagram", href: "https://www.instagram.com/al_xorazmiy.school", icon: "instagram" },
        { name: "YouTube", href: "https://www.youtube.com/@al_khorazmiy_school", icon: "youtube" },
        { name: "Facebook", href: "https://www.facebook.com/al_xorazmiy.school", icon: "facebook" },
        { name: "+998 94 303 07 07", href: "tel:+998943030707", icon: "phone" }
    ],
    hideHeader = false
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <section className="w-full isolate min-h-screen overflow-hidden relative bg-[#09090b] flex flex-col justify-between">
            <img
                src={backgroundImageUrl}
                alt="Hero Background"
                className="w-full h-full object-cover object-center absolute inset-0 -z-10 opacity-95 brightness-90"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-black/30 bg-radial-gradient -z-10" />

            {!hideHeader && (
                <header className="z-10 xl:top-4 relative">
                    <div className="mx-6">
                        <div className="flex items-center justify-between pt-4">
                            <a
                                href="#hero"
                                className="inline-flex items-center justify-center bg-center w-[120px] h-[40px] bg-contain bg-no-repeat"
                                style={{ backgroundImage: `url(${logoUrl})` }}
                                aria-label="Logo"
                            />

                            <nav className="hidden md:flex items-center gap-2">
                                <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1.5 ring-1 ring-white/10 backdrop-blur-md">
                                    {navLinks.map((link, index) => (
                                        <a
                                            key={index}
                                            href={link.href}
                                            className={`px-3 py-2 text-sm font-medium hover:text-white font-sans transition-colors ${link.isActive ? 'text-white' : 'text-white/80'}`}
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                    <a
                                        href={ctaButtonHref}
                                        className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white/90 font-sans transition-colors shadow-sm"
                                    >
                                        {ctaButtonText}
                                        <ArrowUpRight className="h-4 w-4" />
                                    </a>
                                </div>
                            </nav>

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur text-white"
                                aria-expanded={mobileMenuOpen}
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <div className="z-10 relative flex-1 flex flex-col justify-center">
                <div className="sm:pt-28 md:pt-32 lg:pt-36 max-w-7xl mx-auto pt-24 px-6 pb-16 w-full">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur animate-fade-slide-in-1">
                            <span className="inline-flex items-center text-xs font-semibold text-neutral-900 bg-white/95 rounded-full py-0.5 px-2 font-sans">
                                {badgeLabel}
                            </span>
                            <span className="text-sm font-medium text-white/90 font-sans">
                                {badgeText}
                            </span>
                        </div>

                        <h1 className="sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-4xl text-white tracking-tight font-instrument-serif font-normal animate-fade-slide-in-2">
                            {title}
                            <br className="hidden sm:block" />
                            {' '}{titleLine2}
                        </h1>

                        <p className="sm:text-lg animate-fade-slide-in-3 text-base text-white/80 max-w-2xl mt-6 mx-auto leading-relaxed font-sans">
                            {description}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:gap-4 mt-10 gap-3 items-center justify-center animate-fade-slide-in-4">
                            <a
                                href={primaryButtonHref}
                                className="inline-flex items-center gap-2 hover:bg-white/20 text-sm font-medium text-white bg-white/10 ring-white/20 ring-1 rounded-full py-3 px-6 font-sans backdrop-blur transition-all"
                            >
                                {primaryButtonText}
                                <ArrowRight className="h-4 w-4" />
                            </a>
                            <a
                                href={secondaryButtonHref}
                                className="inline-flex items-center gap-2 rounded-full bg-transparent px-5 py-3 text-sm font-medium text-white/90 hover:text-white hover:bg-white/5 font-sans transition-all"
                            >
                                {secondaryButtonText}
                                <Play className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    <div className="mx-auto mt-16 max-w-5xl text-center">
                        <p className="animate-fade-slide-in-1 text-sm text-white/70 text-center font-sans mb-4">
                            {socialsTitle || partnersTitle}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-slide-in-2">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    target={social.href.startsWith('http') ? '_blank' : undefined}
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/20 ring-1 ring-white/15 backdrop-blur transition-all hover:-translate-y-0.5"
                                >
                                    {social.icon && BrandIcons[social.icon]}
                                    <span>{social.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResponsiveHeroBanner;
