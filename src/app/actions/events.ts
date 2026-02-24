"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { expandRecurringEvents, type EventInstance } from "@/lib/recurrence";
import { getCompanySettings } from "@/app/actions/company-settings";
import type {
  Event,
  EventRecurrenceType,
  EventRecurrenceConfig,
} from "@/types";

export type { EventInstance } from "@/lib/recurrence";

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
    recurrenceType: (r.recurrence_type || "none") as EventRecurrenceType,
    recurrenceConfig: config ?? {},
    recurrenceUntil: r.recurrence_until ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getEvents(from: Date, to: Date): Promise<EventInstance[]> {
  const supabase = await createClient();
  // Fetch: single events in range + all recurring (expandRecurringEvents filters)
  const { data: single } = await supabase
    .from("events")
    .select("*")
    .eq("recurrence_type", "none")
    .lte("start_at", to.toISOString())
    .gte("end_at", from.toISOString());

  const { data: recurring } = await supabase
    .from("events")
    .select("*")
    .neq("recurrence_type", "none");

  const rows = [...(single ?? []), ...(recurring ?? [])];
  const events = rows.map(mapEventRow);
  return expandRecurringEvents(events, from, to);
}

export async function getPublicEvents(): Promise<EventInstance[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_public", true)
    .order("start_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rawCount = (data ?? []).length;
  const events = (data ?? []).map(mapEventRow);
  const now = new Date();
  const from = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 1095 * 24 * 60 * 60 * 1000);
  const expanded = expandRecurringEvents(events, from, to);
  if (rawCount > 0 && expanded.length === 0) {
    const sample = events[0];
    const recurrenceHint =
      sample?.recurrenceType !== "none" && sample?.recurrenceUntil
        ? ` recurrence_until=${sample.recurrenceUntil}`
        : "";
    console.warn(
      "[getPublicEvents] DB returned",
      rawCount,
      "events but expansion excluded all. Sample start_at:",
      sample?.startAt,
      recurrenceHint
    );
  }

  const settings = await getCompanySettings();
  const { eventsDisplayMode, eventsDisplayLimit } = settings;

  if (eventsDisplayMode === "next_n") {
    return expanded.slice(0, Math.max(1, eventsDisplayLimit));
  }

  if (eventsDisplayMode === "next_days") {
    const cutoff = new Date(
      now.getTime() + Math.max(1, eventsDisplayLimit) * 24 * 60 * 60 * 1000
    );
    return expanded.filter((inst) => new Date(inst.startAt) <= cutoff);
  }

  return expanded;
}

/** Public events in a date range (for calendar) - no display limit */
export async function getPublicEventsInRange(
  from: Date,
  to: Date
): Promise<EventInstance[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_public", true)
    .order("start_at", { ascending: true });

  if (error) throw new Error(error.message);

  const events = (data ?? []).map(mapEventRow);
  return expandRecurringEvents(events, from, to);
}

/** List all events (for admin CRUD) - no expansion */
export async function listEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapEventRow);
}

export type CreateEventInput = {
  name: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  location?: string | null;
  isPublic?: boolean;
  recurrenceType?: EventRecurrenceType;
  recurrenceConfig?: EventRecurrenceConfig;
  recurrenceUntil?: string | null;
};

export async function createEvent(
  input: CreateEventInput
): Promise<{ data?: Event; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .insert({
        name: input.name,
        description: input.description ?? null,
        start_at: input.startAt,
        end_at: input.endAt,
        location: input.location ?? null,
        is_public: input.isPublic ?? false,
        recurrence_type: input.recurrenceType ?? "none",
        recurrence_config: input.recurrenceConfig ?? {},
        recurrence_until: input.recurrenceUntil ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath("/termine");
    return { data: mapEventRow(data) };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Unbekannter Fehler",
    };
  }
}

export type UpdateEventInput = Partial<CreateEventInput>;

export async function updateEvent(
  id: string,
  input: UpdateEventInput
): Promise<{ data?: Event; error?: string }> {
  try {
    const supabase = await createClient();
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description;
    if (input.startAt !== undefined) payload.start_at = input.startAt;
    if (input.endAt !== undefined) payload.end_at = input.endAt;
    if (input.location !== undefined) payload.location = input.location;
    if (input.isPublic !== undefined) payload.is_public = input.isPublic;
    if (input.recurrenceType !== undefined)
      payload.recurrence_type = input.recurrenceType;
    if (input.recurrenceConfig !== undefined)
      payload.recurrence_config = input.recurrenceConfig;
    if (input.recurrenceUntil !== undefined)
      payload.recurrence_until = input.recurrenceUntil;

    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath("/termine");
    return { data: mapEventRow(data) };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Unbekannter Fehler",
    };
  }
}

export async function deleteEvent(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/termine");
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Unbekannter Fehler",
    };
  }
}

export type RegisterForEventInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
};

export async function registerForEvent(
  eventId: string,
  instanceStartAt: string,
  data: RegisterForEventInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: eventRow, error: fetchError } = await supabase
      .from("events")
      .select("id, is_public")
      .eq("id", eventId)
      .single();

    if (fetchError || !eventRow) {
      return { success: false, error: "Veranstaltung nicht gefunden." };
    }
    if (!eventRow.is_public) {
      return { success: false, error: "Diese Veranstaltung ist nicht öffentlich." };
    }

    const { error: insertError } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      instance_start_at: instanceStartAt,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return { success: false, error: "Sie sind bereits für diesen Termin angemeldet." };
      }
      return { success: false, error: insertError.message };
    }

    revalidatePath("/termine");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unbekannter Fehler",
    };
  }
}
