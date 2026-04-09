import { z } from "zod";
import { MEMORY_CATEGORIES } from "../constants.js";

export const createMemorySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(MEMORY_CATEGORIES).optional().default("general"),
  sourceAgentId: z.string().uuid().optional().nullable(),
  tags: z.string().optional().nullable(),
});

export type CreateMemory = z.infer<typeof createMemorySchema>;

export const updateMemorySchema = createMemorySchema.partial();

export type UpdateMemory = z.infer<typeof updateMemorySchema>;
