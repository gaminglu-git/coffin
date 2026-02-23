"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, CheckCircle, MessageSquare, Users, Package, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentEmployee } from "@/app/actions/employees";

type TabType = "cases" | "tasks" | "handover" | "employees";

interface AdminShellProps {
  children: React.ReactNode;
  /** When provided, sidebar uses tab mode (dashboard). Otherwise uses link mode (inventory). */
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export function AdminShell({ children, activeTab, setActiveTab }: AdminShellProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const isDashboard = pathname.startsWith("/admin/dashboard");
  const isInventory = pathname.startsWith("/admin/inventory");

  useEffect(() => {
    getCurrentEmployee().then((emp) => setCurrentUser(emp?.display_name ?? null));
  }, []);

  const handleLogout = () => {
    logoutAction();
  };

  const navItem = (
    icon: React.ReactNode,
    label: string,
    tab: TabType,
    href: string
  ) => {
    if (isDashboard && setActiveTab && activeTab !== undefined) {
      return (
        <button
          onClick={() => setActiveTab(tab)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition w-full text-left ${
            activeTab === tab ? "bg-mw-green shadow-md" : "hover:bg-mw-green/50"
          }`}
        >
          {icon} {label}
        </button>
      );
    }
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
          pathname === href ? "bg-mw-green shadow-md" : "hover:bg-mw-green/50"
        }`}
      >
        {icon} {label}
      </Link>
    );
  };

  return (
    <div className="h-screen bg-[#f3f4f6] flex flex-col md:flex-row overflow-hidden relative z-10 w-full font-sans text-gray-800">
      <div className="w-full md:w-64 bg-mw-green-dark text-white flex flex-col shrink-0 z-20 shadow-xl h-full">
        <div className="p-6 border-b border-gray-700 flex justify-between bg-[#353e39]">
          <div>
            <h2 className="font-serif text-xl">minten & walter</h2>
            <p className="text-xs text-gray-400">
              {currentUser ? `Eingeloggt als ${currentUser}` : "Team Workspace"}
            </p>
          </div>
        </div>
        <div className="flex-1 py-6 px-4 space-y-2 flex flex-col">
          {navItem(
            <Briefcase size={18} />,
            "Sterbefälle",
            "cases",
            "/admin/dashboard"
          )}
          {navItem(
            <CheckCircle size={18} />,
            "Aufgaben & Termine",
            "tasks",
            "/admin/dashboard"
          )}
          {navItem(
            <MessageSquare size={18} />,
            "Übergabebuch",
            "handover",
            "/admin/dashboard"
          )}
          {navItem(
            <Users size={18} />,
            "Mitarbeiter",
            "employees",
            "/admin/dashboard"
          )}
          <Link
            href="/admin/inventory"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              isInventory ? "bg-mw-green shadow-md" : "hover:bg-mw-green/50"
            }`}
          >
            <Package size={18} /> Lager
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white mt-auto transition"
          >
            <LogOut size={18} /> Abmelden
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
