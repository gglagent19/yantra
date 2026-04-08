import fs from "node:fs";
import { yantraConfigSchema, type YantraConfig } from "@yantra/shared";
import { resolveYantraConfigPath } from "./paths.js";

export function readConfigFile(): YantraConfig | null {
  const configPath = resolveYantraConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return yantraConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
