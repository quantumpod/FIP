import { z } from "zod";

export const createReceivingOrderSchema = z.object({
  warehouseId: z.string().min(1),
  poNumber: z.string().min(1).max(100),
  supplier: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        expectedQty: z.number().int().positive(),
        lotNumber: z.string().max(100).optional(),
        expiresAt: z.string().datetime().optional(),
      })
    )
    .min(1),
});

export const receiveItemSchema = z.object({
  itemId: z.string().min(1),
  receivedQty: z.number().int().min(0),
});

export const completeReceivingSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      receivedQty: z.number().int().min(0),
    })
  ),
});

export const createPutawayTaskSchema = z.object({
  receivingOrderId: z.string().min(1),
});

export const updatePutawayItemSchema = z.object({
  putawayQty: z.number().int().min(0),
});

export const createCycleCountSchema = z.object({
  warehouseId: z.string().min(1),
  locationIds: z.array(z.string().min(1)).min(1),
  notes: z.string().max(1000).optional(),
});

export const submitCycleCountItemSchema = z.object({
  countedQty: z.number().int().min(0),
});

export const createPalletSchema = z.object({
  warehouseId: z.string().min(1),
  code: z.string().min(1).max(100),
  locationId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const addPalletItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  lotNumber: z.string().max(100).optional(),
});

export const searchReceivingSchema = z.object({
  query: z.string().min(3).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
