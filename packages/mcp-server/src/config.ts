export interface YantraMcpConfig {
  apiUrl: string;
  apiKey: string;
  companyId: string | null;
  agentId: string | null;
  runId: string | null;
}

function nonEmpty(value: string | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function normalizeApiUrl(apiUrl: string): string {
  const trimmed = stripTrailingSlash(apiUrl.trim());
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export function readConfigFromEnv(env: NodeJS.ProcessEnv = process.env): YantraMcpConfig {
  const apiUrl = nonEmpty(env.YANTRA_API_URL);
  if (!apiUrl) {
    throw new Error("Missing YANTRA_API_URL");
  }
  const apiKey = nonEmpty(env.YANTRA_API_KEY);
  if (!apiKey) {
    throw new Error("Missing YANTRA_API_KEY");
  }

  return {
    apiUrl: normalizeApiUrl(apiUrl),
    apiKey,
    companyId: nonEmpty(env.YANTRA_COMPANY_ID),
    agentId: nonEmpty(env.YANTRA_AGENT_ID),
    runId: nonEmpty(env.YANTRA_RUN_ID),
  };
}
