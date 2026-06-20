import { z } from "zod";

export const createProductSchema = z.object({
  masterSku: z.string().min(1, "Master SKU is required").max(100),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
  barcode: z.string().max(100).optional(),
  upc: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).default("ACTIVE"),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const searchProductsSchema = z.object({
  query: z.string().min(3, "Search requires at least 3 characters").optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type SearchProductsInput = z.infer<typeof searchProductsSchema>;
