"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSearch, Key, Lock, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
    variant?: "home" | "family";
    onLogout?: () => void;
    /** Whitelabel: Anzeigename (z.B. "liebevoll bestatten") */
    displayName?: string;
    /** Whitelabel: Unterzeile (z.B. "minten & walter · Bonn") */
    tagline?: string;
}

export function Navbar({ variant = "home", onLogout, displayName = "liebevoll bestatten", tagline = "minten & walter · Bonn" }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isHome = pathname === "/";

    const scrollTo = (id: string) => {
        setMobileMenuOpen(false);
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    return (
        <nav className="fixed w-full bg-stone-50/95 backdrop-blur-md shadow-sm z-40 border-b border-stone-200 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {variant === "family" ? (
                        <Link href="/" className="shrink-0">
                            <h1 className="font-serif text-2xl text-emerald-800">{displayName}</h1>
                            <p className="text-xs tracking-widest text-stone-500 uppercase">Angehörigen portal</p>
                        </Link>
                    ) : isHome ? (
                    <div
                        className="shrink-0 cursor-pointer"
                        onClick={() => scrollTo("hero")}
                    >
                        <h1 className="font-serif text-2xl text-emerald-800">
                            {displayName}
                        </h1>
                        <p className="text-xs tracking-widest text-stone-500 uppercase">
                            {tagline}
                        </p>
                    </div>
                    ) : (
                    <Link href="/" className="shrink-0">
                        <h1 className="font-serif text-2xl text-emerald-800">
                            {displayName}
                        </h1>
                        <p className="text-xs tracking-widest text-stone-500 uppercase">
                            {tagline}
                        </p>
                    </Link>
                    )}

                    {variant === "family" ? (
                    <div className="flex items-center">
                        {onLogout && (
                            <Button variant="outline" onClick={onLogout} className="text-stone-500 hover:text-red-500 text-sm font-medium flex items-center gap-2 bg-stone-100 transition border-stone-200">
                                <LogOut size={16} /> Abmelden
                            </Button>
                        )}
                    </div>
                    ) : (
                    <div className="hidden md:flex space-x-8 items-center">
                        {isHome ? (
                            <>
                        <button
                            onClick={() => scrollTo("philosophie")}
                            className="text-stone-600 hover:text-emerald-800 transition text-sm font-medium"
                        >
                            Philosophie
                        </button>
                        <button
                            onClick={() => scrollTo("leistungen")}
                            className="text-stone-600 hover:text-emerald-800 transition text-sm font-medium"
                        >
                            Leistungen
                        </button>
                            </>
                        ) : (
                            <>
                        <Link href="/#philosophie" className="text-stone-600 hover:text-emerald-800 transition text-sm font-medium">
                            Philosophie
                        </Link>
                        <Link href="/#leistungen" className="text-stone-600 hover:text-emerald-800 transition text-sm font-medium">
                            Leistungen
                        </Link>
                            </>
                        )}
                        {isHome ? (
                            <button
                                onClick={() => scrollTo("team")}
                                className="text-stone-600 hover:text-emerald-800 transition text-sm font-medium"
                            >
                                Team
                            </button>
                        ) : (
                            <Link
                                href="/#team"
                                className="text-stone-600 hover:text-emerald-800 transition text-sm font-medium"
                            >
                                Team
                            </Link>
                        )}
                        <Link
                            href="/termine"
                            className="text-stone-600 hover:text-emerald-800 transition text-sm font-medium"
                        >
                            Termine
                        </Link>
                        {isHome ? (
                            <>
                        <Button
                            variant="ghost"
                            onClick={() => scrollTo("vorsorge")}
                            className="text-emerald-800 font-medium flex items-center gap-1 hover:text-emerald-900 hover:bg-transparent transition text-sm"
                        >
                            <FileSearch size={16} /> Vorsorge Planer
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => scrollTo("kontakt")}
                            className="rounded-full border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white transition text-sm font-medium"
                        >
                            Kontakt
                        </Button>
                            </>
                        ) : (
                            <>
                        <Link href="/#vorsorge">
                            <Button
                                variant="ghost"
                                className="text-emerald-800 font-medium flex items-center gap-1 hover:text-emerald-900 hover:bg-transparent transition text-sm"
                            >
                                <FileSearch size={16} /> Vorsorge Planer
                            </Button>
                        </Link>
                        <Link href="/#kontakt">
                            <Button
                                variant="outline"
                                className="rounded-full border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white transition text-sm font-medium"
                            >
                                Kontakt
                            </Button>
                        </Link>
                            </>
                        )}

                        <div className="flex items-center gap-4 border-l border-stone-300 pl-6">
                            <Link
                                href="/family"
                                className="text-stone-500 hover:text-emerald-800 transition text-sm font-medium flex items-center gap-1"
                            >
                                <Key size={16} /> Familien-Login
                            </Link>
                            <Link
                                href="/admin"
                                className="text-stone-400 hover:text-emerald-800 bg-stone-100 p-2 rounded-full transition"
                                title="Mitarbeiter Login"
                            >
                                <User size={16} />
                            </Link>
                        </div>
                    </div>
                    )}

                    {variant !== "family" && (
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-stone-600"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                    )}
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden bg-white px-4 py-4 space-y-4 shadow-lg border-t border-stone-100">
                    {isHome ? (
                        <>
                    <button
                        onClick={() => scrollTo("philosophie")}
                        className="block w-full text-left py-2 text-stone-700 font-medium"
                    >
                        Philosophie
                    </button>
                    <button
                        onClick={() => scrollTo("leistungen")}
                        className="block w-full text-left py-2 text-stone-700 font-medium"
                    >
                        Leistungen
                    </button>
                        </>
                    ) : (
                        <>
                    <Link href="/#philosophie" className="block w-full text-left py-2 text-stone-700 font-medium" onClick={() => setMobileMenuOpen(false)}>
                        Philosophie
                    </Link>
                    <Link href="/#leistungen" className="block w-full text-left py-2 text-stone-700 font-medium" onClick={() => setMobileMenuOpen(false)}>
                        Leistungen
                    </Link>
                        </>
                    )}
                    {isHome ? (
                        <button
                            onClick={() => { scrollTo("team"); setMobileMenuOpen(false); }}
                            className="block w-full text-left py-2 text-stone-700 font-medium"
                        >
                            Team
                        </button>
                    ) : (
                        <Link
                            href="/#team"
                            className="block w-full text-left py-2 text-stone-700 font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Team
                        </Link>
                    )}
                    <Link
                        href="/termine"
                        className="block w-full text-left py-2 text-stone-700 font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Termine
                    </Link>
                    {isHome ? (
                        <>
                    <button
                        onClick={() => scrollTo("vorsorge")}
                        className="block w-full text-left py-2 text-emerald-800 font-bold"
                    >
                        Vorsorge planen
                    </button>
                    <button
                        onClick={() => scrollTo("kontakt")}
                        className="block w-full text-left py-2 text-stone-700 font-medium"
                    >
                        Kontakt
                    </button>
                        </>
                    ) : (
                        <>
                    <Link href="/#vorsorge" className="block w-full text-left py-2 text-emerald-800 font-bold" onClick={() => setMobileMenuOpen(false)}>
                        Vorsorge planen
                    </Link>
                    <Link href="/#kontakt" className="block w-full text-left py-2 text-stone-700 font-medium" onClick={() => setMobileMenuOpen(false)}>
                        Kontakt
                    </Link>
                        </>
                    )}
                    <div className="border-t pt-4 space-y-4">
                        <Link
                            href="/family"
                            className="w-full text-left text-stone-600 font-medium flex items-center gap-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Key size={16} /> Familien-Login
                        </Link>
                        <Link
                            href="/admin"
                            className="w-full text-left text-stone-400 font-medium flex items-center gap-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Lock size={16} /> Mitarbeiter Login
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
