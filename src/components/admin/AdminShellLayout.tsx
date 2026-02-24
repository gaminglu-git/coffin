"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type TabType = "dashboard" | "cases" | "tasks" | "correspondences" | "handover";

const AdminTabContext = createContext<{
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
} | null>(null);

export function useAdminTab() {
  const ctx = useContext(AdminTabContext);
  return ctx;
}

export function AdminShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/admin/dashboard");
  const isLeistungen = pathname.startsWith("/admin/leistungen");
  const isUnternehmen = pathname.startsWith("/admin/unternehmen");
  const showShell = isDashboard || isLeistungen || isUnternehmen;

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  if (!showShell) {
    return <>{children}</>;
  }

  return (
    <AdminTabContext.Provider
      value={isDashboard ? { activeTab, setActiveTab } : null}
    >
      <AdminShell
        activeTab={isDashboard ? activeTab : undefined}
        setActiveTab={isDashboard ? setActiveTab : undefined}
      >
        {children}
      </AdminShell>
    </AdminTabContext.Provider>
  );
}
