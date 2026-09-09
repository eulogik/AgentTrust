import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  detectCapability,
  runStaticAnalysis,
  extractPermissions,
  stableFindingId,
  inferCompatibility,
  parseAgentTrustConfig,
  runScan
} from "../index.js";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const VULNERABLE_FIXTURE = path.join(REPO_ROOT, "examples", "vulnerable-mcp-server");

function tmpDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttrust-integrity-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return dir;
}

test("finding IDs are deterministic and distinct", () => {
  const a = stableFindingId("AT-SEC-004", "a.ts", 3, "eval(x)");
  const b = stableFindingId("AT-SEC-004", "a.ts", 3, "eval(x)");
  const c = stableFindingId("AT-SEC-004", "a.ts", 4, "eval(x)");
  assert.equal(a, b, "same rule+file+line+evidence must give the same id");
  assert.notEqual(a, c, "different line must give a different id");
  assert.match(a, /^AT-SEC-004-[0-9a-f]{12}$/);
});

test("static analysis IDs are stable across runs (SARIF-safe)", async () => {
  const first = await runStaticAnalysis(VULNERABLE_FIXTURE);
  const second = await runStaticAnalysis(VULNERABLE_FIXTURE);
  const ids = (list: typeof first) => [...new Set(list.map(f => f.id))].sort();
  assert.deepEqual(ids(first), ids(second), "repeat scans must produce identical finding IDs");
});

test("detector finds MCP servers nested in subdirectories", async () => {
  const dir = tmpDir({
    "package.json": JSON.stringify({ name: "nested", version: "1.0.0" }),
    "src/server.ts": `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";\nserver.tool("x", {}, async () => ({}));\n`
  });
  try {
    const detection = await detectCapability(dir);
    assert.equal(detection.type, "mcp-server");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("detector reads uppercase SKILL.md (case-sensitive filesystems)", async () => {
  const dir = tmpDir({ "SKILL.md": "# My Cool Skill\n\nDoes things.\n" });
  try {
    const detection = await detectCapability(dir);
    assert.equal(detection.type, "agent-skill");
    assert.equal(detection.name, "My Cool Skill");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("compatibility is inferred per capability, never a universal allowlist", () => {
  assert.deepEqual(inferCompatibility("mcp-server"), ["mcp-host"]);
  assert.deepEqual(inferCompatibility("agent-skill"), ["claude-code", "cursor", "codex"]);
  assert.deepEqual(inferCompatibility("generic-agent"), []);
});

test("runScan cards carry inferred compatibility", async () => {
  const result = await runScan(VULNERABLE_FIXTURE);
  assert.equal(result.detection.type, "mcp-server");
  assert.deepEqual(result.trustCard.compatibility, ["mcp-host"]);
});

test("AT-COMP-001 requires a real call — field names do not self-flag", async () => {
  const dir = tmpDir({
    "flags.ts": "export const canSendEmail = false;\nexport const transferState = 1;\n"
  });
  try {
    const findings = await runStaticAnalysis(dir);
    assert.equal(
      findings.filter(f => f.rule === "AT-COMP-001").length, 0,
      "bare identifiers must not trigger the approval-gate rule"
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("AT-COMP-001 fires on unapproved high-impact calls with a line number", async () => {
  const dir = tmpDir({ "pay.ts": "export function run() {\n  transferFunds(5000);\n}\n" });
  try {
    const findings = await runStaticAnalysis(dir);
    const hit = findings.find(f => f.rule === "AT-COMP-001");
    assert.ok(hit, "transferFunds(...) without approval must fire AT-COMP-001");
    assert.equal(hit.line, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("prose docs are out of scope for code-pattern rules", async () => {
  const dir = tmpDir({
    "notes.md": "# Design notes\n\nWe considered eval(userInput) but rejected it.\nExample key sk-proj-abc123456789012345678901234567890 (do not use).\n"
  });
  try {
    const findings = await runStaticAnalysis(dir);
    assert.equal(findings.length, 0, `docs must not produce code findings, got ${JSON.stringify(findings.map(f => f.rule))}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("scanner rule definitions do not flag themselves", async () => {
  const dir = tmpDir({
    "rules.ts": "pattern: /\\beval\\s*\\(|new\\s+Function\\s*\\(/\nremediation: \"Eliminate eval() fast\"\n"
  });
  try {
    const findings = await runStaticAnalysis(dir);
    assert.equal(findings.length, 0, `rule-definition lines must not self-flag, got ${JSON.stringify(findings.map(f => f.rule))}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("string literals do not confer capabilities", async () => {
  const dir = tmpDir({
    "sample.ts": [
      'const a = "openclaw-shell-exec";',
      'const b = "postgres-mcp-server";',
      "// please resend the report when ready",
      "const note = 'uses eval() for docs';"
    ].join("\n")
  });
  try {
    const perms = await extractPermissions(dir);
    assert.equal(perms.shell, false, "sample string must not flag shell");
    assert.equal(perms.canSpawnProcesses, false);
    assert.equal(perms.canAccessDB, false, "sample string must not flag database");
    assert.equal(perms.canSendEmail, false, "prose must not flag email");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("real calls and imports still confer capabilities", async () => {
  const dir = tmpDir({
    "srv.ts": [
      "import pg from 'pg';",
      "import { chromium } from 'playwright';",
      "export function run(cmd: string) { exec(cmd); }",
      "export function load(url: string) { return fetch(url); }",
      "const key = process.env.API_KEY;"
    ].join("\n")
  });
  try {
    const perms = await extractPermissions(dir);
    assert.equal(perms.shell, true, "exec(cmd) must flag shell");
    assert.equal(perms.canAccessDB, true, "import pg must flag database");
    assert.equal(perms.canAccessBrowser, true, "playwright import must flag browser");
    assert.equal(perms.canMakeHTTPRequests, true, "fetch(url) must flag network");
    assert.ok(perms.secrets.includes("API_KEY"), "process.env.API_KEY must register a secret");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("shipped CLI self-scan has no phantom shell/database flags", async () => {
  const cliDir = path.join(REPO_ROOT, "packages", "cli");
  const perms = await extractPermissions(cliDir);
  assert.equal(perms.shell, false, "CLI sample strings must not flag shell");
  assert.equal(perms.canAccessDB, false, "CLI sample strings must not flag database");
  assert.equal(perms.canSendEmail, false);
});

test("agenttrust.yaml config parses the keys the scanner reads", () => {
  const cfg = parseAgentTrustConfig([
    "# comment",
    'version: "1.0"',
    'target: "."',
    'failOn: "high"',
    'outputDir: "./trust"',
    "writeFiles: true"
  ].join("\n"));
  assert.equal(cfg.failOn, "high");
  assert.equal(cfg.outputDir, "./trust");
  assert.equal(cfg.writeFiles, true);
});
