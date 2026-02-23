"use client";

import { useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import type { Appointment, Task } from "@/types";
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
    resource?: { type: "appointment" | "task"; completed?: boolean };
};

interface CalendarViewProps {
    appointments: Appointment[];
    tasks: Task[];
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

export function CalendarView({ appointments, tasks }: CalendarViewProps) {
    const events: CalendarEvent[] = useMemo(() => {
        const result: CalendarEvent[] = [];

        appointments.forEach((a) => {
            const start = new Date(a.date);
            const end = new Date(start);
            end.setMinutes(end.getMinutes() + 30);
            result.push({
                id: `appt-${a.id}`,
                title: a.title,
                start,
                end,
                resource: { type: "appointment" },
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
                    resource: { type: "task", completed: t.completed },
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
                    resource: { type: "task", completed: true },
                });
            });

        return result.sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [appointments, tasks]);

    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        const isTask = event.resource?.type === "task";
        const isCompleted = event.resource?.completed;
        return {
            style: {
                backgroundColor: isTask
                    ? isCompleted
                        ? "#22c55e"
                        : "#f59e0b"
                    : "var(--color-mw-green)",
                borderRadius: "6px",
                border: "none",
            },
        };
    }, []);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-mw-green" /> Termin
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500" /> Aufgabe (offen)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-green-500" /> Aufgabe (erledigt)
                </span>
            </div>
            <div className="h-[calc(80vh-2rem)] min-h-[400px] bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                messages={messages}
                culture="de-DE"
                eventPropGetter={eventStyleGetter}
                views={["month", "week", "day", "agenda"]}
                defaultView="week"
                popup
            />
            </div>
        </div>
    );
}
