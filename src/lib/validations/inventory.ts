import { z } from 'zod';

export const INVENTORY_STATUSES = ['in_stock', 'in_use', 'checked_out'] as const;

export const inventoryCategorySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const inventoryLocationSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional(),
});

export const DELIVERY_STATUSES = ['reserved', 'assigned', 'delivered'] as const;

export const inventoryItemSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  status: z.enum(INVENTORY_STATUSES),
  categoryId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  caseId: z.string().uuid().optional().nullable(),
  deliveryStatus: z.enum(DELIVERY_STATUSES).optional().nullable(),
});

export const qrCodeSchema = z.object({
  inventoryItemId: z.string().uuid(),
});

export const scanRecordSchema = z.object({
  qrId: z.string().min(1, 'QR-ID ist erforderlich'),
  userAgent: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export type InventoryCategoryFormData = z.infer<typeof inventoryCategorySchema>;
export type InventoryLocationFormData = z.infer<typeof inventoryLocationSchema>;
export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;
export type QrCodeFormData = z.infer<typeof qrCodeSchema>;
export type ScanRecordFormData = z.infer<typeof scanRecordSchema>;
