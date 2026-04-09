import { eq, and, ilike } from "drizzle-orm";
import type { Db } from "@yantra/db";
import { memories } from "@yantra/db";

export function memoryService(db: Db) {
  return {
    list: (companyId: string) =>
      db.select().from(memories).where(eq(memories.companyId, companyId)),

    listByCategory: (companyId: string, category: string) =>
      db
        .select()
        .from(memories)
        .where(and(eq(memories.companyId, companyId), eq(memories.category, category))),

    search: (companyId: string, query: string) =>
      db
        .select()
        .from(memories)
        .where(
          and(
            eq(memories.companyId, companyId),
            ilike(memories.title, `%${query}%`),
          ),
        ),

    getById: (id: string) =>
      db
        .select()
        .from(memories)
        .where(eq(memories.id, id))
        .then((rows) => rows[0] ?? null),

    create: (companyId: string, data: Omit<typeof memories.$inferInsert, "companyId">) =>
      db
        .insert(memories)
        .values({ ...data, companyId })
        .returning()
        .then((rows) => rows[0]),

    update: (id: string, data: Partial<typeof memories.$inferInsert>) =>
      db
        .update(memories)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(memories.id, id))
        .returning()
        .then((rows) => rows[0] ?? null),

    remove: (id: string) =>
      db
        .delete(memories)
        .where(eq(memories.id, id))
        .returning()
        .then((rows) => rows[0] ?? null),
  };
}
