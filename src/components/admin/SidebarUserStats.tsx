"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import { getCurrentEmployee } from "@/app/actions/employees";
import { getTotalHoursForEmployee } from "@/app/actions/time-entries";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface SidebarUserStatsProps {
  collapsed?: boolean;
  /** "light" für hellen Hintergrund (Dashboard), "dark" für Sidebar */
  variant?: "light" | "dark";
}

export function SidebarUserStats({ collapsed = false, variant = "dark" }: SidebarUserStatsProps) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [totalHours, setTotalHours] = useState<number | null>(null);

  const load = useCallback(async () => {
    const emp = await getCurrentEmployee();
    setDisplayName(emp?.display_name ?? null);
    if (emp) {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date();
      const hours = await getTotalHoursForEmployee(emp.id, from, to);
      setTotalHours(hours);
    } else {
      setTotalHours(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable({ table: "employee_time_entries" }, load);

  const isLight = variant === "light";
  const nameClass = isLight ? "text-gray-500" : "text-stone-400";
  const hoursClass = isLight ? "text-gray-600" : "text-stone-300";

  if (collapsed) {
    return (
      <div
        className="flex items-center justify-center p-2 rounded-xl"
        title={
          totalHours != null
            ? `${format(new Date(), "MMMM yyyy", { locale: de })}: ${totalHours.toFixed(1)} h`
            : undefined
        }
      >
        {totalHours != null && (
          <span className={`text-xs font-medium ${hoursClass}`}>
            {totalHours.toFixed(1)} h
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {displayName && (
        <p className={`text-[10px] ${nameClass} truncate`} title={displayName}>
          {displayName}
        </p>
      )}
      {totalHours != null && (
        <div className={`flex items-center gap-2 text-xs ${hoursClass}`}>
          <Clock size={12} />
          <span>
            {totalHours.toFixed(1)} h {format(new Date(), "MMM", { locale: de })}
          </span>
        </div>
      )}
    </div>
  );
}
