import type { TrustCard, Finding, PermissionManifest, ProvenanceInfo, TrustScore, CapabilityType, Severity } from "../types/index.js";

export function buildTrustCard(options: {
  capabilityType: CapabilityType;
  name: string;
  version?: string;
  description?: string;
  repository?: string;
  language?: string;
  findings: Finding[];
  permissions: PermissionManifest;
  provenance: ProvenanceInfo;
  trustScore: TrustScore;
}): TrustCard {
  const findingsBySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };

  for (const f of options.findings) {
    findingsBySeverity[f.severity]++;
  }

  const tags: string[] = [options.capabilityType];
  if (options.permissions.shell) tags.push("shell-access");
  if (options.permissions.canMakeHTTPRequests) tags.push("network-egress");
  if (options.permissions.canAccessBrowser) tags.push("browser-automation");
  if (options.permissions.humanApprovalRequired.length > 0) tags.push("human-in-loop");
  if (options.trustScore.grade === "A") tags.push("gold-certified");

  return {
    schema: "agenttrust/trust-card/v1",
    generatedAt: new Date().toISOString(),
    agenttrustVersion: "0.1.0",
    subject: {
      type: options.capabilityType,
      name: options.name,
      version: options.version || "0.1.0",
      description: options.description || "",
      repository: options.repository,
      language: options.language
    },
    provenance: options.provenance,
    permissions: options.permissions,
    security: {
      findings: options.findings,
      findingsBySeverity,
      totalFindings: options.findings.length,
      criticalCount: findingsBySeverity.critical,
      highCount: findingsBySeverity.high
    },
    dependencies: {
      total: 0,
      vulnerable: 0,
      critical: 0,
      list: []
    },
    trustScore: options.trustScore,
    compatibility: [
      "claude-code",
      "cursor",
      "openclaw",
      "mcp-host",
      "langgraph"
    ],
    tags
  };
}
