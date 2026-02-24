"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  inventoryCategorySchema,
  inventoryLocationSchema,
  inventoryItemSchema,
  scanRecordSchema,
} from "@/lib/validations/inventory";
import type {
  InventoryCategory,
  InventoryItem,
  InventoryLocation,
  InventoryScan,
  QrCode,
} from "@/types";

function generateQrId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  for (let i = 0; i < 12; i++) {
    result += chars[bytes[i]! % chars.length];
  }
  return result;
}

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// Categories
export async function getCategories(): Promise<InventoryCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_categories")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryCategory[];
}

export async function createCategoryAction(
  formData: FormData
): Promise<ActionResult<InventoryCategory>> {
  const parsed = inventoryCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validierungsfehler" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_categories")
    .insert(parsed.data)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as InventoryCategory };
}

// Locations
export async function getLocations(): Promise<InventoryLocation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_locations")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryLocation[];
}

export async function createLocationAction(
  formData: FormData
): Promise<ActionResult<InventoryLocation>> {
  const parsed = inventoryLocationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validierungsfehler" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_locations")
    .insert(parsed.data)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as InventoryLocation };
}

// Items
export async function getInventoryItems(filters?: {
  status?: string;
  categoryId?: string;
  locationId?: string;
  caseId?: string;
  assignedOnly?: boolean;
}): Promise<InventoryItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("inventory_items")
    .select(`
      *,
      inventory_categories(*),
      inventory_locations(*),
      qr_codes(*)
    `)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.locationId) query = query.eq("location_id", filters.locationId);
  if (filters?.caseId) query = query.eq("case_id", filters.caseId);
  if (filters?.assignedOnly) query = query.not("case_id", "is", null);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => mapRowToInventoryItem(row));
}

export async function getInventoryItemById(
  itemId: string
): Promise<InventoryItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select(`
      *,
      inventory_categories(*),
      inventory_locations(*),
      qr_codes(*)
    `)
    .eq("id", itemId)
    .single();
  if (error || !data) return null;
  return mapRowToInventoryItem(data as Record<string, unknown>);
}

function mapRowToInventoryItem(row: Record<string, unknown>): InventoryItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    sequentialId: row.sequential_id,
    categoryId: row.category_id,
    locationId: row.location_id,
    caseId: row.case_id ?? null,
    assignedAt: row.assigned_at ?? null,
    deliveryStatus: (row.delivery_status as InventoryItem["deliveryStatus"]) ?? null,
    priceCents: row.price_cents ?? null,
    imageStoragePath: row.image_storage_path ?? null,
    parameters: (row.parameters as Record<string, string | number | boolean>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.inventory_categories ?? row.category ?? null,
    location: row.inventory_locations ?? row.location ?? null,
    qrCodes: Array.isArray(row.qr_codes) ? row.qr_codes : [],
  } as InventoryItem;
}

export async function createInventoryItemAction(
  formData: FormData
): Promise<ActionResult<InventoryItem>> {
  const priceVal = formData.get("priceCents");
  const parametersRaw = formData.get("parameters");
  const parameters =
    parametersRaw && typeof parametersRaw === "string"
      ? (() => {
          try {
            return JSON.parse(parametersRaw) as Record<string, string | number | boolean>;
          } catch {
            return {};
          }
        })()
      : undefined;

  const parsed = inventoryItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "in_stock",
    categoryId: formData.get("categoryId") || null,
    locationId: formData.get("locationId") || null,
    priceCents: priceVal ? parseInt(String(priceVal), 10) : null,
    imageStoragePath: formData.get("imageStoragePath") || null,
    parameters,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validierungsfehler" };
  }
  const supabase = await createClient();
  const { count } = await supabase
    .from("inventory_items")
    .select("*", { count: "exact", head: true });
  const nextSeq = (count ?? 0) + 1;
  const sequentialId = `INV-${String(nextSeq).padStart(4, "0")}`;

  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
      category_id: parsed.data.categoryId ?? null,
      location_id: parsed.data.locationId ?? null,
      price_cents: parsed.data.priceCents ?? null,
      image_storage_path: parsed.data.imageStoragePath ?? null,
      parameters: parsed.data.parameters ?? {},
      sequential_id: sequentialId,
    })
    .select("*, inventory_categories(*), inventory_locations(*), qr_codes(*)")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToInventoryItem(data as Record<string, unknown>) };
}

export async function updateInventoryItemAction(
  itemId: string,
  formData: FormData
): Promise<ActionResult<InventoryItem>> {
  const priceVal = formData.get("priceCents");
  const parametersRaw = formData.get("parameters");
  const parameters =
    parametersRaw && typeof parametersRaw === "string"
      ? (() => {
          try {
            return JSON.parse(parametersRaw) as Record<string, string | number | boolean>;
          } catch {
            return {};
          }
        })()
      : undefined;

  const parsed = inventoryItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "in_stock",
    categoryId: formData.get("categoryId") || null,
    locationId: formData.get("locationId") || null,
    caseId: formData.get("caseId") || null,
    deliveryStatus: formData.get("deliveryStatus") || null,
    priceCents: priceVal ? parseInt(String(priceVal), 10) : null,
    imageStoragePath: formData.get("imageStoragePath") || null,
    parameters,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validierungsfehler" };
  }
  const supabase = await createClient();
  const updatePayload: Record<string, unknown> = {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    category_id: parsed.data.categoryId ?? null,
    location_id: parsed.data.locationId ?? null,
    case_id: parsed.data.caseId ?? null,
    delivery_status: parsed.data.deliveryStatus ?? null,
    price_cents: parsed.data.priceCents ?? null,
    image_storage_path: parsed.data.imageStoragePath ?? null,
    parameters: parsed.data.parameters ?? {},
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.caseId) {
    updatePayload.assigned_at = new Date().toISOString();
  } else {
    updatePayload.assigned_at = null;
  }
  const { data, error } = await supabase
    .from("inventory_items")
    .update(updatePayload)
    .eq("id", itemId)
    .select("*, inventory_categories(*), inventory_locations(*), qr_codes(*)")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToInventoryItem(data as Record<string, unknown>) };
}

export async function assignInventoryItemToCaseAction(
  itemId: string,
  caseId: string | null,
  deliveryStatus?: "reserved" | "assigned" | "delivered" | null
): Promise<ActionResult<InventoryItem>> {
  const supabase = await createClient();
  const update: Record<string, unknown> = {
    case_id: caseId ?? null,
    assigned_at: caseId ? new Date().toISOString() : null,
    delivery_status: deliveryStatus ?? null,
    updated_at: new Date().toISOString(),
  };
  if (caseId) {
    update.status = "in_use";
  } else {
    update.status = "in_stock";
  }
  const { data, error } = await supabase
    .from("inventory_items")
    .update(update)
    .eq("id", itemId)
    .select("*, inventory_categories(*), inventory_locations(*), qr_codes(*)")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: mapRowToInventoryItem(data as Record<string, unknown>) };
}

export async function deleteInventoryItemAction(
  itemId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").delete().eq("id", itemId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadProductImage(
  formData: FormData
): Promise<ActionResult<{ storagePath: string }>> {
  const file = formData.get("file") as File | null;
  if (!file || !file.size) {
    return { success: false, error: "Keine Datei ausgewählt" };
  }
  if (!IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: "Nur Bildformate (JPEG, PNG, WebP, GIF) erlaubt" };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { success: false, error: "Datei maximal 5 MB" };
  }
  const admin = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `products/${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage
    .from("product-images")
    .upload(storagePath, file, { upsert: false });
  if (error) {
    console.error("uploadProductImage error:", error);
    return { success: false, error: error.message };
  }
  return { success: true, data: { storagePath } };
}

// QR Codes
export async function createQrCodeAction(
  itemId: string
): Promise<ActionResult<QrCode>> {
  const supabase = await createClient();
  const qrId = generateQrId();
  const { data, error } = await supabase
    .from("qr_codes")
    .insert({ id: qrId, inventory_item_id: itemId })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return {
    success: true,
    data: {
      id: data.id,
      inventoryItemId: data.inventory_item_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as QrCode,
  };
}

export async function linkQrToItemAction(
  qrId: string,
  itemId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("qr_codes")
    .update({ inventory_item_id: itemId, updated_at: new Date().toISOString() })
    .eq("id", qrId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getQrByItemId(itemId: string): Promise<QrCode | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("inventory_item_id", itemId)
    .limit(1)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    inventoryItemId: data.inventory_item_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getQrById(qrId: string): Promise<{
  id: string;
  inventoryItemId: string | null;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("qr_codes")
    .select("id, inventory_item_id")
    .eq("id", qrId)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    inventoryItemId: data.inventory_item_id,
  };
}

// Scans - can be called from public route (anon)
export async function recordScanAction(
  params: { qrId: string; userAgent?: string; latitude?: string; longitude?: string }
): Promise<ActionResult<{ scanId: string }>> {
  const parsed = scanRecordSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validierungsfehler" };
  }
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("inventory_scans")
    .insert({
      qr_code_id: parsed.data.qrId,
      user_agent: parsed.data.userAgent ?? null,
      scanned_by: session?.user?.id ?? null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    })
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: { scanId: data.id } };
}

export async function getScansByItemId(itemId: string): Promise<InventoryScan[]> {
  const supabase = await createClient();
  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("id")
    .eq("inventory_item_id", itemId);
  if (!qrCodes?.length) return [];
  const qrIds = qrCodes.map((q) => q.id);
  const { data, error } = await supabase
    .from("inventory_scans")
    .select("*")
    .in("qr_code_id", qrIds)
    .order("scanned_at", { ascending: false })
    .limit(50);
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    qrCodeId: row.qr_code_id,
    userAgent: row.user_agent,
    scannedBy: row.scanned_by,
    latitude: row.latitude,
    longitude: row.longitude,
    scannedAt: row.scanned_at,
  })) as InventoryScan[];
}
