"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, CheckCircle, MessageSquare, Users, Package, LogOut, Menu, X } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDashboard = pathname.startsWith("/admin/dashboard");
  const isInventory = pathname.startsWith("/admin/inventory");

  useEffect(() => {
    getCurrentEmployee().then((emp) => setCurrentUser(emp?.display_name ?? null));
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

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
          onClick={() => {
            setActiveTab(tab);
            closeSidebar();
          }}
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
        onClick={closeSidebar}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
          pathname === href ? "bg-mw-green shadow-md" : "hover:bg-mw-green/50"
        }`}
      >
        {icon} {label}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-[#353e39]">
        <div>
          <h2 className="font-serif text-xl">minten & walter</h2>
          <p className="text-xs text-gray-400">
            {currentUser ? `Eingeloggt als ${currentUser}` : "Team Workspace"}
          </p>
        </div>
        <button
          onClick={closeSidebar}
          className="md:hidden p-2 -m-2 rounded-lg hover:bg-white/10 transition"
          aria-label="Menü schließen"
        >
          <X size={20} />
        </button>
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
          onClick={closeSidebar}
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
    </>
  );

  return (
    <div className="h-screen bg-[#f3f4f6] flex flex-col md:flex-row overflow-hidden relative z-10 w-full font-sans text-gray-800">
      {/* Mobile: overlay backdrop */}
      {sidebarOpen && (
        <button
          onClick={closeSidebar}
          className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
          aria-label="Menü schließen"
        />
      )}

      {/* Sidebar: mobile overlay / desktop fixed */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40 h-full
          w-64 max-w-[85vw] md:w-64
          bg-mw-green-dark text-white flex flex-col shrink-0 shadow-xl
          transform transition-transform duration-300 ease-out
          md:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Mobile: hamburger button */}
        <div className="md:hidden flex items-center gap-2 p-4 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -m-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Menü öffnen"
          >
            <Menu size={24} className="text-gray-700" />
          </button>
          <span className="font-serif text-lg text-gray-800">minten & walter</span>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
