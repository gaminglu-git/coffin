"use client";

import { useState } from "react";
import Link from "next/link";
import { FileSearch, Key, Lock, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
    variant?: "home" | "family";
    onLogout?: () => void;
}

export function Navbar({ variant = "home", onLogout }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                            <h1 className="font-serif text-2xl text-emerald-800">liebevoll bestatten</h1>
                            <p className="text-xs tracking-widest text-stone-500 uppercase">Angehörigen portal</p>
                        </Link>
                    ) : (
                    <div
                        className="shrink-0 cursor-pointer"
                        onClick={() => scrollTo("hero")}
                    >
                        <h1 className="font-serif text-2xl text-emerald-800">
                            liebevoll bestatten
                        </h1>
                        <p className="text-xs tracking-widest text-stone-500 uppercase">
                            minten & walter · Bonn
                        </p>
                    </div>
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
