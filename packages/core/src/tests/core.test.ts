import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  detectCapability,
  runStaticAnalysis,
  extractPermissions,
  analyzeProvenance,
  computeTrustScore,
  buildTrustCard,
  runAttackSuite,
  evaluateWorkflow,
  parseSimpleYamlSuite,
  generateSarif,
  generateMarkdownReport
} from "../index.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const VULNERABLE_FIXTURE = path.join(REPO_ROOT, "examples", "vulnerable-mcp-server");
const SECURE_FIXTURE = path.join(REPO_ROOT, "examples", "secure-agent-skill");
const WORKFLOW_FIXTURE = path.join(REPO_ROOT, "examples", "sample-workflow.yaml");

function tmpDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttrust-test-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, "utf8");
  }
  return dir;
}

test("detector classifies the vulnerable MCP fixture", async () => {
  const detection = await detectCapability(VULNERABLE_FIXTURE);
  assert.equal(detection.type, "mcp-server");
});

test("static analyzer surfaces expected rule hits on vulnerable fixture", async () => {
  const findings = await runStaticAnalysis(VULNERABLE_FIXTURE);
  const rules = new Set(findings.map(f => f.rule));
  for (const rule of ["AT-SEC-001", "AT-SEC-002", "AT-SEC-003", "AT-SEC-007"]) {
    assert.ok(rules.has(rule), `expected ${rule} to fire on vulnerable fixture`);
  }
  assert.ok(findings.some(f => f.severity === "critical"), "expected at least one critical finding");
});

test("OWASP mappings follow canonical lists (LLM Top 10 2025 / ASI Dec-2025)", async () => {
  const dir = tmpDir({
    "agent.js": [
      "const userInput = req.body;",
      "const code = eval(userInput);",
      "transferFunds(5000);"
    ].join("\n")
  });
  try {
    const findings = await runStaticAnalysis(dir);
    const byRule = new Map(findings.map(f => [f.rule, f]));
    // AT-SEC-004 eval() -> ASI05 Unexpected Code Execution
    assert.equal(byRule.get("AT-SEC-004")?.owaspCode, "ASI05");
    // AT-COMP-001 missing HITL gate -> ASI09 Human-Agent Trust Exploitation
    if (byRule.has("AT-COMP-001")) {
      assert.equal(byRule.get("AT-COMP-001")?.owaspCode, "ASI09");
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("vulnerable fixture grades D/F with failing attack checks", async () => {
  const findings = await runStaticAnalysis(VULNERABLE_FIXTURE);
  const permissions = await extractPermissions(VULNERABLE_FIXTURE);
  const provenance = await analyzeProvenance(VULNERABLE_FIXTURE);
  const score = computeTrustScore(findings, permissions, provenance);

  assert.ok(["D", "F"].includes(score.grade), `expected grade D or F, got ${score.grade}`);

  const report = await runAttackSuite({ targetName: "vulnerable", permissions, findings });
  assert.equal(report.mode, "static-heuristic");
  assert.ok(report.disclaimer && report.disclaimer.length > 0, "attack report must carry the static-heuristic disclaimer");
  assert.ok(report.failed >= 2, `expected >=2 failed heuristic checks, got ${report.failed}`);
  assert.ok(report.resilienceScore < 100);

  const codes = new Set(report.results.map(r => r.owaspCode));
  assert.equal(codes.has("LLM08"), false, "LLM08 must not be used (canonical LLM08 is Vector/Embedding Weaknesses)");
});

test("secure fixture has no critical findings and grades reasonably", async () => {
  const findings = await runStaticAnalysis(SECURE_FIXTURE);
  const criticals = findings.filter(f => f.severity === "critical").length;
  assert.equal(criticals, 0, `expected zero critical findings, got ${criticals}: ${JSON.stringify(findings.map(f => f.rule))}`);

  const permissions = await extractPermissions(SECURE_FIXTURE);
  const provenance = await analyzeProvenance(SECURE_FIXTURE);
  const score = computeTrustScore(findings, permissions, provenance);
  assert.ok(score.overall >= 60, `expected overall >= 60 for secure fixture, got ${score.overall}`);
});

test("trust score reacts to severity weights", () => {
  const base = {
    network: [],
    filesystem: [],
    shell: false,
    shellCommands: [],
    secrets: [],
    envVars: [],
    externalServices: [],
    humanApprovalRequired: ["delete_record"],
    canSpawnProcesses: false,
    canAccessDB: false,
    canSendEmail: false,
    canAccessBrowser: false,
    canModifyFiles: false,
    canDeleteFiles: false,
    canMakeHTTPRequests: false,
    estimatedScope: "minimal" as const
  };
  const prov = {
    signed: true,
    buildReproducible: true,
    hasLockfile: true,
    hasSBOM: true,
    hasLicense: true,
    license: "MIT",
    hasSecurityPolicy: true,
    hasChangelog: true,
    repositoryUrl: "https://example.com/repo",
    isVerified: true
  };

  const clean = computeTrustScore([], base, prov);
  const dirty = computeTrustScore(
    [{
      id: "f1",
      title: "t",
      description: "d",
      severity: "critical",
      category: "security",
      rule: "AT-SEC-002",
      remediation: "r",
      cwe: "CWE-798",
      owaspCode: "LLM02"
    }],
    base,
    prov
  );

  assert.ok(clean.overall > dirty.overall, "critical finding must reduce overall score");
  assert.ok(clean.breakdown.security > dirty.breakdown.security);
});

test("workflow eval parses the sample YAML and reports simulation mode honestly", async () => {
  const result = await evaluateWorkflow(WORKFLOW_FIXTURE);

  assert.equal(result.workflow, "enterprise-finance-approval");
  assert.equal(result.targetAgent, "finance-copilot-v4");
  assert.equal(result.mode, "simulated");
  assert.equal(result.totalTests, 2, "sample suite defines two tests");
  assert.equal(result.passedTests, 0, "nothing executed, so nothing passed");
  assert.equal(result.totalCostUsd, 0, "no fabricated costs");
  assert.equal(result.avgDurationSec, 0, "no fabricated durations");
  assert.ok(result.stepResults.length > 0);
  for (const step of result.stepResults) {
    assert.equal(step.status, "simulated");
    assert.equal(step.actualOutcome, "not_executed");
  }
  assert.match(result.notice ?? "", /simulat/i);
  assert.match(result.notice ?? "", /not executed|no agent executed/i);
});

test("workflow parser ignores unrelated yaml and errors on empty suites", async () => {
  const empty = parseSimpleYamlSuite("workflow: x\ntargetAgent: y\n");
  assert.equal(empty.tests.length, 0);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttrust-eval-"));
  const file = path.join(dir, "suite.json");
  fs.writeFileSync(file, JSON.stringify({ workflow: "w", targetAgent: "a", tests: [] }), "utf8");
  try {
    await assert.rejects(() => evaluateWorkflow(file), /No tests could be parsed/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("SARIF output is valid SARIF 2.1.0 with results", async () => {
  const findings = await runStaticAnalysis(VULNERABLE_FIXTURE);
  const permissions = await extractPermissions(VULNERABLE_FIXTURE);
  const provenance = await analyzeProvenance(VULNERABLE_FIXTURE);
  const score = computeTrustScore(findings, permissions, provenance);
  const card = buildTrustCard({
    capabilityType: "mcp-server",
    name: "vulnerable-fixture",
    findings,
    permissions,
    provenance,
    trustScore: score
  });

  const sarif = JSON.parse(generateSarif(card));
  assert.equal(sarif.version, "2.1.0");
  assert.ok(Array.isArray(sarif.runs) && sarif.runs.length > 0);
  assert.ok(sarif.runs[0].results.length > 0, "vulnerable fixture must produce SARIF results");

  const md = generateMarkdownReport(card);
  assert.ok(md.includes(score.grade), "markdown report should mention the trust grade");
});
