"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, Pencil, Trash2, X, Globe, GlobeLock } from "lucide-react";
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type CreateEventInput,
} from "@/app/actions/events";
import type { Event, EventRecurrenceType } from "@/types";
import { queryKeys } from "@/lib/query-keys";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

const RECURRENCE_OPTIONS: { value: EventRecurrenceType; label: string }[] = [
  { value: "none", label: "Keine" },
  { value: "weekly", label: "Wöchentlich" },
  { value: "monthly", label: "Monatlich" },
  {
    value: "monthly_nth",
    label: "Jeden X. Wochentag im Monat (z.B. 1. Mittwoch)",
  },
];

const WEEKDAYS = [
  { value: 1, label: "Montag" },
  { value: 2, label: "Dienstag" },
  { value: 3, label: "Mittwoch" },
  { value: 4, label: "Donnerstag" },
  { value: 5, label: "Freitag" },
  { value: 6, label: "Samstag" },
  { value: 7, label: "Sonntag" },
];

const WEEKS_OF_MONTH = [
  { value: 1, label: "1." },
  { value: 2, label: "2." },
  { value: 3, label: "3." },
  { value: 4, label: "4." },
  { value: 5, label: "5." },
];

const emptyForm: CreateEventInput = {
  name: "",
  description: "",
  startAt: "",
  endAt: "",
  location: "",
  isPublic: false,
  recurrenceType: "none",
  recurrenceConfig: {},
  recurrenceUntil: null,
};

export function VeranstaltungenList() {
  const queryClient = useQueryClient();
  const { data: events = [] } = useQuery({
    queryKey: queryKeys.eventsList,
    queryFn: listEvents,
  });
  const [form, setForm] = useState<CreateEventInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useRealtimeTable({ table: "events" }, () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.eventsList })
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const toIso = (v: string) =>
    v ? new Date(v.length <= 16 ? `${v}:00` : v).toISOString() : v;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.startAt || !form.endAt) {
      setError("Name, Start und Ende sind Pflichtfelder.");
      return;
    }
    if (new Date(form.startAt) >= new Date(form.endAt)) {
      setError("Ende muss nach Start liegen.");
      return;
    }

    const payload = {
      ...form,
      startAt: toIso(form.startAt),
      endAt: toIso(form.endAt),
    };

    if (editingId) {
      const result = await updateEvent(editingId, payload);
      if (result.error) {
        setError(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.eventsList });
        resetForm();
      }
    } else {
      const result = await createEvent(payload);
      if (result.error) {
        setError(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.eventsList });
        resetForm();
      }
    }
  };

  const startEdit = (event: Event) => {
    setEditingId(event.id);
    setForm({
      name: event.name,
      description: event.description ?? "",
      startAt: event.startAt.slice(0, 16),
      endAt: event.endAt.slice(0, 16),
      location: event.location ?? "",
      isPublic: event.isPublic,
      recurrenceType: event.recurrenceType,
      recurrenceConfig: event.recurrenceConfig ?? {},
      recurrenceUntil: event.recurrenceUntil?.slice(0, 10) ?? null,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Veranstaltung wirklich löschen?")) return;
    const result = await deleteEvent(id);
    if (!result.error) {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsList });
      if (editingId === id) resetForm();
    } else {
      setError(result.error);
    }
  };

  const recurrenceConfig =
    form.recurrenceType === "monthly_nth"
      ? {
          weekday: (form.recurrenceConfig?.weekday ?? 3) as number,
          weekOfMonth: (form.recurrenceConfig?.weekOfMonth ?? 1) as number,
        }
      : {};

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-serif text-mw-green flex items-center gap-2">
          <Calendar size={24} /> Veranstaltungen
        </h2>
        <p className="text-gray-600 mt-1 text-sm">
          Öffentliche Veranstaltungen erscheinen auf der Termin-Seite Ihrer Website.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4"
      >
        <h3 className="font-medium text-mw-green">
          {editingId ? "Veranstaltung bearbeiten" : "Neue Veranstaltung"}
        </h3>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            placeholder="z.B. Wohnzimmergespräche"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beschreibung
          </label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[100px]"
            placeholder="Inhalt und Ablauf der Veranstaltung..."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start *
            </label>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ende *
            </label>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ort (optional)
          </label>
          <input
            type="text"
            value={form.location ?? ""}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            placeholder="z.B. Annaberger Straße 133, 53175 Bonn"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublic ?? false}
            onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            className="rounded border-gray-300 text-mw-green focus:ring-mw-green"
          />
          <span className="text-sm font-medium text-gray-700">
            Öffentlich anzeigen (auf Website /termine)
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wiederholung
          </label>
          <select
            value={form.recurrenceType}
            onChange={(e) =>
              setForm({
                ...form,
                recurrenceType: e.target.value as EventRecurrenceType,
              })
            }
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          >
            {RECURRENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {form.recurrenceType === "monthly_nth" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wochentag
              </label>
              <select
                value={recurrenceConfig.weekday}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recurrenceConfig: {
                      ...form.recurrenceConfig,
                      weekday: parseInt(e.target.value, 10),
                    },
                  })
                }
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                {WEEKDAYS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Woche im Monat
              </label>
              <select
                value={recurrenceConfig.weekOfMonth}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recurrenceConfig: {
                      ...form.recurrenceConfig,
                      weekOfMonth: parseInt(e.target.value, 10),
                    },
                  })
                }
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                {WEEKS_OF_MONTH.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(form.recurrenceType === "weekly" ||
          form.recurrenceType === "monthly" ||
          form.recurrenceType === "monthly_nth") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wiederholung bis (optional)
            </label>
            <input
              type="date"
              value={form.recurrenceUntil ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  recurrenceUntil: e.target.value || null,
                })
              }
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-mw-green text-white px-6 py-2.5 rounded-xl font-medium hover:bg-mw-green-dark transition flex items-center gap-2"
          >
            <Plus size={18} />
            {editingId ? "Speichern" : "Anlegen"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 rounded-xl border border-gray-200"
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-medium text-gray-800">Alle Veranstaltungen</h3>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Noch keine Veranstaltungen angelegt.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 rounded-xl border border-gray-200 bg-white flex justify-between items-start gap-4 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-800">{event.name}</h4>
                    {event.isPublic ? (
                      <span
                        className="flex items-center gap-1 text-xs text-emerald-600"
                        title="Öffentlich"
                      >
                        <Globe size={14} />
                      </span>
                    ) : (
                      <span
                        className="flex items-center gap-1 text-xs text-gray-400"
                        title="Nicht öffentlich"
                      >
                        <GlobeLock size={14} />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {event.description || "—"}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span>
                      {new Date(event.startAt).toLocaleDateString("de-DE")} –{" "}
                      {new Date(event.startAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      Uhr
                    </span>
                    {event.recurrenceType !== "none" && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        {RECURRENCE_OPTIONS.find(
                          (o) => o.value === event.recurrenceType
                        )?.label ?? event.recurrenceType}
                      </span>
                    )}
                    {event.location && (
                      <span className="truncate max-w-[200px]">
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(event)}
                    className="p-2 text-gray-400 hover:text-mw-green transition"
                    title="Bearbeiten"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition"
                    title="Löschen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
