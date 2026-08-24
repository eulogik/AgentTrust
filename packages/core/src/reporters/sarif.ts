import type { TrustCard } from "../types/index.js";

export function generateSarif(card: TrustCard): string {
  const sarifObj = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "AgentTrust",
            version: card.agenttrustVersion,
            informationUri: "https://agenttrust.dev",
            rules: [...new Map(card.security.findings.map(f => [f.rule, f])).values()].map(f => ({
              id: f.rule,
              name: f.title,
              shortDescription: { text: f.title },
              fullDescription: { text: f.description },
              defaultConfiguration: {
                level: f.severity === "critical" || f.severity === "high" ? "error" : "warning"
              },
              helpUri: `https://agenttrust.dev/rules/${f.rule}`
            }))
          }
        },
        results: card.security.findings.map(f => ({
          ruleId: f.rule,
          level: f.severity === "critical" || f.severity === "high" ? "error" : "warning",
          message: { text: `${f.title}: ${f.description}` },
          locations: f.file ? [
            {
              physicalLocation: {
                artifactLocation: { uri: f.file },
                region: { startLine: f.line || 1 }
              }
            }
          ] : []
        }))
      }
    ]
  };

  return JSON.stringify(sarifObj, null, 2);
}
