"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Settings, MessageSquare, CheckCircle, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import {
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/app/actions/notifications";
import Link from "next/link";

type Notification = {
  id: string;
  employeeId: string;
  type: "handover" | "task_assigned" | "communication";
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  handover: "Übergabebuch",
  task_assigned: "Aufgabe",
  communication: "Kommunikation",
};

export function NotificationBell({
  variant = "dark",
  align = "right",
}: {
  variant?: "dark" | "light";
  /** "left" = dropdown opens to the right (for sidebar), "right" = dropdown opens to the left (for mobile) */
  align?: "left" | "right";
}) {
  const isLight = variant === "light";
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, employee_id, type, title, body, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("NotificationBell fetch error:", error);
      return;
    }

    const list = (data ?? []).map((r) => ({
      id: r.id,
      employeeId: r.employee_id,
      type: r.type as Notification["type"],
      title: r.title,
      body: r.body,
      link: r.link,
      readAt: r.read_at,
      createdAt: r.created_at,
    }));
    setNotifications(list);
    setUnreadCount(list.filter((n) => !n.readAt).length);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (prefsOpen) {
      getNotificationPreferences().then(setPrefs);
    }
  }, [prefsOpen]);

  useRealtimeTable({ table: "notifications" }, fetchNotifications, "notifications-bell");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-lg transition ${
          isLight ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
        }`}
        aria-label={`Benachrichtigungen${unreadCount > 0 ? ` (${unreadCount} ungelesen)` : ""}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 w-[min(20rem,calc(100vw-2rem))] max-h-[min(400px,60vh)] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-medium text-gray-800">Benachrichtigungen</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-mw-green hover:underline"
                >
                  Alle als gelesen
                </button>
              )}
              <button
                onClick={() => setPrefsOpen(true)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition"
                aria-label="Benachrichtigungen einstellen"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400 italic">
                Keine Benachrichtigungen.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.link ?? "/admin/dashboard"}
                      onClick={() => {
                        if (!n.readAt) handleMarkRead(n.id);
                        setOpen(false);
                      }}
                      className={`block p-4 hover:bg-gray-50 transition ${
                        !n.readAt ? "bg-mw-green/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase tracking-wide text-mw-green font-medium">
                            {TYPE_LABELS[n.type] ?? n.type}
                          </span>
                          <p className="font-medium text-sm text-gray-800 mt-0.5">
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {n.body}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleString("de-DE")}
                          </p>
                        </div>
                        {!n.readAt && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-mw-green mt-1.5" />
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <NotificationPreferencesModal
        open={prefsOpen}
        prefs={prefs}
        onSave={async (p) => {
          const res = await updateNotificationPreferences(p);
          if (!res.error) {
            setPrefs(p);
            setPrefsOpen(false);
          }
        }}
        onClose={() => setPrefsOpen(false)}
      />
    </div>
  );
}

const PREFERENCE_ITEMS: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "handover",
    label: "Übergabebuch",
    description: "Neue Notizen von Kollegen im Team-Übergabebuch",
    icon: <MessageSquare size={18} className="text-mw-green" />,
  },
  {
    key: "taskAssigned",
    label: "Aufgaben zugewiesen",
    description: "Wenn Ihnen eine Aufgabe zugewiesen wird",
    icon: <CheckCircle size={18} className="text-mw-green" />,
  },
  {
    key: "communication",
    label: "Kommunikation",
    description: "Neue E-Mails, Briefe oder Anrufe im System",
    icon: <Mail size={18} className="text-mw-green" />,
  },
];

function NotificationPreferencesModal({
  open,
  prefs,
  onSave,
  onClose,
}: {
  open: boolean;
  prefs: NotificationPreferences | null;
  onSave: (p: NotificationPreferences) => Promise<void>;
  onClose: () => void;
}) {
  const [handover, setHandover] = useState(true);
  const [taskAssigned, setTaskAssigned] = useState(true);
  const [communication, setCommunication] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefs) {
      setHandover(prefs.handover);
      setTaskAssigned(prefs.taskAssigned);
      setCommunication(prefs.communication);
    }
  }, [prefs, open]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ handover, taskAssigned, communication });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="w-[min(28rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] sm:max-w-md p-0 gap-0 overflow-hidden"
        showCloseButton={true}
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Benachrichtigungen
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            Wählen Sie, welche Benachrichtigungen Sie erhalten möchten.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {!prefs ? (
            <div className="py-8 text-center text-sm text-gray-500">Laden…</div>
          ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {PREFERENCE_ITEMS.map(({ key, label, description, icon }) => {
              const checked =
                key === "handover" ? handover : key === "taskAssigned" ? taskAssigned : communication;
              const setChecked =
                key === "handover"
                  ? setHandover
                  : key === "taskAssigned"
                    ? setTaskAssigned
                    : setCommunication;

              return (
                <label
                  key={key}
                  className="flex items-center gap-4 py-4 cursor-pointer min-h-14 first:pt-0 last:pb-0"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-mw-green/10 flex items-center justify-center">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 block">{label}</span>
                    <span className="text-sm text-gray-500 block mt-0.5">{description}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    onClick={() => setChecked(!checked)}
                    className={`shrink-0 relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mw-green focus:ring-offset-2 ${
                      checked ? "bg-mw-green" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        checked ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </label>
              );
            })}
          </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row p-6 pt-0 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !prefs}
            className="flex-1 sm:flex-none bg-mw-green text-white px-6 py-2.5 rounded-xl hover:bg-mw-green-dark transition font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Speichern…" : "Speichern"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
