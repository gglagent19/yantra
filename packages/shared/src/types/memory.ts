import type { MemoryCategory } from "../constants.js";

export interface Memory {
  id: string;
  companyId: string;
  title: string;
  content: string;
  category: MemoryCategory;
  sourceAgentId: string | null;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}
