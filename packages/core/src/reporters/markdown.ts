import type { TrustCard } from "../types/index.js";

export function generateMarkdownReport(card: TrustCard): string {
  const { subject, trustScore, security, permissions, provenance } = card;
  const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const ordered = [...security.findings].sort((a, b) => (rank[a.severity] ?? 5) - (rank[b.severity] ?? 5));
  const fixFirst = ordered.filter(f => f.severity === "critical" || f.severity === "high");

  return `# OpenTrustBench Evaluation Report

> **Capability:** \`${subject.name}\` (${subject.type})  
> **Trust Grade:** **${trustScore.grade}** (${trustScore.overall}/100)  
> **Confidence:** ${trustScore.confidence.toUpperCase()}  
> **Date:** ${card.generatedAt}
>
> Static analysis only (8-rule suite, OWASP-mapped). Not a certification or penetration test.

---

## 🛡️ Trust Score Breakdown

| Category | Score | Status |
|---|---|---|
| **Security** | ${trustScore.breakdown.security}/100 | ${trustScore.breakdown.security >= 80 ? "✅ Healthy" : "⚠️ Risk Detected"} |
| **Permissions** | ${trustScore.breakdown.permissions}/100 | Scope: \`${permissions.estimatedScope}\` |
| **Provenance** | ${trustScore.breakdown.provenance}/100 | ${provenance.isVerified ? "Signals present" : "Unverified origin"} |
| **Reliability** | ${trustScore.breakdown.reliability}/100 | Standard |
| **Stability** | ${trustScore.breakdown.stability}/100 | Lockfile: ${provenance.hasLockfile ? "Yes" : "No"} |

**Rationale:** ${trustScore.rationale}

---

## 🎯 Fix this week (${fixFirst.length} critical/high)

${fixFirst.length === 0 ? "_No critical or high-severity findings in scope._" : fixFirst.map(f => `- **[${f.severity.toUpperCase()}] ${f.title}** — \`${f.file || "global"}:${f.line || 1}\` (${f.rule}, ${f.owaspCode}): ${f.remediation}`).join("\n")}

---

## 🚨 All Security Findings (${security.totalFindings} Total)

| Severity | Rule | Title | Location |
|---|---|---|---|
${ordered.map(f => `| **${f.severity.toUpperCase()}** | \`${f.rule}\` | ${f.title} | \`${f.file || "global"}:${f.line || 1}\` |`).join("\n")}

---

## 🔑 Permissions Declared & Detected

- **Shell Execution:** ${permissions.shell ? "⚠️ Enabled (" + permissions.shellCommands.join(", ") + ")" : "✅ Disabled"}
- **Network Egress:** ${permissions.canMakeHTTPRequests ? "⚠️ Outbound requests enabled" : "✅ None"}
- **Filesystem Modification:** ${permissions.canModifyFiles ? "Write enabled" : "Read only"}
- **Filesystem Deletion:** ${permissions.canDeleteFiles ? "⚠️ File deletion enabled" : "✅ None"}
- **Human In The Loop:** ${permissions.humanApprovalRequired.length > 0 ? "✅ Enforced (" + permissions.humanApprovalRequired.join(", ") + ")" : "None"}

---

*Generated automatically by [OpenTrustBench](https://eulogik.github.io/OpenTrustBench)*
`;
}
