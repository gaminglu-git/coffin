"use client";

import { useEffect, useState } from "react";
import { Briefcase, CheckCircle, MessageSquare, Users, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentEmployee } from "@/app/actions/employees";

type TabType = "cases" | "tasks" | "handover" | "employees";

interface AdminSidebarProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        getCurrentEmployee().then((emp) => setCurrentUser(emp?.display_name ?? null));
    }, []);

    const handleLogout = () => {
        logoutAction();
    };

    return (
        <div className="w-full md:w-64 bg-emerald-950 text-white flex flex-col shrink-0 z-20 shadow-xl h-full">
            <div className="p-6 border-b border-emerald-800 flex justify-between bg-emerald-950">
                <div>
                    <h2 className="font-serif text-xl">minten & walter</h2>
                    <p className="text-xs text-gray-400">
                        {currentUser ? `Eingeloggt als ${currentUser}` : "Team Workspace"}
                    </p>
                </div>
            </div>

            <div className="flex-1 py-6 px-4 space-y-2 flex flex-col">
                <button
                    onClick={() => setActiveTab("cases")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "cases" ? "bg-emerald-700 shadow-md" : "hover:bg-emerald-700/50"
                        }`}
                >
                    <Briefcase size={18} /> Sterbefälle
                </button>
                <button
                    onClick={() => setActiveTab("tasks")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "tasks" ? "bg-emerald-700 shadow-md" : "hover:bg-emerald-700/50"
                        }`}
                >
                    <CheckCircle size={18} /> Aufgaben & Termine
                </button>
                <button
                    onClick={() => setActiveTab("handover")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "handover" ? "bg-emerald-700 shadow-md" : "hover:bg-emerald-700/50"
                        }`}
                >
                    <MessageSquare size={18} /> Übergabebuch
                </button>
                <button
                    onClick={() => setActiveTab("employees")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "employees" ? "bg-emerald-700 shadow-md" : "hover:bg-emerald-700/50"
                        }`}
                >
                    <Users size={18} /> Mitarbeiter
                </button>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white mt-auto transition"
                >
                    <LogOut size={18} /> Abmelden
                </button>
            </div>
        </div>
    );
}
