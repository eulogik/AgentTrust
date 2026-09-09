import type { CapabilityType } from "../types/index.js";

/** Hosts inferred from the detected artifact type — never a universal allowlist. */
export function inferCompatibility(type: CapabilityType): string[] {
  switch (type) {
    case "mcp-server":
      return ["mcp-host"];
    case "agent-skill":
      return ["claude-code", "cursor", "codex"];
    case "claude-config":
      return ["claude-code", "claude-desktop"];
    case "openclaw-plugin":
      return ["openclaw"];
    case "langgraph-agent":
      return ["langgraph"];
    case "generic-agent":
      return [];
    default:
      return [];
  }
}
