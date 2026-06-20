import { z } from "zod";

const marketplaces = ["AMAZON", "WALMART", "EBAY", "SHOPIFY", "VEEQO"] as const;

export const createListingSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  marketplace: z.enum(marketplaces),
  sellerSku: z.string().min(1).max(200),
  asin: z.string().max(20).optional(),
  fnsku: z.string().max(20).optional(),
  externalId: z.string().max(200).optional(),
  bundleQty: z.number().int().positive().default(1),
});

export const updateListingSchema = createListingSchema.partial().omit({ productId: true });

export const searchListingsSchema = z.object({
  query: z.string().min(3).optional(),
  marketplace: z.enum(marketplaces).optional(),
  productId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type SearchListingsInput = z.infer<typeof searchListingsSchema>;
