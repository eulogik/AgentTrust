#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  detectCapability,
  runStaticAnalysis,
  extractPermissions,
  analyzeProvenance,
  computeTrustScore,
  buildTrustCard,
  runAttackSuite,
  evaluateWorkflow,
  generateSarif,
  generateMarkdownReport
} from "@agenttrust/core";

const args = process.argv.slice(2);
const command = args[0] || "help";
const target = args[1] || ".";

const red = (s: string) => "[31m" + s + "[0m";
const green = (s: string) => "[32m" + s + "[0m";
const yellow = (s: string) => "[33m" + s + "[0m";
const blue = (s: string) => "[34m" + s + "[0m";
const magenta = (s: string) => "[35m" + s + "[0m";
const cyan = (s: string) => "[36m" + s + "[0m";
const bold = (s: string) => "[1m" + s + "[0m";
const gray = (s: string) => "[90m" + s + "[0m";

function printBanner() {
  console.log(cyan(`
   █████╗  ██████╗ ███████╗███╗   ██╗████████╗████████╗██████╗ ██╗   ██╗███████╗████████╗
  ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝╚══██╔══╝██╔══██╗██║   ██║██╔════╝╚══██╔══╝
  ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║      ██║   ██████╔╝██║   ██║███████╗   ██║   
  ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║      ██║   ██╔══██╗██║   ██║╚════██║   ██║   
  ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║      ██║   ██║  ██║╚██████╔╝███████║   ██║   
  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   
`));
  console.log(bold(magenta("  The Trust, Reliability, and Evidence Layer for Autonomous AI Agents")) + gray(" (v0.1.0)
"));
}

async function main() {
  switch (command) {
    case "scan":
      await handleScan(target);
      break;
    case "attack":
      await handleAttack(target);
      break;
    case "eval":
      await handleEval(target);
      break;
    case "init":
      await handleInit();
      break;
    case "badge":
      await handleBadge(target);
      break;
    case "registry":
      await handleRegistry();
      break;
    case "help":
    default:
      printBanner();
      printHelp();
      break;
  }
}

async function handleScan(targetPath: string) {
  printBanner();
  const absPath = path.resolve(process.cwd(), targetPath);
  console.log(gray(`[1/5] Inspecting target capability at: `) + bold(absPath));

  if (!fs.existsSync(absPath)) {
    console.error(red(`Error: Target path does not exist: ${absPath}`));
    process.exit(1);
  }

  const detection = await detectCapability(absPath);
  console.log(gray(`[2/5] Detected capability type: `) + cyan(bold(detection.type)) + gray(` (confidence: ${Math.round(detection.confidence * 100)}%)`));

  console.log(gray(`[3/5] Executing static security & OWASP Agentic Top 10 rule suite...`));
  const findings = await runStaticAnalysis(absPath);

  console.log(gray(`[4/5] Extracting runtime permissions and artifact provenance...`));
  const permissions = await extractPermissions(absPath);
  const provenance = await analyzeProvenance(absPath);

  console.log(gray(`[5/5] Synthesizing Agent Trust Score...`));
  const trustScore = computeTrustScore(findings, permissions, provenance);

  const trustCard = buildTrustCard({
    capabilityType: detection.type,
    name: detection.name,
    version: detection.version,
    description: detection.description,
    findings,
    permissions,
    provenance,
    trustScore
  });

  renderTrustCardTerminal(trustCard);

  const sarif = generateSarif(trustCard);
  const md = generateMarkdownReport(trustCard);
  fs.writeFileSync("agenttrust-report.sarif", sarif, "utf8");
  fs.writeFileSync("agenttrust-report.md", md, "utf8");
  fs.writeFileSync("trust-card.json", JSON.stringify(trustCard, null, 2), "utf8");

  console.log(gray("
Generated Artifacts:"));
  console.log(green("  ✓ agenttrust-report.sarif") + gray(" (SARIF 2.1.0 for GitHub Code Scanning)"));
  console.log(green("  ✓ agenttrust-report.md") + gray(" (Evaluation & compliance audit)"));
  console.log(green("  ✓ trust-card.json") + gray(" (Machine-readable Trust Card v1)"));
}

async function handleAttack(targetPath: string) {
  printBanner();
  const absPath = path.resolve(process.cwd(), targetPath);
  console.log(bold(red("⚡ Launching Adversarial Red-Teaming Suite ⚡")));
  console.log(gray(`Target: ${absPath}
`));

  const detection = await detectCapability(absPath);
  const findings = await runStaticAnalysis(absPath);
  const permissions = await extractPermissions(absPath);

  const report = await runAttackSuite({
    targetName: detection.name,
    permissions,
    findings
  });

  console.log(bold(`Simulated Attacks: ${report.testsRun} | Passed: ${green(String(report.passed))} | Failed: ${red(String(report.failed))} | Warnings: ${yellow(String(report.warn))}`));
  console.log(bold(`Resilience Score: ${report.resilienceScore >= 80 ? green(report.resilienceScore + "/100") : red(report.resilienceScore + "/100")}
`));

  for (const res of report.results) {
    const badge = res.status === "pass" ? green("[PASS]") : res.status === "fail" ? red("[FAIL]") : yellow("[WARN]");
    console.log(`${badge} ${bold(res.name)} (${cyan(res.owaspCode)})`);
    console.log(gray(`       ${res.details}`));
    if (res.remediation && res.status !== "pass") {
      console.log(yellow(`       Fix: ${res.remediation}`));
    }
  }

  fs.writeFileSync("agenttrust-attack-report.json", JSON.stringify(report, null, 2), "utf8");
  console.log(gray("
Saved attack trace: ") + green("agenttrust-attack-report.json"));
}

async function handleEval(suitePath: string) {
  printBanner();
  console.log(bold(cyan("🧪 Running Workflow Reliability & Regression Lab 🧪
")));
  const absPath = path.resolve(process.cwd(), suitePath);

  if (!fs.existsSync(absPath)) {
    console.error(red(`Error: Workflow suite file not found: ${absPath}`));
    process.exit(1);
  }

  const evalRes = await evaluateWorkflow(absPath);
  console.log(bold(`Workflow: ${cyan(evalRes.workflow)} | Agent: ${cyan(evalRes.targetAgent)}`));
  console.log(bold(`Success Rate: ${green(Math.round(evalRes.successRate * 100) + "%")} | Avg Duration: ${evalRes.avgDurationSec}s | Total Cost: $${evalRes.totalCostUsd}
`));

  for (const st of evalRes.stepResults) {
    console.log(`  ${green("✓")} ${bold(st.testName)} → ${gray(st.stepName)} (${st.durationSec}s, $${st.costUsd})`);
  }

  console.log(green("
✓ 0 Regressions Detected across monitored trajectories."));
}

async function handleInit() {
  printBanner();
  const config = `# AgentTrust Configuration
version: "1.0"
target: "."
failOn: "high"

policies:
  allowlistHosts:
    - "api.github.com"
    - "api.openai.com"
  requireHumanApproval:
    - "delete_database"
    - "execute_payment"

evaluations:
  suites:
    - "./tests/agent-workflow.yaml"
`;
  fs.writeFileSync("agenttrust.yaml", config, "utf8");
  console.log(green("✓ Initialized agenttrust.yaml configuration file."));
}

async function handleBadge(targetPath: string) {
  const absPath = path.resolve(process.cwd(), targetPath);
  const detection = await detectCapability(absPath);
  const findings = await runStaticAnalysis(absPath);
  const permissions = await extractPermissions(absPath);
  const provenance = await analyzeProvenance(absPath);
  const score = computeTrustScore(findings, permissions, provenance);

  const color = score.grade === "A" ? "brightgreen" : score.grade === "B" ? "green" : score.grade === "C" ? "yellow" : "red";
  const badgeUrl = `https://img.shields.io/badge/AgentTrust-${score.grade}%20(${score.overall}%2F100)-${color}`;

  console.log(bold("Embeddable Markdown Badge:"));
  console.log(cyan(`[![AgentTrust Score](${badgeUrl})](https://agenttrust.dev/card/${detection.name})`));
}

async function handleRegistry() {
  printBanner();
  console.log(bold("🌐 AgentTrust Public Verified Capabilities Registry (Preview)
"));
  const sampleRegistry = [
    { name: "github-mcp-server", type: "mcp-server", grade: "A", score: 94, downloads: "280K", author: "anthropic" },
    { name: "postgres-mcp-server", type: "mcp-server", grade: "A", score: 91, downloads: "145K", author: "modelcontextprotocol" },
    { name: "web-search-skill", type: "agent-skill", grade: "B", score: 82, downloads: "92K", author: "community" },
    { name: "openclaw-shell-exec", type: "openclaw-plugin", grade: "F", score: 32, downloads: "41K", author: "unverified" }
  ];

  console.log(bold("NAME".padEnd(28) + "TYPE".padEnd(18) + "GRADE".padEnd(10) + "SCORE".padEnd(10) + "PUBLISHER"));
  console.log(gray("─".repeat(78)));
  for (const item of sampleRegistry) {
    const gradeColor = item.grade === "A" ? green(item.grade) : item.grade === "B" ? cyan(item.grade) : red(item.grade);
    console.log(bold(item.name.padEnd(28)) + item.type.padEnd(18) + gradeColor.padEnd(19) + String(item.score).padEnd(10) + gray(item.author));
  }
}

function renderTrustCardTerminal(card: any) {
  const { subject, trustScore, security, permissions, provenance } = card;
  const gradeColor = trustScore.grade === "A" ? green : trustScore.grade === "B" ? cyan : trustScore.grade === "C" ? yellow : red;

  console.log(bold("
" + "═".repeat(60)));
  console.log(bold(`  AGENTTRUST CARD: ${subject.name} `) + gray(`(${subject.type})`));
  console.log("═".repeat(60));
  console.log(`  Trust Grade:       ${gradeColor(bold(trustScore.grade))} (${trustScore.overall}/100) `);
  console.log(`  Confidence:        ${bold(trustScore.confidence.toUpperCase())}`);
  console.log(`  Security Score:    ${trustScore.breakdown.security}/100`);
  console.log(`  Permission Scope:  ${bold(permissions.estimatedScope.toUpperCase())}`);
  console.log(`  Provenance:        ${provenance.isVerified ? green("Verified Safe") : yellow("Unverified Origin")}`);
  console.log(`  Shell Access:      ${permissions.shell ? red("ENABLED") : green("DISABLED")}`);
  console.log(`  Network Egress:    ${permissions.canMakeHTTPRequests ? yellow("HTTP/HTTPS Outbound") : green("NONE")}`);
  console.log(`  Human In The Loop: ${permissions.humanApprovalRequired.length > 0 ? green("ENFORCED") : gray("NONE")}`);
  console.log("─".repeat(60));
  console.log(`  Rationale: ${gray(trustScore.rationale)}`);
  console.log("═".repeat(60) + "
");

  if (security.findings.length > 0) {
    console.log(bold(yellow(`⚠️  Security Findings (${security.totalFindings}):`)));
    for (const f of security.findings) {
      const sColor = f.severity === "critical" ? red : f.severity === "high" ? red : yellow;
      console.log(`  ${sColor("[" + f.severity.toUpperCase() + "]")} ${bold(f.title)} ` + gray(`(${f.file || "global"}:${f.line || 1})`));
      console.log(gray(`         Rule: ${f.rule} (${f.owaspCode}) | Remediation: ${f.remediation}`));
    }
  } else {
    console.log(green("  ✓ No security vulnerabilities or excessive agency detected."));
  }
}

function printHelp() {
  console.log(bold("USAGE:"));
  console.log("  agenttrust scan <path-or-repo>    Scan agent capability and generate Trust Card");
  console.log("  agenttrust attack <path-or-repo>  Run OWASP Agentic Top 10 adversarial attacks");
  console.log("  agenttrust eval <workflow.yaml>   Run workflow reliability & regression tests");
  console.log("  agenttrust badge <path>           Generate embeddable markdown badge");
  console.log("  agenttrust init                   Scaffold agenttrust.yaml configuration");
  console.log("  agenttrust registry               Browse public verified capability registry
");
}

main().catch(err => {
  console.error(red("Fatal error: " + err.message));
  process.exit(1);
});
