"use client";

import React, { useState } from 'react';
import { ArrowUpRight, ArrowRight, Play, Menu } from 'lucide-react';

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
    partnersTitle?: string;
    partners?: Partner[];
    hideHeader?: boolean;
}

const ResponsiveHeroBanner: React.FC<ResponsiveHeroBannerProps> = ({
    logoUrl = "/logo.webp",
    backgroundImageUrl = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80",
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
    partnersTitle = "Xalqaro ta'lim standartlari va asosiy ko'rsatkichlarimiz",
    partners = [
        { logoUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=300&q=80", href: "#about", name: "Cambridge Program" },
        { logoUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=300&q=80", href: "#programs", name: "STEM Lab" },
        { logoUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=300&q=80", href: "#gallery", name: "IELTS 7.5+" },
        { logoUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=300&q=80", href: "#teachers", name: "Native Speakers" },
        { logoUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80", href: "#facilities", name: "IT & Robotics" }
    ],
    hideHeader = false
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <section className="w-full isolate min-h-screen overflow-hidden relative">
            <img
                src={backgroundImageUrl}
                alt=""
                className="w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-black/30" />

            {!hideHeader && (
                <header className="z-10 xl:top-4 relative">
                    <div className="mx-6">
                        <div className="flex items-center justify-between pt-4">
                            <a
                                href="#"
                                className="inline-flex items-center justify-center bg-center w-[100px] h-[40px] bg-cover rounded"
                                style={{ backgroundImage: `url(${logoUrl})` }}
                            />

                            <nav className="hidden md:flex items-center gap-2">
                                <div className="flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
                                    {navLinks.map((link, index) => (
                                        <a
                                            key={index}
                                            href={link.href}
                                            className={`px-3 py-2 text-sm font-medium hover:text-white font-sans transition-colors ${link.isActive ? 'text-white/90' : 'text-white/80'}`}
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                    <a
                                        href={ctaButtonHref}
                                        className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-white/90 font-sans transition-colors"
                                    >
                                        {ctaButtonText}
                                        <ArrowUpRight className="h-4 w-4" />
                                    </a>
                                </div>
                            </nav>

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur"
                                aria-expanded={mobileMenuOpen}
                                aria-label="Toggle menu"
                            >
                                <Menu className="h-5 w-5 text-white/90" />
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <div className="z-10 relative">
                <div className="sm:pt-28 md:pt-32 lg:pt-40 max-w-7xl mx-auto pt-28 px-6 pb-16">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur animate-fade-slide-in-1">
                            <span className="inline-flex items-center text-xs font-medium text-neutral-900 bg-white/90 rounded-full py-0.5 px-2 font-sans">
                                {badgeLabel}
                            </span>
                            <span className="text-sm font-medium text-white/90 font-sans">
                                {badgeText}
                            </span>
                        </div>

                        <h1 className="sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-4xl text-white tracking-tight font-instrument-serif font-normal animate-fade-slide-in-2">
                            {title}
                            <br className="hidden sm:block" />
                            {titleLine2}
                        </h1>

                        <p className="sm:text-lg animate-fade-slide-in-3 text-base text-white/80 max-w-2xl mt-6 mx-auto">
                            {description}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:gap-4 mt-10 gap-3 items-center justify-center animate-fade-slide-in-4">
                            <a
                                href={primaryButtonHref}
                                className="inline-flex items-center gap-2 hover:bg-white/15 text-sm font-medium text-white bg-white/10 ring-white/15 ring-1 rounded-full py-3 px-5 font-sans transition-colors"
                            >
                                {primaryButtonText}
                                <ArrowRight className="h-4 w-4" />
                            </a>
                            <a
                                href={secondaryButtonHref}
                                className="inline-flex items-center gap-2 rounded-full bg-transparent px-5 py-3 text-sm font-medium text-white/90 hover:text-white font-sans transition-colors"
                            >
                                {secondaryButtonText}
                                <Play className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    <div className="mx-auto mt-20 max-w-5xl">
                        <p className="animate-fade-slide-in-1 text-sm text-white/70 text-center">
                            {partnersTitle}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 animate-fade-slide-in-2 text-white/70 mt-6 items-center justify-items-center gap-4">
                            {partners.map((partner, index) => (
                                <a
                                    key={index}
                                    href={partner.href}
                                    className="inline-flex items-center justify-center bg-center w-[120px] h-[36px] bg-cover rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                    style={{ backgroundImage: `url(${partner.logoUrl})` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResponsiveHeroBanner;
