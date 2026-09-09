import fs from "node:fs";
import path from "node:path";
import type { Severity } from "../types/index.js";
import { isSeverity } from "../util/severity.js";

export interface AgentTrustConfig {
  version?: string;
  target?: string;
  failOn?: Severity;
  outputDir?: string;
  writeFiles?: boolean;
}

export function findConfigPath(cwd: string): string | undefined {
  const yaml = path.join(cwd, "agenttrust.yaml");
  const yml = path.join(cwd, "agenttrust.yml");
  if (fs.existsSync(yaml)) return yaml;
  if (fs.existsSync(yml)) return yml;
  return undefined;
}

/** Minimal key: value parser for the subset written by `agenttrust init`. */
export function parseAgentTrustConfig(raw: string): AgentTrustConfig {
  const cfg: AgentTrustConfig = {};
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z][\w]*)\s*:\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].replace(/^["']|["']$/g, "").trim();
    if (key === "version" && value) cfg.version = value;
    else if (key === "target" && value) cfg.target = value;
    else if (key === "failOn" && isSeverity(value)) cfg.failOn = value;
    else if (key === "outputDir" && value) cfg.outputDir = value;
    else if (key === "writeFiles") cfg.writeFiles = value === "true";
  }
  return cfg;
}

export function loadAgentTrustConfig(cwd: string): AgentTrustConfig {
  const file = findConfigPath(cwd);
  if (!file) return {};
  try {
    return parseAgentTrustConfig(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}
