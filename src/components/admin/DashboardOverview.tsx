"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle,
  Clock,
  Package,
  ChevronRight,
} from "lucide-react";
import { TimeClockWidget } from "@/components/admin/TimeClockWidget";
import { SidebarUserStats } from "@/components/admin/SidebarUserStats";
import { getCurrentEmployee } from "@/app/actions/employees";
import { getTotalHoursForEmployee, getCurrentSession } from "@/app/actions/time-entries";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type TabType = "cases" | "tasks" | "correspondences" | "handover" | "employees";

interface DashboardOverviewProps {
  onNavigate?: (tab: TabType) => void;
}

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [totalHours, setTotalHours] = useState<number | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockedInSince, setClockedInSince] = useState<string | null>(null);
  const [myTasksCount, setMyTasksCount] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);

  useEffect(() => {
    const load = async () => {
      const emp = await getCurrentEmployee();
      setDisplayName(emp?.display_name ?? null);
      setEmployeeId(emp?.id ?? null);

      if (emp) {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date();
        const hours = await getTotalHoursForEmployee(emp.id, from, to);
        setTotalHours(hours);

        const session = await getCurrentSession(emp.id);
        setIsClockedIn(!!session);
        setClockedInSince(session?.recordedAt ?? null);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!employeeId) return;

    const fetchMyStats = async () => {
      const { count: taskCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("assignee_id", employeeId)
        .eq("completed", false);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count: apptCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_date", today.toISOString())
        .lt("appointment_date", tomorrow.toISOString());

      setMyTasksCount(taskCount ?? 0);
      setTodayAppointments(apptCount ?? 0);
    };

    fetchMyStats();
  }, [employeeId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Willkommen{displayName ? `, ${displayName}` : ""}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {totalHours != null && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-mw-green/5 border border-mw-green/20">
              <Clock className="text-mw-green shrink-0" size={24} />
              <div>
                <p className="text-2xl font-semibold text-gray-800">
                  {totalHours.toFixed(1)} h
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(), "MMMM yyyy", { locale: de })}
                </p>
              </div>
            </div>
          )}
          {isClockedIn && clockedInSince && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <Clock className="text-amber-600 shrink-0" size={24} />
              <div>
                <p className="text-sm font-medium text-amber-800">Eingestempelt</p>
                <p className="text-xs text-amber-600">
                  seit {format(new Date(clockedInSince), "HH:mm", { locale: de })} Uhr
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <CheckCircle className="text-gray-500 shrink-0" size={24} />
            <div>
              <p className="text-2xl font-semibold text-gray-800">{myTasksCount}</p>
              <p className="text-xs text-gray-500">Offene Aufgaben</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <Briefcase className="text-gray-500 shrink-0" size={24} />
            <div>
              <p className="text-2xl font-semibold text-gray-800">
                {todayAppointments}
              </p>
              <p className="text-xs text-gray-500">Termine heute</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TimeClockWidget collapsed={false} variant="light" />
          <SidebarUserStats collapsed={false} variant="light" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {onNavigate ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate("cases")}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-mw-green/30 transition group text-left w-full"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="text-mw-green shrink-0" size={20} />
                <span className="font-medium text-gray-800">Sterbefälle</span>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-mw-green" size={20} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-mw-green/30 transition group text-left w-full"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="text-mw-green shrink-0" size={20} />
                <span className="font-medium text-gray-800">Aufgaben & Termine</span>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-mw-green" size={20} />
            </button>
          </>
        ) : (
          <>
            <Link
              href="/admin/dashboard"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-mw-green/30 transition group"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="text-mw-green shrink-0" size={20} />
                <span className="font-medium text-gray-800">Sterbefälle</span>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-mw-green" size={20} />
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-mw-green/30 transition group"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="text-mw-green shrink-0" size={20} />
                <span className="font-medium text-gray-800">Aufgaben & Termine</span>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-mw-green" size={20} />
            </Link>
          </>
        )}
        <Link
          href="/admin/inventory"
          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-mw-green/30 transition group"
        >
          <div className="flex items-center gap-3">
            <Package className="text-mw-green shrink-0" size={20} />
            <span className="font-medium text-gray-800">Lager</span>
          </div>
          <ChevronRight className="text-gray-400 group-hover:text-mw-green" size={20} />
        </Link>
      </div>
    </div>
  );
}
