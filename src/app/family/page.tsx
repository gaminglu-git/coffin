"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function FamilyLogin() {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from("cases")
                .select("family_pin")
                .eq("family_pin", pin.toUpperCase())
                .single();

            if (error || !data) {
                throw new Error("Ungültiger Zugangs-Code.");
            }

            router.push(`/family/${data.family_pin}`);
        } catch (err: any) {
            setError(err.message || "Fehler beim Login.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-mw-sand)] flex items-center justify-center px-4 relative z-50">
            <div className="absolute top-6 left-6">
                <Link href="/" className="font-serif text-xl text-[var(--color-mw-green)]">
                    minten & walter
                </Link>
            </div>

            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 sm:p-12 relative overflow-hidden border border-gray-100">
                <div className="absolute top-0 left-0 w-full h-2 bg-[var(--color-mw-green-light)]"></div>

                <Link href="/" className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </Link>

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-[var(--color-mw-sand-light)] rounded-full mx-auto flex items-center justify-center mb-4">
                        <Key className="text-[var(--color-mw-green-light)]" size={32} />
                    </div>
                    <h2 className="text-2xl font-serif text-[var(--color-mw-green)]">Angehörigen Login</h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}
                    <div>
                        <input
                            type="text"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-mw-green-light)] outline-none text-center text-2xl tracking-widest uppercase font-mono"
                            placeholder="Z.B. A1B2C3"
                            required
                            maxLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || pin.length < 6}
                        className="w-full bg-[var(--color-mw-green-light)] text-white py-4 rounded-xl font-medium hover:bg-[#6c7870] disabled:bg-gray-400 flex justify-center items-center gap-2 shadow-md transition"
                    >
                        {isLoading ? "Wird geprüft..." : "Zum Family-Portal"} <ChevronRight size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
