import { z } from "zod";

export const createLocationSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  code: z.string().min(1).max(50),
  zone: z.string().max(50).optional(),
  aisle: z.string().max(50).optional(),
  rack: z.string().max(50).optional(),
  bin: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
});

export const updateLocationSchema = createLocationSchema.partial().omit({ warehouseId: true });

export const searchLocationsSchema = z.object({
  query: z.string().min(3).optional(),
  warehouseId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const adjustInventorySchema = z.object({
  productId: z.string().min(1),
  locationId: z.string().min(1),
  onHand: z.number().int().min(0),
  allocated: z.number().int().min(0).optional(),
  lotNumber: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const searchInventorySchema = z.object({
  query: z.string().min(3).optional(),
  locationId: z.string().optional(),
  productId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type SearchLocationsInput = z.infer<typeof searchLocationsSchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
export type SearchInventoryInput = z.infer<typeof searchInventorySchema>;
