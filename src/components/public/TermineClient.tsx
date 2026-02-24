"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, MapPin, Phone, Mail, List, CalendarDays } from "lucide-react";
import type { EventInstance } from "@/app/actions/events";
import type { CompanySettings } from "@/app/actions/company-settings";
import type { PageContent } from "@/app/actions/company-settings";
import { EventRegistrationForm } from "@/components/public/EventRegistrationForm";
import { PublicCalendar } from "@/components/public/PublicCalendar";
import { TermineContentBlocks } from "@/components/admin/WebsiteEditor";

const DEFAULT_PHONE = "0228 620 58 15";
const DEFAULT_EMAIL = "info@minten-walter.de";

interface TermineClientProps {
  events: EventInstance[];
  companySettings: CompanySettings;
  /** Full page content from Website-Editor (page_content_termine) */
  pageContent?: PageContent | null;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ViewMode = "list" | "calendar";

const DEFAULT_HEADER = {
  title: "Termine & Veranstaltungen",
  intro:
    "Wir laden Sie herzlich zu unseren Veranstaltungen ein. Hier finden Sie die nächsten Termine.",
};

function extractHeaderAndBlocks(pageContent: PageContent | null): {
  title: string;
  intro: string;
  otherBlocks: Array<{ type: string; props: Record<string, unknown> }>;
} {
  const content = pageContent?.content ?? [];
  const headerBlock = content.find((b) => b.type === "TermineHeaderBlock");
  const { title, intro } =
    (headerBlock?.props as { title?: string; intro?: string }) ?? {};
  const otherBlocks = content.filter((b) => b.type !== "TermineHeaderBlock");
  return {
    title: typeof title === "string" ? title : DEFAULT_HEADER.title,
    intro: typeof intro === "string" ? intro : DEFAULT_HEADER.intro,
    otherBlocks,
  };
}

export function TermineClient({
  events,
  companySettings,
  pageContent = null,
}: TermineClientProps) {
  const { title, intro, otherBlocks } = extractHeaderAndBlocks(
    pageContent ?? null
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [registrationInstance, setRegistrationInstance] =
    useState<EventInstance | null>(null);

  const grouped = events.reduce<Record<string, EventInstance[]>>((acc, ev) => {
    const key = ev.event.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  return (
    <div className="pt-24 min-h-screen bg-stone-50">
      <section className="px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-serif text-emerald-800 mb-6">
            {title}
          </h1>
          <p className="text-lg text-stone-600 leading-relaxed mb-8">
            {intro}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                viewMode === "list"
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <List size={18} />
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                viewMode === "calendar"
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <CalendarDays size={18} />
              Kalender
            </button>
          </div>
        </div>
      </section>

      {otherBlocks.length > 0 && (
        <div className="px-4">
          <TermineContentBlocks blocks={otherBlocks} />
        </div>
      )}

      {viewMode === "calendar" ? (
        <section className="px-4 pb-24">
          <div className="max-w-5xl mx-auto">
            <PublicCalendar />
          </div>
        </section>
      ) : (
      <section className="px-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-10">
          {Object.entries(grouped).map(([eventName, instances]) => {
            const first = instances[0];
            const event = first.event;
            return (
              <article
                key={event.id}
                className="rounded-2xl border-2 border-stone-200 bg-white p-6 sm:p-8 shadow-md shadow-stone-200/50 space-y-6"
              >
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                    <div className="relative flex-1 min-w-0">
                      <div className="absolute -top-4 -left-2 opacity-20 pointer-events-none">
                        <Image
                          src="/assets/lavender.svg"
                          alt=""
                          width={64}
                          height={64}
                          className="w-16 h-16"
                        />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-serif text-emerald-800 relative z-10">
                        {eventName}
                      </h2>
                    </div>
                    <div className="w-full md:w-72 md:shrink-0">
                      <h3 className="text-sm font-medium text-emerald-800 mb-2">
                        Nächste Termine
                      </h3>
                      <ul className="space-y-1.5">
                        {instances.slice(0, 12).map((inst) => {
                          const start = new Date(inst.startAt);
                          const end = new Date(inst.endAt);
                          const icsUrl = `/api/termine/ics?eventId=${encodeURIComponent(inst.eventId)}&startAt=${encodeURIComponent(inst.startAt)}`;
                          return (
                            <li
                              key={`${inst.eventId}-${inst.startAt}`}
                              className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-sm"
                            >
                              <Calendar size={14} className="text-emerald-600 shrink-0" />
                              <span className="font-medium text-stone-800">
                                {formatDateShort(start)}, {formatTime(start)}–{formatTime(end)} Uhr
                              </span>
                              <span className="text-stone-300">·</span>
                              <a
                                href={icsUrl}
                                download
                                className="text-emerald-600 hover:text-emerald-800 hover:underline"
                              >
                                Termin hinzufügen
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                      {instances.length > 12 && (
                        <p className="text-xs text-stone-500 italic mt-2">
                          … und weitere {instances.length - 12} Termine
                        </p>
                      )}
                    </div>
                  </div>

                  {event.description && (
                    <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </div>
                  )}
                  {event.location && (
                    <p className="flex items-center gap-2 text-stone-600">
                      <MapPin size={18} className="text-emerald-600 shrink-0" />
                      {event.location}
                    </p>
                  )}
                </div>

                <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100">
                  <p className="font-medium text-stone-800 mb-2">
                    Anmeldung erwünscht
                  </p>
                  <p className="text-stone-600 text-sm mb-4">
                    Wir bitten um Anmeldung per E-Mail oder telefonisch.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {instances.slice(0, 12).map((inst) => {
                      const start = new Date(inst.startAt);
                      return (
                        <button
                          key={`${inst.eventId}-${inst.startAt}`}
                          type="button"
                          onClick={() => setRegistrationInstance(inst)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                        >
                          Anmelden für {formatDateShort(start)}, {formatTime(start)}
                        </button>
                      );
                    })}
                    <a
                      href={`tel:${DEFAULT_PHONE.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                    >
                      <Phone size={18} />
                      <span>{DEFAULT_PHONE}</span>
                    </a>
                    <a
                      href={`mailto:${DEFAULT_EMAIL}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                    >
                      <Mail size={18} />
                      <span>{DEFAULT_EMAIL}</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}

          {events.length === 0 && (
            <div className="text-center py-16">
              <Calendar size={48} className="mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500">
                Derzeit sind keine öffentlichen Termine geplant.
              </p>
              <p className="text-sm text-stone-400 mt-2">
                Schauen Sie bald wieder vorbei oder kontaktieren Sie uns direkt.
              </p>
            </div>
          )}
        </div>
      </section>
      )}

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
