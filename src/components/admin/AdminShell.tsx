"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CheckCircle,
  MessageSquare,
  Users,
  Package,
  LogOut,
  Menu,
  X,
  Mail,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
} from "lucide-react";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentEmployee } from "@/app/actions/employees";

const STORAGE_KEY = "admin-sidebar-collapsed";

type TabType = "dashboard" | "cases" | "tasks" | "correspondences" | "handover" | "employees";

interface AdminShellProps {
  children: React.ReactNode;
  /** When provided, sidebar uses tab mode (dashboard). Otherwise uses link mode (inventory). */
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function AdminShell({ children, activeTab, setActiveTab }: AdminShellProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isDashboard = pathname.startsWith("/admin/dashboard");
  const isInventory = pathname.startsWith("/admin/inventory");

  useEffect(() => {
    setSidebarCollapsed(getInitialCollapsed());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    getCurrentEmployee().then((emp) => setCurrentUser(emp?.display_name ?? null));
  }, []);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleCollapsed = () => setSidebarCollapsed((c) => !c);

  const handleLogout = () => {
    logoutAction();
  };

  const isCollapsed = sidebarCollapsed;

  const navItem = (
    icon: React.ReactNode,
    label: string,
    tab: TabType,
    href: string
  ) => {
    const baseClass = `flex items-center gap-3 rounded-xl transition w-full ${
      isCollapsed ? "justify-center p-2" : "text-left px-4 py-3"
    } ${
      (isDashboard && activeTab === tab) || (!isDashboard && pathname === href)
        ? "bg-mw-green-light shadow-md"
        : "hover:bg-mw-green-light/50"
    }`;
    if (isDashboard && setActiveTab && activeTab !== undefined) {
      return (
        <button
          onClick={() => {
            setActiveTab(tab);
            closeSidebar();
          }}
          className={baseClass}
          title={isCollapsed ? label : undefined}
        >
          {icon}
          {!isCollapsed && label}
        </button>
      );
    }
    return (
      <Link
        href={href}
        onClick={closeSidebar}
        className={baseClass}
        title={isCollapsed ? label : undefined}
      >
        {icon}
        {!isCollapsed && label}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div
        className={`border-b border-mw-green-dark flex justify-between items-center bg-mw-green shrink-0 ${
          isCollapsed ? "p-3 flex-col gap-2" : "p-6 flex-row"
        }`}
      >
        <div className={`flex items-center gap-2 ${isCollapsed ? "flex-col" : "flex-1 min-w-0"}`}>
          {!isCollapsed && (
            <>
              <div>
                <h2 className="font-serif text-xl">liebevoll bestatten</h2>
                <p className="text-xs text-stone-400">
                  {currentUser ? `Eingeloggt als ${currentUser}` : "Team Workspace"}
                </p>
              </div>
            </>
          )}
          {isCollapsed && (
            <span className="font-serif text-lg" title="liebevoll bestatten">
              lb
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 ${isCollapsed ? "flex-col" : ""}`}>
          {!isCollapsed && <NotificationBell align="left" />}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex p-2 -m-2 rounded-lg hover:bg-white/10 transition"
            aria-label={isCollapsed ? "Sidebar einblenden" : "Sidebar ausblenden"}
            title={isCollapsed ? "Sidebar einblenden" : "Sidebar ausblenden"}
          >
            {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <button
            onClick={closeSidebar}
            className="md:hidden p-2 -m-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Menü schließen"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div
        className={`flex-1 py-6 flex flex-col ${
          isCollapsed ? "px-3 space-y-1 items-center" : "px-4 space-y-2"
        }`}
      >
        {navItem(
          <LayoutDashboard size={18} className="shrink-0" />,
          "Dashboard",
          "dashboard",
          "/admin/dashboard"
        )}
        {navItem(
          <Briefcase size={18} className="shrink-0" />,
          "Sterbefälle",
          "cases",
          "/admin/dashboard"
        )}
        {navItem(
          <CheckCircle size={18} className="shrink-0" />,
          "Aufgaben & Termine",
          "tasks",
          "/admin/dashboard"
        )}
        {navItem(
          <Mail size={18} className="shrink-0" />,
          "Korrespondenzen",
          "correspondences",
          "/admin/dashboard"
        )}
        {navItem(
          <MessageSquare size={18} className="shrink-0" />,
          "Messenger",
          "handover",
          "/admin/dashboard"
        )}
        {navItem(
          <Users size={18} className="shrink-0" />,
          "HR / Personal",
          "employees",
          "/admin/dashboard"
        )}
        <Link
          href="/admin/inventory"
          onClick={closeSidebar}
          className={`flex items-center gap-3 rounded-xl transition ${
            isCollapsed ? "justify-center p-2" : "px-4 py-3"
          } ${
            isInventory ? "bg-mw-green-light shadow-md" : "hover:bg-mw-green-light/50"
          }`}
          title={isCollapsed ? "Lager" : undefined}
        >
          <Package size={18} className="shrink-0" />
          {!isCollapsed && "Lager"}
        </Link>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 text-gray-400 hover:text-white mt-auto transition rounded-xl ${
            isCollapsed ? "justify-center p-2" : "px-4 py-3"
          }`}
          title={isCollapsed ? "Abmelden" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && "Abmelden"}
        </button>
      </div>
    </>
  );

  const showTopBarOnDesktop = isCollapsed;

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
          bg-mw-green text-white flex flex-col shrink-0 shadow-xl
          transform transition-all duration-300 ease-out
          md:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "w-16" : "w-64 max-w-[85vw] md:w-64"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top bar: mobile always, desktop when sidebar collapsed */}
        <div
          className={`flex items-center justify-between gap-2 p-4 bg-white border-b border-gray-200 shrink-0 ${
            showTopBarOnDesktop ? "" : "md:hidden"
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="md:hidden p-2 -m-2 rounded-lg hover:bg-gray-100 transition"
              aria-label={sidebarOpen ? "Menü schließen" : "Menü öffnen"}
            >
              <Menu size={24} className="text-gray-700" />
            </button>
            <button
              onClick={toggleCollapsed}
              className="hidden md:flex p-2 -m-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Sidebar einblenden"
            >
              <Menu size={24} className="text-gray-700" />
            </button>
            <span className="font-serif text-lg text-gray-800">minten & walter</span>
          </div>
          <NotificationBell variant="light" align="right" />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
