"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { View, SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronRight, Pencil, Trash2, Plus } from "lucide-react";
import type { Appointment, Task } from "@/types";
import type { EventInstance } from "@/app/actions/events";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { computeReminderAt, type ReminderMinutes } from "./AgendaSection";
import "react-big-calendar/lib/css/react-big-calendar.css";

const REMINDER_OPTIONS: { value: ReminderMinutes; label: string }[] = [
    { value: "", label: "Keine Erinnerung" },
    { value: "15", label: "15 Min vorher" },
    { value: "60", label: "1 Std vorher" },
    { value: "1440", label: "1 Tag vorher" },
    { value: "4320", label: "3 Tage vorher" },
];

function toDateTimeLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const locales = { "de-DE": de };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

export type CalendarEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource?: {
        type: "appointment" | "task" | "time_entry" | "event";
        completed?: boolean;
        caseId?: string | null;
        displayTitle: string;
        appointmentId?: string;
        taskId?: string;
        employeeId?: string;
        employeeName?: string;
        eventId?: string;
    };
};

export type TimeEntryEvent = {
    id: string;
    employeeId: string;
    eventType: "clock_in" | "clock_out";
    recordedAt: string;
    source: string;
    notes?: string | null;
};

export type CreateAppointmentData = {
    title: string;
    start: string;
    end?: string | null;
    caseId?: string | null;
    assigneeId?: string | null;
    reminderAt?: string | null;
};

interface CalendarViewProps {
    appointments: Appointment[];
    tasks: Task[];
    companyEvents?: EventInstance[];
    timeEntries?: TimeEntryEvent[];
    employees?: { id: string; display_name: string }[];
    showTimeEntries?: boolean;
    cases?: { id: string; name: string; contact?: { firstName?: string; lastName?: string } }[];
    onOpenCase?: (caseId: string) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onEditTask?: (task: Task) => void;
    onEditEvent?: (instance: EventInstance) => void;
    onDeleteAppointment?: (id: string) => void;
    onDeleteTask?: (id: string) => void;
    onCreateAppointment?: (data: CreateAppointmentData) => Promise<void>;
    getCaseDisplayLabel?: (caseId: string | null | undefined) => string | null;
}

const messages = {
    date: "Datum",
    time: "Zeit",
    event: "Eintrag",
    allDay: "Ganztägig",
    week: "Woche",
    work_week: "Arbeitswoche",
    day: "Tag",
    month: "Monat",
    previous: "Zurück",
    next: "Weiter",
    yesterday: "Gestern",
    tomorrow: "Morgen",
    today: "Heute",
    agenda: "Agenda",
    noEventsInRange: "Keine Einträge in diesem Zeitraum.",
    showMore: (total: number) => `+${total} weitere`,
};

const MOBILE_BREAKPOINT = 640;

function timeEntriesToEvents(
    entries: TimeEntryEvent[],
    employees: { id: string; display_name: string }[]
): CalendarEvent[] {
    const result: CalendarEvent[] = [];
    const byEmployee = new Map<string, TimeEntryEvent[]>();
    for (const e of entries) {
        if (!byEmployee.has(e.employeeId)) byEmployee.set(e.employeeId, []);
        byEmployee.get(e.employeeId)!.push(e);
    }
    for (const [empId, evts] of byEmployee) {
        const emp = employees.find((x) => x.id === empId);
        const name = emp?.display_name ?? "Unbekannt";
        evts.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
        const stack: TimeEntryEvent[] = [];
        for (const evt of evts) {
            if (evt.eventType === "clock_in") {
                stack.push(evt);
            } else {
                const inEvt = stack.pop();
                if (inEvt) {
                    const start = new Date(inEvt.recordedAt);
                    const end = new Date(evt.recordedAt);
                    result.push({
                        id: `time-${inEvt.id}`,
                        title: `🕐 ${name}`,
                        start,
                        end,
                        resource: {
                            type: "time_entry",
                            displayTitle: `Arbeitszeit ${name}`,
                            employeeId: empId,
                            employeeName: name,
                        },
                    });
                }
            }
        }
        for (const inEvt of stack) {
            const start = new Date(inEvt.recordedAt);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            result.push({
                id: `time-${inEvt.id}`,
                title: `🕐 ${name} (läuft)`,
                start,
                end,
                resource: {
                    type: "time_entry",
                    displayTitle: `Arbeitszeit ${name} (noch eingestempelt)`,
                    employeeId: empId,
                    employeeName: name,
                },
            });
        }
    }
    return result;
}

export function CalendarView({
    appointments,
    tasks,
    companyEvents = [],
    timeEntries = [],
    employees = [],
    showTimeEntries = true,
    cases = [],
    onOpenCase,
    onEditAppointment,
    onEditTask,
    onDeleteAppointment,
    onDeleteTask,
    onCreateAppointment,
    getCaseDisplayLabel,
}: CalendarViewProps) {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [slotFormOpen, setSlotFormOpen] = useState(false);
    const [slotFormSlot, setSlotFormSlot] = useState<SlotInfo | null>(null);
    const [slotFormTitle, setSlotFormTitle] = useState("");
    const [slotFormCaseId, setSlotFormCaseId] = useState<string | null>(null);
    const [slotFormAssigneeId, setSlotFormAssigneeId] = useState<string | null>(null);
    const [slotFormReminder, setSlotFormReminder] = useState<ReminderMinutes>("");
    const [slotFormStart, setSlotFormStart] = useState("");
    const [slotFormEnd, setSlotFormEnd] = useState("");
    const [slotFormSubmitting, setSlotFormSubmitting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [date, setDate] = useState(() => new Date());
    const [view, setView] = useState<View>("week");

    useEffect(() => {
        const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        setView(isMobile ? "agenda" : "week");
    }, [isMobile]);

    const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
        if (view === "month" && (slotInfo.action === "click" || slotInfo.action === "doubleClick")) {
            setView("day");
            setDate(slotInfo.start);
        }
        if (onCreateAppointment) {
            const end = slotInfo.end ?? new Date(slotInfo.start.getTime() + 30 * 60 * 1000);
            setSlotFormSlot(slotInfo);
            setSlotFormTitle("");
            setSlotFormCaseId(null);
            setSlotFormAssigneeId(null);
            setSlotFormReminder("");
            setSlotFormStart(toDateTimeLocal(slotInfo.start));
            setSlotFormEnd(toDateTimeLocal(end));
            setSlotFormOpen(true);
        }
    }, [view, onCreateAppointment]);

    const handleSlotFormSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onCreateAppointment || !slotFormTitle || !slotFormStart) return;
        const startStr = new Date(slotFormStart).toISOString();
        const endStr = slotFormEnd ? new Date(slotFormEnd).toISOString() : null;
        setSlotFormSubmitting(true);
        try {
            await onCreateAppointment({
                title: slotFormTitle,
                start: startStr,
                end: endStr,
                caseId: slotFormCaseId || null,
                assigneeId: slotFormAssigneeId || null,
                reminderAt: computeReminderAt(startStr, slotFormReminder),
            });
            setSlotFormOpen(false);
            setSlotFormSlot(null);
        } finally {
            setSlotFormSubmitting(false);
        }
    }, [onCreateAppointment, slotFormTitle, slotFormStart, slotFormEnd, slotFormCaseId, slotFormAssigneeId, slotFormReminder]);

    const events: CalendarEvent[] = useMemo(() => {
        const result: CalendarEvent[] = [];

        if (showTimeEntries && timeEntries.length > 0) {
            result.push(...timeEntriesToEvents(timeEntries, employees));
        }

        appointments.forEach((a) => {
            const start = new Date(a.date);
            const end = a.endAt ? new Date(a.endAt) : new Date(start.getTime() + 30 * 60 * 1000);
            result.push({
                id: `appt-${a.id}`,
                title: a.title,
                start,
                end,
                resource: { type: "appointment", caseId: a.caseId ?? null, displayTitle: a.title, appointmentId: a.id },
            });
        });

        companyEvents.forEach((ev) => {
            result.push({
                id: `event-${ev.eventId}-${ev.startAt}`,
                title: ev.event.name,
                start: new Date(ev.startAt),
                end: new Date(ev.endAt),
                resource: {
                    type: "event",
                    displayTitle: ev.event.name,
                    eventId: ev.event.id,
                },
            });
        });

        tasks
            .filter((t) => t.dueDate && !t.completed)
            .forEach((t) => {
                const d = new Date(t.dueDate!);
                d.setHours(9, 0, 0, 0);
                const end = new Date(d);
                end.setHours(10, 0, 0, 0);
                result.push({
                    id: `task-${t.id}`,
                    title: `📋 ${t.title}`,
                    start: d,
                    end,
                    resource: { type: "task", completed: t.completed, caseId: t.caseId ?? null, displayTitle: t.title, taskId: t.id },
                });
            });

        tasks
            .filter((t) => t.dueDate && t.completed)
            .forEach((t) => {
                const d = new Date(t.dueDate!);
                d.setHours(14, 0, 0, 0);
                const end = new Date(d);
                end.setMinutes(end.getMinutes() + 30);
                result.push({
                    id: `task-done-${t.id}`,
                    title: `✓ ${t.title}`,
                    start: d,
                    end,
                    resource: { type: "task", completed: true, caseId: t.caseId ?? null, displayTitle: t.title, taskId: t.id },
                });
            });

        return result.sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [appointments, tasks, companyEvents, timeEntries, employees, showTimeEntries]);

    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        const type = event.resource?.type;
        const isTask = type === "task";
        const isCompleted = event.resource?.completed;
        const isTimeEntry = type === "time_entry";
        const isEvent = type === "event";
        return {
            style: {
                backgroundColor: isTimeEntry
                    ? "rgba(99, 102, 241, 0.14)"
                    : isEvent
                        ? "rgba(139, 92, 246, 0.14)"
                        : isTask
                            ? isCompleted
                                ? "rgba(34, 197, 94, 0.14)"
                                : "rgba(245, 158, 11, 0.14)"
                            : "rgba(74, 85, 78, 0.14)",
                color: isTimeEntry
                    ? "#4338ca"
                    : isEvent
                        ? "#6d28d9"
                        : isTask
                            ? isCompleted
                                ? "#15803d"
                                : "#b45309"
                            : "var(--color-mw-green-dark)",
                borderRadius: "12px",
                border: "none",
            },
        };
    }, []);

    const getCaseName = (caseId: string | null | undefined) =>
        caseId ? cases.find((c) => c.id === caseId)?.name ?? null : null;

    const getDisplayLabel = (caseId: string | null | undefined) =>
        getCaseDisplayLabel?.(caseId) ?? getCaseName(caseId);

    return (
        <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500 px-1">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-mw-green" /> Termin
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-violet-500" /> Veranstaltung
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500" /> Aufgabe (offen)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-green-500" /> Aufgabe (erledigt)
                </span>
                {showTimeEntries && (
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-indigo-500" /> Arbeitszeiten
                    </span>
                )}
            </div>
            <div className="h-[calc(80vh-2rem)] min-h-[320px] sm:min-h-[400px] bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-2 sm:p-4 rbc-calendar-mobile">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                messages={messages}
                culture="de-DE"
                eventPropGetter={eventStyleGetter}
                views={isMobile ? ["day", "agenda"] : ["month", "week", "day", "agenda"]}
                date={date}
                view={view}
                onNavigate={(newDate) => setDate(newDate)}
                onView={(newView) => setView(newView)}
                selectable
                onSelectSlot={handleSelectSlot}
                popup
                longPressThreshold={1}
                onSelectEvent={(event) => setSelectedEvent(event as CalendarEvent)}
            />
            </div>

            <Dialog open={slotFormOpen} onOpenChange={(open) => !open && setSlotFormOpen(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-serif">Neuer Termin</DialogTitle>
                    </DialogHeader>
                    {slotFormSlot && (
                        <form onSubmit={handleSlotFormSubmit} className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Titel..."
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-mw-green/30"
                                value={slotFormTitle}
                                onChange={(e) => setSlotFormTitle(e.target.value)}
                                required
                            />
                            <select
                                value={slotFormCaseId ?? ""}
                                onChange={(e) => setSlotFormCaseId(e.target.value || null)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                            >
                                <option value="">Fall (optional)</option>
                                {cases.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <select
                                value={slotFormAssigneeId ?? ""}
                                onChange={(e) => setSlotFormAssigneeId(e.target.value || null)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                            >
                                <option value="">An... (optional)</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.display_name}</option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Start</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        value={slotFormStart}
                                        onChange={(e) => setSlotFormStart(e.target.value)}
                                        required
                                        aria-label="Startzeit"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Ende</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        value={slotFormEnd}
                                        onChange={(e) => setSlotFormEnd(e.target.value)}
                                        aria-label="Endzeit"
                                    />
                                </div>
                            </div>
                            <select
                                value={slotFormReminder}
                                onChange={(e) => setSlotFormReminder(e.target.value as ReminderMinutes)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                            >
                                {REMINDER_OPTIONS.map((o) => (
                                    <option key={o.value || "none"} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="submit"
                                    disabled={slotFormSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 bg-mw-green text-white p-2.5 rounded-xl hover:bg-mw-green-dark transition text-sm font-medium disabled:opacity-60"
                                >
                                    <Plus size={16} /> Speichern
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSlotFormOpen(false)}
                                    className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-serif">
                            {selectedEvent?.resource?.type === "time_entry"
                                ? "Arbeitszeit"
                                : selectedEvent?.resource?.type === "event"
                                    ? "Veranstaltung"
                                    : selectedEvent?.resource?.type === "task"
                                        ? "Aufgabe"
                                        : "Termin"}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-3">
                            <p className="font-medium text-gray-800">{selectedEvent.resource?.displayTitle ?? selectedEvent.title}</p>
                            <p className="text-sm text-gray-600">
                                {format(selectedEvent.start, "EEEE, d. MMMM yyyy", { locale: de })}
                                <br />
                                {format(selectedEvent.start, "HH:mm")} – {format(selectedEvent.end, "HH:mm")} Uhr
                            </p>
                            {selectedEvent.resource?.type === "time_entry" && selectedEvent.resource?.employeeName && (
                                <p className="text-xs text-gray-500">
                                    Mitarbeiter: {selectedEvent.resource.employeeName}
                                </p>
                            )}
                            {selectedEvent.resource?.caseId && getDisplayLabel(selectedEvent.resource.caseId) && (
                                <p className="text-xs text-gray-500">
                                    Fall: {getDisplayLabel(selectedEvent.resource.caseId)}
                                </p>
                            )}
                            {selectedEvent.resource?.type === "event" && (
                                <p className="text-xs text-gray-500">
                                    Bearbeiten unter Unternehmen → Veranstaltungen
                                </p>
                            )}
                            <div className="flex flex-col gap-2">
                                {selectedEvent.resource?.caseId && onOpenCase && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onOpenCase(selectedEvent.resource!.caseId!);
                                            setSelectedEvent(null);
                                        }}
                                        className="flex items-center gap-2 w-full justify-center bg-mw-green text-white p-2.5 rounded-xl hover:bg-mw-green-dark transition text-sm font-medium"
                                    >
                                        Zum Fall
                                        <ChevronRight size={16} />
                                    </button>
                                )}
                                {!selectedEvent.resource?.caseId && (
                                    <p className="text-xs text-gray-400 italic">Kein Fall verknüpft</p>
                                )}
                                <div className="flex gap-2">
                                    {selectedEvent.resource?.type === "appointment" && selectedEvent.resource.appointmentId && onEditAppointment && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const appt = appointments.find((a) => a.id === selectedEvent.resource!.appointmentId);
                                                    if (appt) {
                                                        onEditAppointment(appt);
                                                        setSelectedEvent(null);
                                                    }
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 p-2.5 rounded-xl hover:bg-gray-200 transition text-sm font-medium"
                                            >
                                                <Pencil size={14} /> Bearbeiten
                                            </button>
                                            {onDeleteAppointment && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (confirm("Termin löschen?")) {
                                                            onDeleteAppointment(selectedEvent.resource!.appointmentId!);
                                                            setSelectedEvent(null);
                                                        }
                                                    }}
                                                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition"
                                                    title="Löschen"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {selectedEvent.resource?.type === "task" && selectedEvent.resource.taskId && onEditTask && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const task = tasks.find((t) => t.id === selectedEvent.resource!.taskId);
                                                    if (task) {
                                                        onEditTask(task);
                                                        setSelectedEvent(null);
                                                    }
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 p-2.5 rounded-xl hover:bg-gray-200 transition text-sm font-medium"
                                            >
                                                <Pencil size={14} /> Bearbeiten
                                            </button>
                                            {onDeleteTask && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (confirm("Aufgabe wirklich löschen?")) {
                                                            onDeleteTask(selectedEvent.resource!.taskId!);
                                                            setSelectedEvent(null);
                                                        }
                                                    }}
                                                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition"
                                                    title="Löschen"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
