import { z } from "zod";

const marketplaces = ["AMAZON", "WALMART", "EBAY", "SHOPIFY", "VEEQO"] as const;
const statuses = ["NEW", "READY_TO_PICK", "PICKING", "PACKED", "SHIPPED", "CANCELLED"] as const;

export const createOrderSchema = z.object({
  marketplace: z.enum(marketplaces),
  orderNumber: z.string().min(1).max(100),
  externalOrderId: z.string().max(200).optional(),
  trackingNumber: z.string().max(200).optional(),
  carrier: z.string().max(100).optional(),
  status: z.enum(statuses).default("NEW"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        listingId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export const updateOrderSchema = z.object({
  status: z.enum(statuses).optional(),
  trackingNumber: z.string().max(200).optional(),
  carrier: z.string().max(100).optional(),
  externalOrderId: z.string().max(200).optional(),
});

export const searchOrdersSchema = z.object({
  query: z.string().min(3).optional(),
  status: z.enum(statuses).optional(),
  marketplace: z.enum(marketplaces).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type SearchOrdersInput = z.infer<typeof searchOrdersSchema>;
