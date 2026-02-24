"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "./employees";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function requireEmployee() {
  const employee = await getCurrentEmployee();
  if (!employee) {
    throw new Error("Nur Mitarbeiter können diese Aktion ausführen.");
  }
  return employee;
}

export type FamilyPhotoResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteFamilyPhoto(
  photoId: string,
  storagePath: string
): Promise<FamilyPhotoResult> {
  try {
    await requireEmployee();
    const admin = createAdminClient();

    const { error: dbError } = await admin
      .from("family_photos")
      .delete()
      .eq("id", photoId);

    if (dbError) {
      console.error("deleteFamilyPhoto DB error:", dbError);
      return { success: false, error: dbError.message };
    }

    const { error: storageError } = await admin.storage
      .from("family-files")
      .remove([storagePath]);

    if (storageError) {
      console.error("deleteFamilyPhoto storage error:", storageError);
      // DB already updated - log but don't fail
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function updateFamilyPhoto(
  photoId: string,
  data: { caption?: string | null; uploaded_by_name?: string }
): Promise<FamilyPhotoResult> {
  try {
    await requireEmployee();
    const admin = createAdminClient();

    const updates: Record<string, string | null> = {};
    if (data.caption !== undefined) updates.caption = data.caption;
    if (data.uploaded_by_name !== undefined)
      updates.uploaded_by_name = data.uploaded_by_name;

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    const { error } = await admin
      .from("family_photos")
      .update(updates)
      .eq("id", photoId);

    if (error) {
      console.error("updateFamilyPhoto error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function uploadFamilyPhoto(
  caseId: string,
  formData: FormData
): Promise<FamilyPhotoResult & { photoId?: string }> {
  try {
    await requireEmployee();
    const admin = createAdminClient();

    const file = formData.get("file") as File | null;
    const uploadedByName =
      (formData.get("uploaded_by_name") as string)?.trim() || "Team";
    const caption = (formData.get("caption") as string)?.trim() || null;

    if (!file || !(file instanceof File)) {
      return { success: false, error: "Keine Datei ausgewählt." };
    }

    if (!IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Nur Bilder (JPG, PNG, WebP, GIF) sind erlaubt.",
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "Max. 10MB pro Bild." };
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const storagePath = `${caseId}/photos/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await admin.storage
      .from("family-files")
      .upload(storagePath, file);

    if (uploadError) {
      console.error("uploadFamilyPhoto storage error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: photoData, error: insertError } = await admin
      .from("family_photos")
      .insert({
        case_id: caseId,
        storage_path: storagePath,
        uploaded_by_name: uploadedByName,
        caption,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("uploadFamilyPhoto insert error:", insertError);
      await admin.storage.from("family-files").remove([storagePath]);
      return { success: false, error: insertError.message };
    }

    return { success: true, photoId: photoData.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}
