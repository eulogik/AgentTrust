import type { TrustCard } from "../types/index.js";

export function generateMarkdownReport(card: TrustCard): string {
  const { subject, trustScore, security, permissions, provenance } = card;

  return `# AgentTrust Evaluation Report

> **Capability:** \`${subject.name}\` (${subject.type})  
> **Trust Grade:** **${trustScore.grade}** (${trustScore.overall}/100)  
> **Confidence:** ${trustScore.confidence.toUpperCase()}  
> **Date:** ${card.generatedAt}

---

## 🛡️ Trust Score Breakdown

| Category | Score | Status |
|---|---|---|
| **Security** | ${trustScore.breakdown.security}/100 | ${trustScore.breakdown.security >= 80 ? "✅ Healthy" : "⚠️ Risk Detected"} |
| **Permissions** | ${trustScore.breakdown.permissions}/100 | Scope: \`${permissions.estimatedScope}\` |
| **Provenance** | ${trustScore.breakdown.provenance}/100 | ${provenance.isVerified ? "Verified" : "Unverified"} |
| **Reliability** | ${trustScore.breakdown.reliability}/100 | Standard |
| **Stability** | ${trustScore.breakdown.stability}/100 | Lockfile: ${provenance.hasLockfile ? "Yes" : "No"} |

**Rationale:** ${trustScore.rationale}

---

## 🚨 Security Findings (${security.totalFindings} Total)

| Severity | Rule | Title | Location |
|---|---|---|---|
${security.findings.map(f => `| **${f.severity.toUpperCase()}** | \`${f.rule}\` | ${f.title} | \`${f.file || "global"}:${f.line || 1}\` |`).join("\n")}

---

## 🔑 Permissions Declared & Detected

- **Shell Execution:** ${permissions.shell ? "⚠️ Enabled (" + permissions.shellCommands.join(", ") + ")" : "✅ Disabled"}
- **Network Egress:** ${permissions.canMakeHTTPRequests ? "⚠️ Outbound requests enabled" : "✅ None"}
- **Filesystem Modification:** ${permissions.canModifyFiles ? "Write enabled" : "Read only"}
- **Filesystem Deletion:** ${permissions.canDeleteFiles ? "⚠️ File deletion enabled" : "✅ None"}
- **Human In The Loop:** ${permissions.humanApprovalRequired.length > 0 ? "✅ Enforced (" + permissions.humanApprovalRequired.join(", ") + ")" : "None"}

---

*Generated automatically by [AgentTrust](https://agenttrust.dev)*
`;
}
