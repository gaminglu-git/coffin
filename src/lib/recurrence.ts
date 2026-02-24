/**
 * Recurrence expansion for events - used by server actions and can run on client
 */
import type { Event, EventRecurrenceConfig } from "@/types";

export type EventInstance = {
  eventId: string;
  event: Event;
  startAt: string;
  endAt: string;
};

/** Get nth weekday of month (e.g. 1st Wednesday). weekday: 1=Mon..7=Sun */
function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  weekOfMonth: number
): Date | null {
  const first = new Date(year, month, 1);
  const firstDow = first.getDay() === 0 ? 7 : first.getDay();
  const offset = (weekday - firstDow + 7) % 7;
  const day = 1 + offset + (weekOfMonth - 1) * 7;
  const lastDay = new Date(year, month + 1, 0).getDate();
  if (day > lastDay) return null;
  return new Date(year, month, day);
}

/** Expand recurring events into instances within a date range */
export function expandRecurringEvents(
  events: Event[],
  fromDate: Date,
  toDate: Date
): EventInstance[] {
  const result: EventInstance[] = [];

  for (const event of events) {
    if (event.recurrenceType === "none") {
      const start = new Date(event.startAt);
      const end = new Date(event.endAt);
      if (end >= fromDate && start <= toDate) {
        result.push({
          eventId: event.id,
          event,
          startAt: event.startAt,
          endAt: event.endAt,
        });
      }
      continue;
    }

    let recurrenceUntil: Date;
    if (event.recurrenceUntil) {
      const parsed = new Date(event.recurrenceUntil);
      // Date-only strings (e.g. "2026-03-04") parse as midnight UTC, excluding same-day instances.
      // Treat as end-of-day: if time is 00:00:00, use 23:59:59.999 of that day.
      const isDateOnly =
        event.recurrenceUntil.length <= 10 ||
        /T00:00:00/.test(event.recurrenceUntil);
      if (isDateOnly) {
        recurrenceUntil = new Date(parsed);
        recurrenceUntil.setUTCHours(23, 59, 59, 999);
      } else {
        recurrenceUntil = parsed;
      }
    } else {
      recurrenceUntil = new Date(toDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
    const limit = new Date(
      Math.min(toDate.getTime(), recurrenceUntil.getTime())
    );

    const baseStart = new Date(event.startAt);
    const baseEnd = new Date(event.endAt);
    const durationMs = baseEnd.getTime() - baseStart.getTime();

    if (event.recurrenceType === "weekly") {
      let d = new Date(baseStart);
      if (d < fromDate) {
        const diff = fromDate.getTime() - d.getTime();
        const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
        d.setDate(d.getDate() + weeks * 7);
      }
      while (d <= limit) {
        if (d >= fromDate) {
          const end = new Date(d.getTime() + durationMs);
          result.push({
            eventId: event.id,
            event,
            startAt: d.toISOString(),
            endAt: end.toISOString(),
          });
        }
        d.setDate(d.getDate() + 7);
      }
    } else if (event.recurrenceType === "monthly") {
      let d = new Date(baseStart);
      if (d < fromDate) {
        d = new Date(fromDate.getFullYear(), fromDate.getMonth(), baseStart.getDate());
      }
      while (d <= limit) {
        if (d >= fromDate) {
          const end = new Date(d.getTime() + durationMs);
          result.push({
            eventId: event.id,
            event,
            startAt: d.toISOString(),
            endAt: end.toISOString(),
          });
        }
        d.setMonth(d.getMonth() + 1);
      }
    } else if (event.recurrenceType === "monthly_nth") {
      const { weekday = 3, weekOfMonth = 1 } = (event.recurrenceConfig ?? {}) as EventRecurrenceConfig;
      let year = fromDate.getFullYear();
      let month = fromDate.getMonth();
      const startYear = baseStart.getFullYear();
      const startMonth = baseStart.getMonth();
      const baseHour = baseStart.getHours();
      const baseMin = baseStart.getMinutes();
      const baseSec = baseStart.getSeconds();

      if (year < startYear || (year === startYear && month < startMonth)) {
        year = startYear;
        month = startMonth;
      }

      while (true) {
        const d = nthWeekdayOfMonth(year, month, weekday, weekOfMonth);
        if (d) {
          d.setHours(baseHour, baseMin, baseSec, 0);
          if (d > limit) break;
          if (d >= fromDate) {
            const end = new Date(d.getTime() + durationMs);
            result.push({
              eventId: event.id,
              event,
              startAt: d.toISOString(),
              endAt: end.toISOString(),
            });
          }
        }
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
        if (year > limit.getFullYear() + 1) break;
      }
    }
  }

  return result.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
}
