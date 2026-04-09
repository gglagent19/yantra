import { Router } from "express";
import type { Db } from "@yantra/db";
import { createMemorySchema, updateMemorySchema } from "@yantra/shared";
import { validate } from "../middleware/validate.js";
import { memoryService, logActivity } from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";

export function memoryRoutes(db: Db) {
  const router = Router();
  const svc = memoryService(db);

  router.get("/companies/:companyId/memories", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    if (search) {
      const result = await svc.search(companyId, search);
      res.json(result);
      return;
    }
    if (category) {
      const result = await svc.listByCategory(companyId, category);
      res.json(result);
      return;
    }
    const result = await svc.list(companyId);
    res.json(result);
  });

  router.get("/memories/:id", async (req, res) => {
    const id = req.params.id as string;
    const memory = await svc.getById(id);
    if (!memory) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }
    assertCompanyAccess(req, memory.companyId);
    res.json(memory);
  });

  router.post("/companies/:companyId/memories", validate(createMemorySchema), async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const memory = await svc.create(companyId, req.body);
    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "memory.created",
      entityType: "memory",
      entityId: memory.id,
      details: { title: memory.title, category: memory.category },
    });
    res.status(201).json(memory);
  });

  router.patch("/memories/:id", validate(updateMemorySchema), async (req, res) => {
    const id = req.params.id as string;
    const existing = await svc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    const memory = await svc.update(id, req.body);
    if (!memory) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }
    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: memory.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "memory.updated",
      entityType: "memory",
      entityId: memory.id,
      details: req.body,
    });
    res.json(memory);
  });

  router.delete("/memories/:id", async (req, res) => {
    const id = req.params.id as string;
    const existing = await svc.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    const memory = await svc.remove(id);
    if (!memory) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }
    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: memory.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "memory.deleted",
      entityType: "memory",
      entityId: memory.id,
    });
    res.json(memory);
  });

  return router;
}
