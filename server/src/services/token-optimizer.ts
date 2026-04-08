import fs from "node:fs/promises";
import path from "node:path";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@yantra/db";
import { heartbeatRuns, issues } from "@yantra/db";
import { resolveManagedAgentMemoryDir } from "../home-paths.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskPattern {
  fingerprint: string;
  taskKey: string | null;
  issueTitle: string | null;
  lastSeenAt: string;
  runCount: number;
  runs: Array<{
    runId: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    durationMs: number;
    completedAt: string;
  }>;
}

export interface OptimizationHint {
  fingerprint: string;
  previousRunCount: number;
  avgTokens: number;
  bestTokens: number;
  avgDurationMs: number;
  bestDurationMs: number;
  actionSummary: string | null;
}

export interface OptimizationResult {
  fingerprint: string;
  currentTokens: number;
  currentDurationMs: number;
  previousAvgTokens: number;
  previousBestTokens: number;
  previousAvgDurationMs: number;
  tokensSaved: number;
  tokensSavedPercent: number;
  timeSavedMs: number;
  timeSavedPercent: number;
  runNumber: number;
  improved: boolean;
}

// ---------------------------------------------------------------------------
// Fingerprinting
// ---------------------------------------------------------------------------

function deriveTaskFingerprint(context: {
  taskKey: string | null;
  issueTitle: string | null;
  agentId: string;
}): string {
  const parts = [context.agentId];
  if (context.taskKey) {
    parts.push(`task:${context.taskKey}`);
  }
  if (context.issueTitle) {
    // Normalize title: lowercase, remove IDs/numbers, collapse spaces
    const normalized = context.issueTitle
      .toLowerCase()
      .replace(/[A-Z]+-\d+/gi, "")
      .replace(/\b\d+\b/g, "N")
      .replace(/\s+/g, " ")
      .trim();
    parts.push(`title:${normalized}`);
  }
  return parts.join("|");
}

// ---------------------------------------------------------------------------
// Memory file helpers
// ---------------------------------------------------------------------------

const OPTIMIZER_FILE = "token_optimizer.json";

async function readOptimizerData(
  agentId: string,
  companyId: string,
): Promise<Record<string, TaskPattern>> {
  const memoryDir = resolveManagedAgentMemoryDir(agentId, companyId);
  const filePath = path.resolve(memoryDir, OPTIMIZER_FILE);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as Record<string, TaskPattern>;
  } catch {
    return {};
  }
}

async function writeOptimizerData(
  agentId: string,
  companyId: string,
  data: Record<string, TaskPattern>,
): Promise<void> {
  const memoryDir = resolveManagedAgentMemoryDir(agentId, companyId);
  await fs.mkdir(memoryDir, { recursive: true });
  const filePath = path.resolve(memoryDir, OPTIMIZER_FILE);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const MAX_PATTERN_HISTORY = 20;

export function tokenOptimizerService(db: Db) {
  /**
   * Before execution: get optimization hints for a task based on history.
   */
  async function getOptimizationHint(input: {
    agentId: string;
    companyId: string;
    taskKey: string | null;
    issueId: string | null;
  }): Promise<OptimizationHint | null> {
    let issueTitle: string | null = null;
    if (input.issueId) {
      const issue = await db
        .select({ title: issues.title })
        .from(issues)
        .where(eq(issues.id, input.issueId))
        .then((rows) => rows[0] ?? null);
      issueTitle = issue?.title ?? null;
    }

    const fingerprint = deriveTaskFingerprint({
      taskKey: input.taskKey,
      issueTitle,
      agentId: input.agentId,
    });

    const patterns = await readOptimizerData(input.agentId, input.companyId);
    const pattern = patterns[fingerprint];
    if (!pattern || pattern.runs.length === 0) return null;

    const runs = pattern.runs;
    const avgTokens = Math.round(runs.reduce((s, r) => s + r.totalTokens, 0) / runs.length);
    const bestTokens = Math.min(...runs.map((r) => r.totalTokens));
    const avgDurationMs = Math.round(runs.reduce((s, r) => s + r.durationMs, 0) / runs.length);
    const bestDurationMs = Math.min(...runs.map((r) => r.durationMs));

    return {
      fingerprint,
      previousRunCount: runs.length,
      avgTokens,
      bestTokens,
      avgDurationMs,
      bestDurationMs,
      actionSummary: `This task has been run ${runs.length} time(s) before. Best: ${bestTokens} tokens in ${Math.round(bestDurationMs / 1000)}s. Avg: ${avgTokens} tokens.`,
    };
  }

  /**
   * After execution: record the run metrics and calculate optimization result.
   */
  async function recordRunAndCalculate(input: {
    agentId: string;
    companyId: string;
    runId: string;
    taskKey: string | null;
    issueId: string | null;
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
  }): Promise<OptimizationResult> {
    let issueTitle: string | null = null;
    if (input.issueId) {
      const issue = await db
        .select({ title: issues.title })
        .from(issues)
        .where(eq(issues.id, input.issueId))
        .then((rows) => rows[0] ?? null);
      issueTitle = issue?.title ?? null;
    }

    const fingerprint = deriveTaskFingerprint({
      taskKey: input.taskKey,
      issueTitle,
      agentId: input.agentId,
    });

    const patterns = await readOptimizerData(input.agentId, input.companyId);
    const existing = patterns[fingerprint] ?? {
      fingerprint,
      taskKey: input.taskKey,
      issueTitle,
      lastSeenAt: new Date().toISOString(),
      runCount: 0,
      runs: [],
    };

    const currentTokens = input.inputTokens + input.outputTokens;
    const previousRuns = existing.runs;
    const previousAvgTokens = previousRuns.length > 0
      ? Math.round(previousRuns.reduce((s, r) => s + r.totalTokens, 0) / previousRuns.length)
      : 0;
    const previousBestTokens = previousRuns.length > 0
      ? Math.min(...previousRuns.map((r) => r.totalTokens))
      : 0;
    const previousAvgDurationMs = previousRuns.length > 0
      ? Math.round(previousRuns.reduce((s, r) => s + r.durationMs, 0) / previousRuns.length)
      : 0;

    // Add current run
    existing.runs.push({
      runId: input.runId,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      totalTokens: currentTokens,
      durationMs: input.durationMs,
      completedAt: new Date().toISOString(),
    });

    // Keep only recent history
    if (existing.runs.length > MAX_PATTERN_HISTORY) {
      existing.runs = existing.runs.slice(-MAX_PATTERN_HISTORY);
    }

    existing.runCount += 1;
    existing.lastSeenAt = new Date().toISOString();
    patterns[fingerprint] = existing;
    await writeOptimizerData(input.agentId, input.companyId, patterns);

    const tokensSaved = previousAvgTokens > 0 ? previousAvgTokens - currentTokens : 0;
    const tokensSavedPercent = previousAvgTokens > 0
      ? Math.round((tokensSaved / previousAvgTokens) * 100)
      : 0;
    const timeSavedMs = previousAvgDurationMs > 0 ? previousAvgDurationMs - input.durationMs : 0;
    const timeSavedPercent = previousAvgDurationMs > 0
      ? Math.round((timeSavedMs / previousAvgDurationMs) * 100)
      : 0;

    return {
      fingerprint,
      currentTokens,
      currentDurationMs: input.durationMs,
      previousAvgTokens,
      previousBestTokens,
      previousAvgDurationMs,
      tokensSaved,
      tokensSavedPercent,
      timeSavedMs,
      timeSavedPercent,
      runNumber: existing.runCount,
      improved: tokensSaved > 0,
    };
  }

  /**
   * Build optimization context to inject into the agent's prompt context.
   * Tells the agent about past runs so it can skip exploration.
   */
  function buildOptimizationContext(hint: OptimizationHint): Record<string, unknown> {
    return {
      yantraOptimization: {
        isRepeatedTask: true,
        previousRunCount: hint.previousRunCount,
        avgTokens: hint.avgTokens,
        bestTokens: hint.bestTokens,
        avgDurationMs: hint.avgDurationMs,
        hint: `This is a repeated task (run #${hint.previousRunCount + 1}). Previous best used ${hint.bestTokens} tokens. Be efficient: skip exploration, use known paths, and minimize tool calls.`,
      },
    };
  }

  return {
    getOptimizationHint,
    recordRunAndCalculate,
    buildOptimizationContext,
  };
}
