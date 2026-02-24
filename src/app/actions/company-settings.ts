"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type EventsDisplayMode = "next_n" | "next_days";

export type CompanySettings = {
  displayName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  eventsDisplayMode: EventsDisplayMode;
  eventsDisplayLimit: number;
};

const KEYS = {
  displayName: "display_name",
  tagline: "tagline",
  primaryColor: "primary_color",
  secondaryColor: "secondary_color",
  logoUrl: "logo_url",
  faviconUrl: "favicon_url",
  eventsDisplayMode: "events_display_mode",
  eventsDisplayLimit: "events_display_limit",
} as const;

const DEFAULTS: CompanySettings = {
  displayName: "liebevoll bestatten",
  tagline: "minten & walter · Bonn",
  primaryColor: "#047857",
  secondaryColor: "#b45309",
  logoUrl: "",
  faviconUrl: "",
  eventsDisplayMode: "next_days",
  eventsDisplayLimit: 30,
};

export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("company_settings")
      .select("key, value");

    if (!rows?.length) return DEFAULTS;

    const db: Record<string, unknown> = {};
    for (const r of rows) {
      db[r.key] = r.value;
    }

    return {
      displayName: (db[KEYS.displayName] as string) ?? DEFAULTS.displayName,
      tagline: (db[KEYS.tagline] as string) ?? DEFAULTS.tagline,
      primaryColor: (db[KEYS.primaryColor] as string) ?? DEFAULTS.primaryColor,
      secondaryColor: (db[KEYS.secondaryColor] as string) ?? DEFAULTS.secondaryColor,
      logoUrl: (db[KEYS.logoUrl] as string) ?? DEFAULTS.logoUrl,
      faviconUrl: (db[KEYS.faviconUrl] as string) ?? DEFAULTS.faviconUrl,
      eventsDisplayMode:
        (db[KEYS.eventsDisplayMode] as EventsDisplayMode) ?? DEFAULTS.eventsDisplayMode,
      eventsDisplayLimit: (() => {
        const v = db[KEYS.eventsDisplayLimit];
        const n = typeof v === "number" ? v : Number(v);
        return Number.isFinite(n) && n >= 1 ? n : DEFAULTS.eventsDisplayLimit;
      })(),
    };
  } catch {
    return DEFAULTS;
  }
}

const PAGE_CONTENT_KEY = "page_content";
const PAGE_CONTENT_TERMINE_KEY = "page_content_termine";
const PAGE_CONTENT_TEAM_KEY = "page_content_team";

/** Puck Data format: { content: ComponentData[], root: RootData } */
export type PageContent = {
  content: Array<{ type: string; props: Record<string, unknown> }>;
  root: { props?: Record<string, unknown> };
  zones?: Record<string, unknown>;
};

/** Path to storage key mapping. "/" = Startseite, "/termine" = Termine, "/team" = Team */
function getPageContentKey(path?: string): string {
  if (!path || path === "/") return PAGE_CONTENT_KEY;
  if (path === "/termine") return PAGE_CONTENT_TERMINE_KEY;
  if (path === "/team") return PAGE_CONTENT_TEAM_KEY;
  return `page_content_${path.replace(/^\//, "").replace(/\//g, "_")}`;
}

export async function getPageContent(path?: string): Promise<PageContent | null> {
  try {
    const admin = createAdminClient();
    const key = getPageContentKey(path);
    const { data } = await admin
      .from("company_settings")
      .select("value")
      .eq("key", key)
      .single();
    if (!data?.value || typeof data.value !== "object") return null;
    return data.value as PageContent;
  } catch {
    return null;
  }
}

export async function savePageContent(
  data: PageContent,
  path?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const key = getPageContentKey(path);
    const { error } = await admin
      .from("company_settings")
      .upsert(
        { key, value: data, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) {
      console.error("savePageContent error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function saveCompanySettings(
  settings: Partial<CompanySettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();

    const SETTING_TO_DB_KEY: Record<keyof CompanySettings, string> = {
      displayName: KEYS.displayName,
      tagline: KEYS.tagline,
      primaryColor: KEYS.primaryColor,
      secondaryColor: KEYS.secondaryColor,
      logoUrl: KEYS.logoUrl,
      faviconUrl: KEYS.faviconUrl,
      eventsDisplayMode: KEYS.eventsDisplayMode,
      eventsDisplayLimit: KEYS.eventsDisplayLimit,
    };

    for (const [settingKey, value] of Object.entries(settings)) {
      if (value === undefined) continue;
      const dbKey = SETTING_TO_DB_KEY[settingKey as keyof CompanySettings];
      if (!dbKey) continue;

      const { error } = await admin
        .from("company_settings")
        .upsert(
          { key: dbKey, value: value, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) {
        console.error("saveCompanySettings error:", error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}
