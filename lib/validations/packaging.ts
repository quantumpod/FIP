import { z } from "zod";

export const createPackagingRuleSchema = z.object({
  name: z.string().min(1).max(100),
  boxCode: z.string().min(1).max(50),
  productId: z.string().optional(),
  minQty: z.number().int().min(1).optional(),
  maxQty: z.number().int().min(1).optional(),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  weightLimit: z.number().positive().optional(),
});

export const updatePackagingRuleSchema = createPackagingRuleSchema.partial();

export const searchPackagingRulesSchema = z.object({
  query: z.string().min(3).optional(),
  productId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const recommendPackagingSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export type CreatePackagingRuleInput = z.infer<typeof createPackagingRuleSchema>;
export type UpdatePackagingRuleInput = z.infer<typeof updatePackagingRuleSchema>;
export type SearchPackagingRulesInput = z.infer<typeof searchPackagingRulesSchema>;
export type RecommendPackagingInput = z.infer<typeof recommendPackagingSchema>;
