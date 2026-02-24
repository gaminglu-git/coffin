"use client";

import { useState, useEffect } from "react";
import { Puck, Render, legacySideBarPlugin } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig, puckConfigTermine, puckConfigTeam } from "./puck-config";
import {
  getPageContent,
  savePageContent,
  type PageContent,
} from "@/app/actions/company-settings";
import { Loader2, Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Config } from "@puckeditor/core";

type EditorPage = "home" | "termine" | "team";

const PAGE_CONFIG: Record<
  EditorPage,
  { config: Config; defaultData: PageContent; path: string; previewHref: string }
> = {
  home: {
    config: puckConfig,
    defaultData: (() => {
      const d = ensureContentIds({
        content: [
          {
            type: "HeroBlock",
            props: {
              title: "liebevoll bestatten.",
              subtitle:
                "Wir begleiten Sie in schweren Zeiten mit Wärme, Empathie und einem Fokus auf das, was wirklich zählt: Ein würdevoller, liebevoller Abschied.",
              ctaPrimary: "Lassen Sie uns reden",
              ctaSecondary: "Vorsorge digital planen",
            },
          },
          {
            type: "PhilosophieCard",
            props: {
              icon: "heart",
              title: "Wir sind einfühlsam.",
              text: "Wir nehmen uns Zeit. Gemeinsam gestalten wir individuelle Abschiede.",
            },
          },
          {
            type: "PhilosophieCard",
            props: {
              icon: "shield",
              title: "Wir sind offen.",
              text: "Offen für alle Menschen und Formen des Abschieds.",
            },
          },
          {
            type: "PhilosophieCard",
            props: {
              icon: "users",
              title: "Wir sind menschlich.",
              text: "Nahbar und respektvoll.",
            },
          },
          {
            type: "LeistungenBlock",
            props: {
              title: "Selbstbestimmt bis zum Schluss. Unsere Vorsorge.",
              subtitle:
                "Nehmen Sie Ihren Liebsten die schwersten Entscheidungen ab. Mit einer Bestattungsvorsorge legen Sie zu Lebzeiten fest, wie Ihr Abschied gestaltet werden soll.",
              bulletPoints:
                "Sicherheit und Entlastung für Angehörige.\nGarantiert Ihre persönlichen Wünsche.\nVolle finanzielle Absicherung möglich.",
              ctaText: "Jetzt Wünsche konfigurieren",
              trauerfallLinkText: "Sofort anfragen",
              beratungLinkText: "Anfragen",
            },
          },
          {
            type: "TeamTeaser",
            props: {
              title: "Unser Team",
              intro: "Lernen Sie die Menschen kennen, die Sie in schweren Zeiten begleiten.",
              buttonText: "Team ansehen",
            },
          },
          {
            type: "ContactBlock",
            props: {
              heading: "Wir sind für Sie da.",
              phone: "0228 620 58 15",
              email: "info@minten-walter.de",
            },
          },
          {
            type: "TrauerfallCard",
            props: {
              title: "Im Trauerfall - Was tun?",
              body:
                "Sie haben Zeit. Sie dürfen den verstorbenen Menschen bis zu 36h zu Hause behalten. Rufen Sie den Arzt (Totenschein) und im Anschluss uns an.",
              ctaText: "Jetzt anrufen",
            },
          },
        ],
        root: { props: { title: "Startseite" } },
      });
      return d;
    })(),
    path: "/",
    previewHref: "/",
  },
  termine: {
    config: puckConfigTermine,
    defaultData: ensureContentIds({
      content: [
        {
          type: "TermineHeaderBlock",
          props: {
            title: "Termine & Veranstaltungen",
            intro:
              "Wir laden Sie herzlich zu unseren Veranstaltungen ein. Hier finden Sie die nächsten Termine.",
          },
        },
      ],
      root: { props: { title: "Termine" } },
    }),
    path: "/termine",
    previewHref: "/termine",
  },
  team: {
    config: puckConfigTeam,
    defaultData: ensureContentIds({
      content: [
        {
          type: "TeamHeaderBlock",
          props: {
            title: "Unser Team",
            intro:
              "Lernen Sie die Menschen kennen, die Sie bei minten & walter bestattungen in schweren Zeiten begleiten.",
          },
        },
      ],
      root: { props: { title: "Team" } },
    }),
    path: "/team",
    previewHref: "/team",
  },
};

/** Ensures each content block has a unique id (required by Puck for React keys). */
function ensureContentIds(data: PageContent): PageContent {
  const seen = new Set<string>();
  const makeId = (type: string) => {
    let id: string;
    do {
      id = `${type}-${Math.random().toString(36).slice(2, 11)}`;
    } while (seen.has(id));
    seen.add(id);
    return id;
  };

  const ensureBlock = (block: { type: string; props?: Record<string, unknown> }) => {
    const props = block.props ?? {};
    const id = (typeof props.id === "string" ? props.id : null) ?? makeId(block.type);
    return { ...block, props: { ...props, id } };
  };

  const content = (data.content ?? []).map(ensureBlock);

  const zones = data.zones as Record<string, Array<{ type: string; props?: Record<string, unknown> }>> | undefined;
  const normalizedZones =
    zones && Object.keys(zones).length > 0
      ? Object.fromEntries(
          Object.entries(zones).map(([k, arr]) => [k, (arr ?? []).map(ensureBlock)])
        )
      : data.zones;

  return { ...data, content, zones: normalizedZones };
}

export function WebsiteEditor() {
  const [page, setPage] = useState<EditorPage>("home");
  const [data, setData] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pageConfig = PAGE_CONFIG[page];

  useEffect(() => {
    setLoading(true);
    getPageContent(pageConfig.path).then((content) => {
      const raw = content ?? pageConfig.defaultData;
      setData(ensureContentIds(raw));
      setLoading(false);
    });
  }, [page]);

  const handlePublish = async () => {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    const result = await savePageContent(data, pageConfig.path);
    setSaving(false);
    setMessage(result.success ? "Gespeichert." : (result.error ?? "Fehler"));
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-mw-green" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-serif text-gray-800">Website-Editor</h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                setPage("home");
                setData(null);
                setLoading(true);
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                page === "home"
                  ? "bg-mw-green text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Startseite
            </button>
            <button
              type="button"
              onClick={() => {
                setPage("termine");
                setData(null);
                setLoading(true);
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                page === "termine"
                  ? "bg-mw-green text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Termine
            </button>
            <button
              type="button"
              onClick={() => {
                setPage("team");
                setData(null);
                setLoading(true);
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                page === "team"
                  ? "bg-mw-green text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Team
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={pageConfig.previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-mw-green flex items-center gap-1"
          >
            <ExternalLink size={16} /> Vorschau
          </Link>
          <Button
            onClick={handlePublish}
            disabled={saving}
            size="sm"
            className="bg-mw-green hover:bg-mw-green-dark"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="ml-2">Speichern</span>
          </Button>
        </div>
      </div>
      {message && (
        <p className="px-4 py-2 text-sm text-gray-600 bg-gray-50">{message}</p>
      )}
      <p className="px-4 py-1.5 text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
        Blöcke aus der linken Leiste in den Inhalt ziehen, um neue Inhalte
        hinzuzufügen.
      </p>

      <div className="flex-1 min-h-[500px] overflow-hidden" style={{ height: "100%" }}>
        <Puck
          config={pageConfig.config}
          data={data as Record<string, unknown>}
          onPublish={handlePublish}
          onChange={(d) => setData(d as PageContent)}
          height="100%"
          iframe={{ enabled: false }}
          plugins={[legacySideBarPlugin()]}
        />
      </div>
    </div>
  );
}

export function WebsitePreview({ data }: { data: PageContent }) {
  const normalized = ensureContentIds(data);
  return (
    <Render config={puckConfig} data={normalized as Record<string, unknown>} />
  );
}

export function TerminePreview({ data }: { data: PageContent }) {
  const normalized = ensureContentIds(data);
  return (
    <Render
      config={puckConfigTermine}
      data={normalized as Record<string, unknown>}
    />
  );
}

/** Renders editor blocks (excluding TermineHeaderBlock) for the live Termine page. */
export function TermineContentBlocks({
  blocks,
}: {
  blocks: Array<{ type: string; props: Record<string, unknown> }>;
}) {
  return (
    <>
      {blocks.map((block) => {
        const comp = puckConfigTermine.components[
          block.type as keyof typeof puckConfigTermine.components
        ] as { render?: (p: Record<string, unknown>) => React.ReactNode } | undefined;
        if (!comp?.render) return null;
        return (
          <div key={String(block.props?.id ?? block.type)}>
            {comp.render(block.props ?? {})}
          </div>
        );
      })}
    </>
  );
}

/** Renders editor blocks (excluding TeamHeaderBlock) for the live Team page. */
export function TeamContentBlocks({
  blocks,
}: {
  blocks: Array<{ type: string; props: Record<string, unknown> }>;
}) {
  return (
    <>
      {blocks.map((block) => {
        const comp = puckConfigTeam.components[
          block.type as keyof typeof puckConfigTeam.components
        ] as { render?: (p: Record<string, unknown>) => React.ReactNode } | undefined;
        if (!comp?.render) return null;
        return (
          <div key={String(block.props?.id ?? block.type)}>
            {comp.render(block.props ?? {})}
          </div>
        );
      })}
    </>
  );
}
