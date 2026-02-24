/**
 * Build public URL for Supabase storage object.
 * Use for product-images and other public buckets.
 */
export function getProductImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath?.trim()) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/product-images/${storagePath}`;
}

export function getFamilyFileUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath?.trim()) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/family-files/${storagePath}`;
}
