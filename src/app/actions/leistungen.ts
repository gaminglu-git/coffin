"use server";

import { createClient } from "@/lib/supabase/server";
import { leistungCategorySchema, leistungSchema } from "@/lib/validations/leistung";
import type { Leistung, LeistungCategory } from "@/types";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function mapRowToLeistungCategory(row: Record<string, unknown>): LeistungCategory {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRowToLeistung(row: Record<string, unknown>): Leistung {
  const inv = row.inventory_items as Record<string, unknown> | null;
  const rawType = row.leistung_type as string | undefined;
  const leistungType =
    rawType && ["bestattungsart", "ausstattung_sarg", "ausstattung_urne", "rahmen", "sonstiges"].includes(rawType)
      ? (rawType as Leistung["leistungType"])
      : "sonstiges";
  const rawPriceType = row.price_type as string | undefined;
  const priceType =
    rawPriceType && ["fixed", "per_unit", "min_price", "on_request"].includes(rawPriceType)
      ? (rawPriceType as Leistung["priceType"])
      : "fixed";

  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    priceCents: (row.price_cents as number) ?? 0,
    priceType,
    unitLabel: (row.unit_label as string) ?? null,
    parentId: (row.parent_id as string) ?? null,
    imageStoragePath: (row.image_storage_path as string) ?? null,
    isPublic: (row.is_public as boolean) ?? false,
    leistungType,
    categoryId: (row.category_id as string) ?? null,
    inventoryItemId: (row.inventory_item_id as string) ?? null,
    parameters: (row.parameters as Record<string, string | number | boolean>) ?? {},
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    category: row.leistung_categories
      ? mapRowToLeistungCategory(row.leistung_categories as Record<string, unknown>)
      : null,
    inventoryItem: inv
      ? {
          id: inv.id as string,
          title: inv.title as string,
          description: (inv.description as string) ?? null,
          imageStoragePath: (inv.image_storage_path as string) ?? null,
          priceCents: (inv.price_cents as number) ?? null,
        } as Leistung["inventoryItem"]
      : null,
  } as Leistung;
}

export async function getLeistungCategories(): Promise<LeistungCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leistung_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRowToLeistungCategory(r as Record<string, unknown>));
}

export async function getLeistungen(filters?: {
  categoryId?: string;
  isPublic?: boolean;
}): Promise<Leistung[]> {
  const supabase = await createClient();
  let query = supabase
    .from("leistungen")
    .select(
      `
      *,
      leistung_categories(*),
      inventory_items(id, title, description, image_storage_path, price_cents)
    `
    )
    .order("sort_order", { ascending: true });

  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.isPublic !== undefined) query = query.eq("is_public", filters.isPublic);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRowToLeistung(r as Record<string, unknown>));
}

export async function getLeistungenGroupedByCategory(filters?: {
  isPublic?: boolean;
}): Promise<{ category: LeistungCategory; leistungen: Leistung[] }[]> {
  const categories = await getLeistungCategories();
  const leistungen = await getLeistungen({ isPublic: filters?.isPublic });
  return categories.map((category) => ({
    category,
    leistungen: leistungen.filter((l) => l.categoryId === category.id),
  }));
}

export async function getLeistungById(id: string): Promise<Leistung | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leistungen")
    .select(
      `
      *,
      leistung_categories(*),
      inventory_items(id, title, description, image_storage_path, price_cents)
    `
    )
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapRowToLeistung(data as Record<string, unknown>);
}

export async function createLeistungCategoryAction(
  formData: FormData
): Promise<ActionResult<LeistungCategory>> {
  const parsed = leistungCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    sortOrder: formData.get("sortOrder")
      ? parseInt(formData.get("sortOrder") as string, 10)
      : undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validierungsfehler" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leistung_categories")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      sort_order: parsed.data.sortOrder ?? 0,
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToLeistungCategory(data as Record<string, unknown>) };
}

export async function createLeistungAction(
  formData: FormData
): Promise<ActionResult<Leistung>> {
  const inventoryItemIdRaw = formData.get("inventoryItemId");
  const inventoryItemId =
    inventoryItemIdRaw && typeof inventoryItemIdRaw === "string" && inventoryItemIdRaw && inventoryItemIdRaw !== "__none__"
      ? inventoryItemIdRaw
      : null;

  let priceCents = formData.get("priceCents")
    ? parseInt(formData.get("priceCents") as string, 10)
    : 0;

  const supabase = await createClient();
  if (inventoryItemId) {
    const { data: item } = await supabase
      .from("inventory_items")
      .select("price_cents")
      .eq("id", inventoryItemId)
      .single();
    if (item?.price_cents != null) {
      priceCents = item.price_cents;
    }
  }

  const parentIdRaw = formData.get("parentId");
  const parentId =
    parentIdRaw && typeof parentIdRaw === "string" && parentIdRaw && parentIdRaw !== "__none__"
      ? parentIdRaw
      : null;

  const parsed = leistungSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priceCents,
    priceType: formData.get("priceType") || "fixed",
    unitLabel: formData.get("unitLabel") || null,
    parentId,
    imageStoragePath: formData.get("imageStoragePath") || null,
    isPublic: formData.get("isPublic") === "true" || formData.get("isPublic") === "on",
    leistungType: formData.get("leistungType") || "sonstiges",
    categoryId: formData.get("categoryId") || null,
    inventoryItemId,
    parameters: (() => {
      const p = formData.get("parameters");
      if (!p || typeof p !== "string") return undefined;
      try {
        return JSON.parse(p) as Record<string, string | number | boolean>;
      } catch {
        return undefined;
      }
    })(),
    sortOrder: formData.get("sortOrder")
      ? parseInt(formData.get("sortOrder") as string, 10)
      : 0,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validierungsfehler" };
  }
  const { data, error } = await supabase
    .from("leistungen")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      price_cents: parsed.data.priceCents,
      price_type: parsed.data.priceType,
      unit_label: parsed.data.unitLabel ?? null,
      parent_id: parsed.data.parentId ?? null,
      image_storage_path: parsed.data.imageStoragePath ?? null,
      is_public: parsed.data.isPublic,
      leistung_type: parsed.data.leistungType,
      category_id: parsed.data.categoryId ?? null,
      inventory_item_id: parsed.data.inventoryItemId ?? null,
      parameters: parsed.data.parameters ?? {},
      sort_order: parsed.data.sortOrder ?? 0,
    })
    .select(
      "*, leistung_categories(*), inventory_items(id, title, description, image_storage_path, price_cents)"
    )
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToLeistung(data as Record<string, unknown>) };
}

export async function updateLeistungAction(
  id: string,
  formData: FormData
): Promise<ActionResult<Leistung>> {
  const inventoryItemIdRaw = formData.get("inventoryItemId");
  const inventoryItemId =
    inventoryItemIdRaw && typeof inventoryItemIdRaw === "string" && inventoryItemIdRaw && inventoryItemIdRaw !== "__none__"
      ? inventoryItemIdRaw
      : null;

  let priceCents = formData.get("priceCents")
    ? parseInt(formData.get("priceCents") as string, 10)
    : 0;

  const supabase = await createClient();
  if (inventoryItemId) {
    const { data: item } = await supabase
      .from("inventory_items")
      .select("price_cents")
      .eq("id", inventoryItemId)
      .single();
    if (item?.price_cents != null) {
      priceCents = item.price_cents;
    }
  }

  const parentIdRaw = formData.get("parentId");
  const parentId =
    parentIdRaw && typeof parentIdRaw === "string" && parentIdRaw && parentIdRaw !== "__none__"
      ? parentIdRaw
      : null;

  const parsed = leistungSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priceCents,
    priceType: formData.get("priceType") || "fixed",
    unitLabel: formData.get("unitLabel") || null,
    parentId,
    imageStoragePath: formData.get("imageStoragePath") || null,
    isPublic: formData.get("isPublic") === "true" || formData.get("isPublic") === "on",
    leistungType: formData.get("leistungType") || "sonstiges",
    categoryId: formData.get("categoryId") || null,
    inventoryItemId,
    parameters: (() => {
      const p = formData.get("parameters");
      if (!p || typeof p !== "string") return undefined;
      try {
        return JSON.parse(p) as Record<string, string | number | boolean>;
      } catch {
        return undefined;
      }
    })(),
    sortOrder: formData.get("sortOrder")
      ? parseInt(formData.get("sortOrder") as string, 10)
      : 0,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validierungsfehler" };
  }
  const { data, error } = await supabase
    .from("leistungen")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      price_cents: parsed.data.priceCents,
      price_type: parsed.data.priceType,
      unit_label: parsed.data.unitLabel ?? null,
      parent_id: parsed.data.parentId ?? null,
      image_storage_path: parsed.data.imageStoragePath ?? null,
      is_public: parsed.data.isPublic,
      leistung_type: parsed.data.leistungType,
      category_id: parsed.data.categoryId ?? null,
      inventory_item_id: parsed.data.inventoryItemId ?? null,
      parameters: parsed.data.parameters ?? {},
      sort_order: parsed.data.sortOrder ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(
      "*, leistung_categories(*), inventory_items(id, title, description, image_storage_path, price_cents)"
    )
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToLeistung(data as Record<string, unknown>) };
}

export async function deleteLeistungAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("leistungen").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function insertCaseLeistungen(
  caseId: string,
  items: { leistungId: string; quantity?: number }[]
): Promise<ActionResult> {
  if (items.length === 0) return { success: true };
  const supabase = await createClient();
  const rows = items.map(({ leistungId, quantity }) => ({
    case_id: caseId,
    leistung_id: leistungId,
    quantity: quantity ?? 1,
  }));
  const { error } = await supabase.from("case_leistungen").insert(rows);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
