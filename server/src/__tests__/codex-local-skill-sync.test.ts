import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listCodexSkills,
  syncCodexSkills,
} from "@yantra/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("codex local skill sync", () => {
  const yantraKey = "yantraai/yantra/yantra";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Yantra skills for workspace injection on the next run", async () => {
    const codexHome = await makeTempDir("yantra-codex-skill-sync-");
    cleanupDirs.add(codexHome);

    const ctx = {
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        yantraSkillSync: {
          desiredSkills: [yantraKey],
        },
      },
    } as const;

    const before = await listCodexSkills(ctx);
    expect(before.mode).toBe("ephemeral");
    expect(before.desiredSkills).toContain(yantraKey);
    expect(before.entries.find((entry) => entry.key === yantraKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === yantraKey)?.state).toBe("configured");
    expect(before.entries.find((entry) => entry.key === yantraKey)?.detail).toContain("CODEX_HOME/skills/");
  });

  it("does not persist Yantra skills into CODEX_HOME during sync", async () => {
    const codexHome = await makeTempDir("yantra-codex-skill-prune-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        yantraSkillSync: {
          desiredSkills: [yantraKey],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, [yantraKey]);
    expect(after.mode).toBe("ephemeral");
    expect(after.entries.find((entry) => entry.key === yantraKey)?.state).toBe("configured");
    await expect(fs.lstat(path.join(codexHome, "skills", "yantra"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("keeps required bundled Yantra skills configured even when the desired set is emptied", async () => {
    const codexHome = await makeTempDir("yantra-codex-skill-required-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        yantraSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, []);
    expect(after.desiredSkills).toContain(yantraKey);
    expect(after.entries.find((entry) => entry.key === yantraKey)?.state).toBe("configured");
  });

  it("normalizes legacy flat Yantra skill refs before reporting configured state", async () => {
    const codexHome = await makeTempDir("yantra-codex-legacy-skill-sync-");
    cleanupDirs.add(codexHome);

    const snapshot = await listCodexSkills({
      agentId: "agent-3",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        yantraSkillSync: {
          desiredSkills: ["yantra"],
        },
      },
    });

    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.desiredSkills).toContain(yantraKey);
    expect(snapshot.desiredSkills).not.toContain("yantra");
    expect(snapshot.entries.find((entry) => entry.key === yantraKey)?.state).toBe("configured");
    expect(snapshot.entries.find((entry) => entry.key === "yantra")).toBeUndefined();
  });
});
