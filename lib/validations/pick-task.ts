import { z } from "zod";

const statuses = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export const generatePickTaskSchema = z.object({
  orderId: z.string().min(1),
});

export const updatePickTaskSchema = z.object({
  status: z.enum(statuses),
});

export const updatePickTaskItemSchema = z.object({
  pickedQty: z.number().int().min(0),
});

export const searchPickTasksSchema = z.object({
  query: z.string().min(3).optional(),
  status: z.enum(statuses).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type GeneratePickTaskInput = z.infer<typeof generatePickTaskSchema>;
export type UpdatePickTaskInput = z.infer<typeof updatePickTaskSchema>;
export type UpdatePickTaskItemInput = z.infer<typeof updatePickTaskItemSchema>;
export type SearchPickTasksInput = z.infer<typeof searchPickTasksSchema>;
