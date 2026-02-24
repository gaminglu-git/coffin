"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { View, SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from "date-fns";
import { de } from "date-fns/locale";
import { MapPin } from "lucide-react";
import type { EventInstance } from "@/app/actions/events";
import { getPublicEventsInRange } from "@/app/actions/events";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventRegistrationForm } from "@/components/public/EventRegistrationForm";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./PublicCalendar.css";

const locales = { "de-DE": de };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: { instance: EventInstance };
};

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
  noEventsInRange: "Keine Veranstaltungen in diesem Zeitraum.",
  showMore: (total: number) => `+${total} weitere`,
};

const MOBILE_BREAKPOINT = 640;

function getRangeBounds(
  range: Date[] | { start: Date; end: Date }
): { from: Date; to: Date } {
  if (Array.isArray(range) && range.length >= 2) {
    return {
      from: range[0],
      to: range[range.length - 1],
    };
  }
  if (Array.isArray(range) && range.length === 1) {
    const d = range[0];
    return { from: startOfMonth(d), to: endOfMonth(d) };
  }
  if (typeof range === "object" && "start" in range && "end" in range) {
    return { from: range.start, to: range.end };
  }
  const now = new Date();
  return { from: startOfMonth(now), to: endOfMonth(now) };
}

export function PublicCalendar() {
  const [events, setEvents] = useState<EventInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<{ from: Date; to: Date }>(() => {
    const now = new Date();
    return { from: startOfMonth(now), to: endOfMonth(now) };
  });
  const [selectedInstance, setSelectedInstance] = useState<EventInstance | null>(null);
  const [registrationInstance, setRegistrationInstance] = useState<EventInstance | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<View>("month");

  useEffect(() => {
    const check = () =>
      setIsMobile(typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setView(isMobile ? "agenda" : "month");
  }, [isMobile]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    if (view === "month" && (slotInfo.action === "click" || slotInfo.action === "doubleClick")) {
      setView("day");
      setDate(slotInfo.start);
    }
  }, [view]);

  const fetchEvents = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    try {
      const data = await getPublicEventsInRange(from, to);
      setEvents(data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(range.from, range.to);
  }, [range.from, range.to, fetchEvents]);

  const handleRangeChange = useCallback(
    (newRange: Date[] | { start: Date; end: Date }) => {
      const bounds = getRangeBounds(newRange);
      setRange(bounds);
    },
    []
  );

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((inst) => ({
      id: `event-${inst.eventId}-${inst.startAt}`,
      title: inst.event.name,
      start: new Date(inst.startAt),
      end: new Date(inst.endAt),
      resource: { instance: inst },
    }));
  }, [events]);

  const eventStyleGetter = useCallback(() => {
    return {
      style: {
        backgroundColor: "rgba(5, 150, 105, 0.12)",
        color: "#065f46",
        borderRadius: "12px",
        border: "none",
      },
    };
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    const inst = event.resource?.instance;
    if (inst) {
      setSelectedInstance(inst);
    }
  }, []);


  return (
    <div className="space-y-6">
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-2xl">
            <span className="text-stone-500 text-sm">Lade Termine…</span>
          </div>
        )}
        <div
          className="h-[calc(80vh-2rem)] min-h-[320px] sm:min-h-[400px] bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-stone-200 p-2 sm:p-4 rbc-calendar-public"
        >
        <Calendar
          localizer={localizer}
          events={calendarEvents}
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
          onRangeChange={handleRangeChange}
          onSelectEvent={handleSelectEvent}
        />
        </div>
      </div>

      <Dialog
        open={!!selectedInstance}
        onOpenChange={(open) => {
          if (!open) setSelectedInstance(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-serif text-emerald-800">
              Veranstaltung
            </DialogTitle>
          </DialogHeader>
          {selectedInstance && (
            <div className="space-y-4">
              <p className="font-medium text-stone-800 text-lg">
                {selectedInstance.event.name}
              </p>
              <p className="text-sm text-stone-600">
                {format(new Date(selectedInstance.startAt), "EEEE, d. MMMM yyyy", {
                  locale: de,
                })}
                <br />
                {format(new Date(selectedInstance.startAt), "HH:mm")} –{" "}
                {format(new Date(selectedInstance.endAt), "HH:mm")} Uhr
              </p>
              {selectedInstance.event.location && (
                <p className="flex items-center gap-2 text-stone-600">
                  <MapPin size={18} className="text-emerald-600 shrink-0" />
                  {selectedInstance.event.location}
                </p>
              )}
              {selectedInstance.event.description && (
                <div className="prose prose-stone max-w-none text-sm text-stone-600 whitespace-pre-wrap">
                  {selectedInstance.event.description}
                </div>
              )}
              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={`/api/termine/ics?eventId=${encodeURIComponent(selectedInstance.eventId)}&startAt=${encodeURIComponent(selectedInstance.startAt)}`}
                  download
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                >
                  Termin hinzufügen
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationInstance(selectedInstance);
                    setSelectedInstance(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                >
                  Anmelden
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {registrationInstance && (
        <EventRegistrationForm
          open={!!registrationInstance}
          onOpenChange={(o) => !o && setRegistrationInstance(null)}
          instance={registrationInstance}
        />
      )}
    </div>
  );
}
