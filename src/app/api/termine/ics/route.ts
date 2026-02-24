import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { expandRecurringEvents } from "@/lib/recurrence";
import type { Event, EventRecurrenceConfig } from "@/types";

function mapEventRow(r: {
  id: string;
  name: string;
  description: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  is_public: boolean;
  recurrence_type: string;
  recurrence_config: unknown;
  recurrence_until: string | null;
  created_at: string;
  updated_at: string;
}): Event {
  const config = r.recurrence_config as EventRecurrenceConfig | null;
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    startAt: r.start_at,
    endAt: r.end_at,
    location: r.location ?? null,
    isPublic: r.is_public ?? false,
    recurrenceType: (r.recurrence_type || "none") as Event["recurrenceType"],
    recurrenceConfig: config ?? {},
    recurrenceUntil: r.recurrence_until ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Escape text for iCal (backslash, semicolon, comma) */
function escapeIcalText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Format ISO date to iCal DT format (YYYYMMDDTHHmmssZ) */
function toIcalDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hour = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const sec = pad(d.getUTCSeconds());
  return `${year}${month}${day}T${hour}${min}${sec}Z`;
}

function buildIcs(eventName: string, startAt: string, endAt: string, description: string | null, location: string | null): string {
  const uid = `termine-${startAt.replace(/[-:T.Z]/g, "")}@termine`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coffin//Termine//DE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${toIcalDateTime(startAt)}`,
    `DTEND:${toIcalDateTime(endAt)}`,
    `SUMMARY:${escapeIcalText(eventName)}`,
    ...(description ? [`DESCRIPTION:${escapeIcalText(description)}`] : []),
    ...(location ? [`LOCATION:${escapeIcalText(location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const startAt = searchParams.get("startAt");

    if (!eventId || !startAt) {
      return NextResponse.json(
        { error: "eventId und startAt sind erforderlich" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("is_public", true);

    if (error || !rows?.length) {
      return NextResponse.json(
        { error: "Veranstaltung nicht gefunden" },
        { status: 404 }
      );
    }

    const event = mapEventRow(rows[0]);
    const from = new Date(startAt);
    from.setDate(from.getDate() - 1);
    const to = new Date(startAt);
    to.setDate(to.getDate() + 1);
    const instances = expandRecurringEvents([event], from, to);
    const startMs = new Date(startAt).getTime();
    const instance = instances.find(
      (i) => i.eventId === eventId && new Date(i.startAt).getTime() === startMs
    );

    if (!instance) {
      return NextResponse.json(
        { error: "Termin nicht gefunden" },
        { status: 404 }
      );
    }

    const ics = buildIcs(
      instance.event.name,
      instance.startAt,
      instance.endAt,
      instance.event.description,
      instance.event.location
    );

    const filename = `${instance.event.name.replace(/[^a-zA-Z0-9äöüÄÖÜß\-]/g, "-")}.ics`;

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("termine/ics error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
