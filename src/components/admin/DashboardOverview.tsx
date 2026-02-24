"use client";

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
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { DashboardOverviewData } from "@/app/actions/dashboard";

type TabType =
  | "cases"
  | "tasks"
  | "correspondences"
  | "handover";

interface DashboardOverviewProps {
  data: DashboardOverviewData;
  onNavigate?: (tab: TabType) => void;
}

export function DashboardOverview({ data, onNavigate }: DashboardOverviewProps) {
  const {
    displayName,
    totalHours,
    isClockedIn,
    clockedInSince,
    myTasksCount,
    todayAppointments,
  } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Willkommen{displayName ? `, ${displayName}` : ""}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {totalHours != null ? (
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
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-100 border border-gray-200 animate-pulse">
              <div className="w-6 h-6 rounded bg-gray-300" />
              <div className="flex-1 space-y-2">
                <div className="h-7 w-16 bg-gray-300 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          )}
          {isClockedIn && clockedInSince && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <Clock className="text-amber-600 shrink-0" size={24} />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Eingestempelt
                </p>
                <p className="text-xs text-amber-600">
                  seit {format(new Date(clockedInSince), "HH:mm", { locale: de })}{" "}
                  Uhr
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <CheckCircle className="text-gray-500 shrink-0" size={24} />
            <div>
              <p className="text-2xl font-semibold text-gray-800">
                {myTasksCount}
              </p>
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
              <ChevronRight
                className="text-gray-400 group-hover:text-mw-green"
                size={20}
              />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-mw-green/30 transition group text-left w-full"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="text-mw-green shrink-0" size={20} />
                <span className="font-medium text-gray-800">
                  Aufgaben & Termine
                </span>
              </div>
              <ChevronRight
                className="text-gray-400 group-hover:text-mw-green"
                size={20}
              />
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
              <ChevronRight
                className="text-gray-400 group-hover:text-mw-green"
                size={20}
              />
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-mw-green/30 transition group"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="text-mw-green shrink-0" size={20} />
                <span className="font-medium text-gray-800">
                  Aufgaben & Termine
                </span>
              </div>
              <ChevronRight
                className="text-gray-400 group-hover:text-mw-green"
                size={20}
              />
            </Link>
          </>
        )}
        <Link
          href="/admin/leistungen/lager"
          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-mw-green/30 transition group"
        >
          <div className="flex items-center gap-3">
            <Package className="text-mw-green shrink-0" size={20} />
            <span className="font-medium text-gray-800">Lager</span>
          </div>
          <ChevronRight
            className="text-gray-400 group-hover:text-mw-green"
            size={20}
          />
        </Link>
      </div>
    </div>
  );
}
