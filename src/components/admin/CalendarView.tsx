"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { Appointment, Task } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import "react-big-calendar/lib/css/react-big-calendar.css";

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
        type: "appointment" | "task" | "time_entry";
        completed?: boolean;
        caseId?: string | null;
        displayTitle: string;
        appointmentId?: string;
        taskId?: string;
        employeeId?: string;
        employeeName?: string;
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

interface CalendarViewProps {
    appointments: Appointment[];
    tasks: Task[];
    timeEntries?: TimeEntryEvent[];
    employees?: { id: string; display_name: string }[];
    showTimeEntries?: boolean;
    cases?: { id: string; name: string; contact?: { firstName?: string; lastName?: string } }[];
    onOpenCase?: (caseId: string) => void;
    onEditAppointment?: (appointment: Appointment) => void;
    onEditTask?: (task: Task) => void;
    onDeleteAppointment?: (id: string) => void;
    onDeleteTask?: (id: string) => void;
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
    timeEntries = [],
    employees = [],
    showTimeEntries = true,
    cases = [],
    onOpenCase,
    onEditAppointment,
    onEditTask,
    onDeleteAppointment,
    onDeleteTask,
    getCaseDisplayLabel,
}: CalendarViewProps) {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const events: CalendarEvent[] = useMemo(() => {
        const result: CalendarEvent[] = [];

        if (showTimeEntries && timeEntries.length > 0) {
            result.push(...timeEntriesToEvents(timeEntries, employees));
        }

        appointments.forEach((a) => {
            const start = new Date(a.date);
            const end = new Date(start);
            end.setMinutes(end.getMinutes() + 30);
            result.push({
                id: `appt-${a.id}`,
                title: a.title,
                start,
                end,
                resource: { type: "appointment", caseId: a.caseId ?? null, displayTitle: a.title, appointmentId: a.id },
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
    }, [appointments, tasks, timeEntries, employees, showTimeEntries]);

    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        const type = event.resource?.type;
        const isTask = type === "task";
        const isCompleted = event.resource?.completed;
        const isTimeEntry = type === "time_entry";
        return {
            style: {
                backgroundColor: isTimeEntry
                    ? "#6366f1"
                    : isTask
                        ? isCompleted
                            ? "#22c55e"
                            : "#f59e0b"
                        : "var(--color-mw-green)",
                borderRadius: "6px",
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
                defaultView={isMobile ? "agenda" : "week"}
                popup
                longPressThreshold={1}
                onSelectEvent={(event) => setSelectedEvent(event as CalendarEvent)}
            />
            </div>

            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-serif">
                            {selectedEvent?.resource?.type === "time_entry"
                                ? "Arbeitszeit"
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
