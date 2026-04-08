import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listGeminiSkills,
  syncGeminiSkills,
} from "@yantra/adapter-gemini-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("gemini local skill sync", () => {
  const yantraKey = "yantraai/yantra/yantra";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Yantra skills and installs them into the Gemini skills home", async () => {
    const home = await makeTempDir("yantra-gemini-skill-sync-");
    cleanupDirs.add(home);

    const ctx = {
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "gemini_local",
      config: {
        env: {
          HOME: home,
        },
        yantraSkillSync: {
          desiredSkills: [yantraKey],
        },
      },
    } as const;

    const before = await listGeminiSkills(ctx);
    expect(before.mode).toBe("persistent");
    expect(before.desiredSkills).toContain(yantraKey);
    expect(before.entries.find((entry) => entry.key === yantraKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === yantraKey)?.state).toBe("missing");

    const after = await syncGeminiSkills(ctx, [yantraKey]);
    expect(after.entries.find((entry) => entry.key === yantraKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".gemini", "skills", "yantra"))).isSymbolicLink()).toBe(true);
  });

  it("keeps required bundled Yantra skills installed even when the desired set is emptied", async () => {
    const home = await makeTempDir("yantra-gemini-skill-prune-");
    cleanupDirs.add(home);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "gemini_local",
      config: {
        env: {
          HOME: home,
        },
        yantraSkillSync: {
          desiredSkills: [yantraKey],
        },
      },
    } as const;

    await syncGeminiSkills(configuredCtx, [yantraKey]);

    const clearedCtx = {
      ...configuredCtx,
      config: {
        env: {
          HOME: home,
        },
        yantraSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncGeminiSkills(clearedCtx, []);
    expect(after.desiredSkills).toContain(yantraKey);
    expect(after.entries.find((entry) => entry.key === yantraKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".gemini", "skills", "yantra"))).isSymbolicLink()).toBe(true);
  });
});
