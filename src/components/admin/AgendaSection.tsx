"use client";

import { CalendarDays, Plus, Pencil, Trash2, X } from "lucide-react";
import type { Appointment } from "@/types";
import type { CaseListItem } from "@/app/actions/cases";

const REMINDER_OPTIONS = [
  { value: "", label: "Keine Erinnerung" },
  { value: "15", label: "15 Min vorher" },
  { value: "60", label: "1 Std vorher" },
  { value: "1440", label: "1 Tag vorher" },
  { value: "4320", label: "3 Tage vorher" },
] as const;

export type ReminderMinutes = "" | "15" | "60" | "1440" | "4320";

export function computeReminderAt(
  dateIso: string,
  reminderMinutes: ReminderMinutes
): string | null {
  if (!reminderMinutes || !dateIso) return null;
  const mins = parseInt(reminderMinutes, 10);
  if (isNaN(mins)) return null;
  const d = new Date(dateIso);
  d.setMinutes(d.getMinutes() - mins);
  return d.toISOString();
}

interface AgendaSectionProps {
  appointments: Appointment[];
  cases: CaseListItem[];
  employees: { id: string; display_name: string }[];
  newApptTitle: string;
  newApptDate: string;
  newApptEndDate: string;
  newApptCaseId: string | null;
  newApptAssigneeId: string | null;
  newApptReminder: ReminderMinutes;
  editingApptId: string | null;
  editApptTitle: string;
  editApptDate: string;
  editApptEndDate: string;
  editApptCaseId: string | null;
  editApptAssigneeId: string | null;
  editApptReminder: ReminderMinutes;
  onNewApptTitleChange: (v: string) => void;
  onNewApptDateChange: (v: string) => void;
  onNewApptEndDateChange: (v: string) => void;
  onNewApptCaseIdChange: (v: string | null) => void;
  onNewApptAssigneeIdChange: (v: string | null) => void;
  onNewApptReminderChange: (v: ReminderMinutes) => void;
  onEditApptTitleChange: (v: string) => void;
  onEditApptDateChange: (v: string) => void;
  onEditApptEndDateChange: (v: string) => void;
  onEditApptCaseIdChange: (v: string | null) => void;
  onEditApptAssigneeIdChange: (v: string | null) => void;
  onEditApptReminderChange: (v: ReminderMinutes) => void;
  onAddAppointment: (e: React.FormEvent) => void;
  onUpdateAppointment: (e: React.FormEvent) => void;
  onStartEdit: (appt: Appointment) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  getCaseDisplayLabel: (caseId: string) => string | null;
}

export function AgendaSection({
  appointments,
  cases,
  employees,
  newApptTitle,
  newApptDate,
  newApptEndDate,
  newApptCaseId,
  newApptAssigneeId,
  newApptReminder,
  editingApptId,
  editApptTitle,
  editApptDate,
  editApptEndDate,
  editApptCaseId,
  editApptAssigneeId,
  editApptReminder,
  onNewApptTitleChange,
  onNewApptDateChange,
  onNewApptEndDateChange,
  onNewApptCaseIdChange,
  onNewApptAssigneeIdChange,
  onNewApptReminderChange,
  onEditApptTitleChange,
  onEditApptDateChange,
  onEditApptEndDateChange,
  onEditApptCaseIdChange,
  onEditApptAssigneeIdChange,
  onEditApptReminderChange,
  onAddAppointment,
  onUpdateAppointment,
  onStartEdit,
  onCancelEdit,
  onDelete,
  getCaseDisplayLabel,
}: AgendaSectionProps) {
  return (
    <div className="h-full min-h-0 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-serif text-mw-green flex items-center gap-2 mb-4">
          <CalendarDays size={20} /> Agenda
        </h3>
        <form onSubmit={onAddAppointment} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Neuer Termin..."
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
            value={newApptTitle}
            onChange={(e) => onNewApptTitleChange(e.target.value)}
            required
          />
          <select
            value={newApptCaseId ?? ""}
            onChange={(e) => onNewApptCaseIdChange(e.target.value || null)}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          >
            <option value="">Fall (optional)</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={newApptAssigneeId ?? ""}
            onChange={(e) => onNewApptAssigneeIdChange(e.target.value || null)}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          >
            <option value="">An... (Unternehmen)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.display_name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              value={newApptDate}
              onChange={(e) => onNewApptDateChange(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              placeholder="Ende (optional)"
              className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              value={newApptEndDate}
              onChange={(e) => onNewApptEndDateChange(e.target.value)}
            />
            <button type="submit" className="bg-mw-green text-white p-2.5 rounded-xl transition hover:bg-mw-green-dark">
              <Plus size={18} />
            </button>
          </div>
          <select
            value={newApptReminder}
            onChange={(e) => onNewApptReminderChange(e.target.value as ReminderMinutes)}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          >
            {REMINDER_OPTIONS.map((o) => (
              <option key={o.value || "none"} value={o.value}>{o.label}</option>
            ))}
          </select>
        </form>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {appointments.length === 0 ? (
          <p className="text-sm text-center text-gray-400 mt-8 italic">Keine anstehenden Termine.</p>
        ) : (
          appointments.map((appt) => (
            <div key={appt.id} className="p-3 rounded-xl border bg-white">
              {editingApptId === appt.id ? (
                <form onSubmit={onUpdateAppointment} className="flex flex-col gap-2">
                  <input
                    type="text"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
                    value={editApptTitle}
                    onChange={(e) => onEditApptTitleChange(e.target.value)}
                    required
                  />
                  <select
                    value={editApptCaseId ?? ""}
                    onChange={(e) => onEditApptCaseIdChange(e.target.value || null)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="">Fall (optional)</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={editApptAssigneeId ?? ""}
                    onChange={(e) => onEditApptAssigneeIdChange(e.target.value || null)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="">An... (Unternehmen)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.display_name}</option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={editApptDate}
                    onChange={(e) => onEditApptDateChange(e.target.value)}
                    required
                  />
                  <input
                    type="datetime-local"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={editApptEndDate}
                    onChange={(e) => onEditApptEndDateChange(e.target.value)}
                    placeholder="Ende (optional)"
                  />
                  <select
                    value={editApptReminder}
                    onChange={(e) => onEditApptReminderChange(e.target.value as ReminderMinutes)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  >
                    {REMINDER_OPTIONS.map((o) => (
                      <option key={o.value || "none"} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-mw-green text-white p-2 rounded-xl text-sm font-medium hover:bg-mw-green-dark">
                      Speichern
                    </button>
                    <button type="button" onClick={onCancelEdit} className="p-2 text-gray-500 hover:text-gray-700 rounded-xl border border-gray-200">
                      <X size={16} />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center group">
                  <div>
                    <div className="text-xs font-bold text-mw-green-light mb-1">
                      {new Date(appt.date).toLocaleDateString("de-DE")} - {new Date(appt.date).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                      {appt.endAt && (
                        <> – {new Date(appt.endAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</>
                      )}
                    </div>
                    <h5 className="font-medium text-sm">{appt.title}</h5>
                    {appt.caseId && getCaseDisplayLabel(appt.caseId) && (
                      <span className="text-[10px] text-gray-500 mt-0.5 block">{getCaseDisplayLabel(appt.caseId)}</span>
                    )}
                    {appt.assignee && appt.assignee !== "Alle" && (
                      <span className="text-[10px] text-gray-500 mt-0.5 block">An: {appt.assignee}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onStartEdit(appt)}
                      className="p-1.5 text-gray-300 hover:text-mw-green opacity-0 group-hover:opacity-100 transition"
                      title="Bearbeiten"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(appt.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      title="Löschen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
