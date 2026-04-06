"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BookOpen, Play, Trophy, Monitor, Smartphone, Layout } from "lucide-react";
import { useViewMode } from "./ViewProvider";

const NAV_ITEMS = [
    { href: "/nutripreneur", label: "Home", icon: Home },
    { href: "/nutripreneur/content-bank", label: "Content", icon: BookOpen },
    { href: "/nutripreneur/reels", label: "Reels", icon: Play },
    { href: "/nutripreneur/progress", label: "Progress", icon: Trophy },
];

export default function NutripreneurNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { mode } = useViewMode();

    if (mode === 'laptop') {
        return (
            <div className="fixed left-0 top-0 bottom-0 w-24 z-50 flex flex-col items-center py-12 bg-[#0D2A1E] border-r border-white/5 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-12 shadow-lg" 
                     style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6E2F)' }}>
                    <Layout size={24} color="#0D2A1E" />
                </div>
                
                <nav className="flex flex-col gap-10">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <button
                                key={href}
                                onClick={() => router.push(href)}
                                className="relative flex flex-col items-center gap-2 group transition-all"
                            >
                                <Icon
                                    size={24}
                                    className="transition-transform group-hover:scale-110"
                                    style={{ color: isActive ? '#C9A84C' : 'rgba(250,247,240,0.3)' }}
                                />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em]"
                                    style={{ color: isActive ? '#C9A84C' : 'rgba(250,247,240,0.2)' }}>
                                    {label}
                                </span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="np-nav-side" 
                                        className="absolute -left-6 w-1 .5 h-8 bg-[#C9A84C] rounded-r-full shadow-[0_0_15px_rgba(201,168,76,0.5)]" 
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        );
    }

    return (
        <div className="sticky bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-6 mt-auto pb-4">
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-16 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }}
            />

            <nav
                className="relative pointer-events-auto flex items-center gap-1 px-4 py-3"
                style={{
                    background: 'rgba(13,42,30,0.85)',
                    backdropFilter: 'blur(32px)',
                    borderRadius: '100px 100px 80px 80px',
                    border: '1px solid rgba(201,168,76,0.18)',
                    boxShadow: `
                        0 -1px 0 rgba(201,168,76,0.12) inset,
                        0 8px 32px rgba(0,0,0,0.5),
                        0 2px 0 rgba(201,168,76,0.08),
                        0 32px 48px rgba(0,0,0,0.25)
                    `
                }}
            >
                <div
                    className="absolute top-0 left-4 right-4 h-px pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }}
                />

                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <button
                            key={href}
                            onClick={() => router.push(href)}
                            className="relative flex flex-col items-center gap-1 px-5 py-2 rounded-[3rem] transition-all"
                            style={{ minWidth: 64 }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="np-nav-pill"
                                    className="absolute inset-0 rounded-[3rem]"
                                    style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))', border: '1px solid rgba(201,168,76,0.25)' }}
                                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                />
                            )}

                            <Icon
                                size={20}
                                className="relative z-10 transition-all"
                                style={{ color: isActive ? '#C9A84C' : 'rgba(250,247,240,0.3)', strokeWidth: isActive ? 2 : 1.5 }}
                            />
                            <span
                                className="relative z-10 text-[9px] font-black uppercase tracking-widest transition-all"
                                style={{ color: isActive ? '#C9A84C' : 'rgba(250,247,240,0.25)' }}
                            >
                                {label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="np-nav-dot"
                                    className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                                    style={{ background: '#C9A84C' }}
                                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
