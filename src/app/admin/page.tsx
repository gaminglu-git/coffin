"use client";

import { useState } from "react";
import { Lock, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default function AdminLogin() {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await loginAction(formData);
            if (result?.error) {
                setError(result.error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mw-sand flex items-center justify-center px-4 relative z-50">
            <div className="absolute top-6 left-6">
                <Link href="/" className="font-serif text-xl text-mw-green">
                    minten & walter
                </Link>
            </div>

            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 sm:p-12 relative overflow-hidden border border-gray-100">
                <div className="absolute top-0 left-0 w-full h-2 bg-mw-green"></div>

                <Link href="/" className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </Link>

                <div className="text-center mb-10">
                    <Lock className="mx-auto text-mw-green mb-4" size={40} />
                    <h2 className="text-2xl font-serif text-mw-green">Mitarbeiter Login</h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail</label>
                        <input
                            name="email"
                            type="email"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mw-green outline-none"
                            placeholder="name@minten-walter.de"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
                        <input
                            name="password"
                            type="password"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mw-green outline-none"
                            placeholder="2026!"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-mw-green text-white py-3 rounded-xl font-medium hover:bg-mw-green-dark disabled:bg-gray-400 flex justify-center items-center gap-2 shadow-md transition"
                    >
                        {isLoading ? "Bitte warten..." : "Einloggen"} <ChevronRight size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
