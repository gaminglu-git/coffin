"use client";

import { useState, useEffect } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";
import { ensureCurrentEmployee } from "@/app/actions/employees";
import { getCurrentSession, clockIn, clockOut } from "@/app/actions/time-entries";
import type { Employee } from "@/app/actions/employees";
import type { TimeEntryEvent } from "@/app/actions/time-entries";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PendingAction = "clock_in" | "clock_out" | null;

interface TimeClockWidgetProps {
  collapsed?: boolean;
  /** "light" für hellen Hintergrund (Dashboard), "dark" für Sidebar */
  variant?: "light" | "dark";
}

export function TimeClockWidget({ collapsed = false, variant = "dark" }: TimeClockWidgetProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentSession, setCurrentSession] = useState<TimeEntryEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const refresh = async () => {
    const emp = await ensureCurrentEmployee();
    setEmployee(emp ?? null);
    if (emp) {
      const session = await getCurrentSession(emp.id);
      setCurrentSession(session);
    } else {
      setCurrentSession(null);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openConfirm = (action: "clock_in" | "clock_out") => {
    setPendingAction(action);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setPendingAction(null);
  };

  const handleConfirm = async () => {
    if (!employee || !pendingAction) return;
    setLoading(true);
    setError("");
    closeConfirm();
    const result =
      pendingAction === "clock_in"
        ? await clockIn(employee.id)
        : await clockOut(employee.id);
    if (result.error) setError(result.error);
    else await refresh();
    setLoading(false);
  };

  const handleClockIn = () => {
    if (!employee) return;
    openConfirm("clock_in");
  };

  const handleClockOut = () => {
    if (!employee) return;
    openConfirm("clock_out");
  };

  if (collapsed) {
    const handleClick = () => {
      if (employee) (currentSession ? handleClockOut : handleClockIn)();
    };
    return (
      <>
        <button
          onClick={handleClick}
          disabled={!employee || loading}
          className="flex items-center justify-center p-2 rounded-xl hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed w-full"
          title={
            !employee
              ? "Zeiterfassung – nur für Mitarbeiter"
              : currentSession
                ? `Eingestempelt seit ${format(new Date(currentSession.recordedAt), "HH:mm", { locale: de })} – Arbeitsschluss`
                : "Arbeitsbeginn"
          }
        >
          <Clock size={18} className="shrink-0" />
        </button>
        <Dialog open={confirmOpen} onOpenChange={(open) => !open && closeConfirm()}>
          <DialogContent showCloseButton={false} className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">
                {pendingAction === "clock_in"
                  ? "Arbeitsbeginn erfassen?"
                  : "Arbeitsschluss erfassen?"}
              </DialogTitle>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2 sm:justify-end pt-4">
              <Button variant="outline" onClick={closeConfirm} size="sm">
                Abbrechen
              </Button>
              <Button onClick={handleConfirm} size="sm" disabled={loading}>
                Bestätigen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const isLight = variant === "light";
  const labelClass = isLight ? "text-gray-500" : "text-stone-400";
  const hintClass = isLight ? "text-gray-400" : "text-stone-500";
  const clockInBtnClass = isLight
    ? "bg-mw-green hover:bg-mw-green-dark text-white"
    : "bg-white/15 hover:bg-white/25 text-white";

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex items-center gap-2 text-xs ${labelClass}`}>
        <Clock size={12} />
        <span>Zeiterfassung</span>
      </div>
      {!employee ? (
        <p className={`text-[10px] ${hintClass} italic`}>
          Nur für Mitarbeiter verfügbar.
        </p>
      ) : (
        <>
      {error && (
        <p className="text-[10px] text-red-500">{error}</p>
      )}
      <div className="flex gap-2">
        {currentSession ? (
          <button
            onClick={handleClockOut}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
              isLight ? "bg-red-100 hover:bg-red-200 text-red-800" : "bg-red-500/20 hover:bg-red-500/30 text-white"
            }`}
          >
            <LogOut size={14} /> Arbeitsschluss
          </button>
        ) : (
          <button
            onClick={handleClockIn}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${clockInBtnClass} text-sm font-medium transition disabled:opacity-50`}
          >
            <LogIn size={14} /> Arbeitsbeginn
          </button>
        )}
      </div>
      {currentSession && (
        <p className={`text-[10px] ${labelClass}`}>
          Eingestempelt seit {format(new Date(currentSession.recordedAt), "HH:mm", { locale: de })} Uhr
        </p>
      )}
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={(open) => !open && closeConfirm()}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {pendingAction === "clock_in"
                ? "Arbeitsbeginn erfassen?"
                : "Arbeitsschluss erfassen?"}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end pt-4">
            <Button variant="outline" onClick={closeConfirm} size="sm">
              Abbrechen
            </Button>
            <Button onClick={handleConfirm} size="sm" disabled={loading}>
              Bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
