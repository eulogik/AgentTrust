import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  classifyScanInput,
  parseGitHubRef,
  meetsSeverityThreshold,
  isSeverity,
  mapAuditReport,
  scanDependencies
} from "../index.js";

test("severity thresholds rank correctly", () => {
  assert.ok(meetsSeverityThreshold("critical", "high"));
  assert.ok(meetsSeverityThreshold("high", "high"));
  assert.ok(!meetsSeverityThreshold("medium", "high"));
  assert.ok(!meetsSeverityThreshold("info", "low"));
  assert.ok(isSeverity("critical"));
  assert.equal(isSeverity("catastrophic"), false);
});

test("scan input classification routes github, npm, and local targets", () => {
  assert.equal(classifyScanInput("https://github.com/owner/repo"), "github");
  assert.equal(classifyScanInput("https://github.com/owner/repo/tree/v2"), "github");
  assert.equal(classifyScanInput("git@github.com:owner/repo.git"), "github");
  assert.equal(classifyScanInput("owner/repo", { github: true }), "github");
  assert.equal(classifyScanInput("lodash", { npm: true }), "npm");
  assert.equal(classifyScanInput("@scope/pkg", { npm: true }), "npm");
  assert.equal(classifyScanInput("./examples/vulnerable-mcp-server"), "local");
  // bare owner/repo without a flag stays local — explicit flags avoid surprises
  assert.equal(classifyScanInput("owner/repo"), "local");
});

test("github ref parser handles urls, ssh, .git suffixes, and branches", () => {
  const https = parseGitHubRef("https://github.com/owner/repo");
  assert.equal(https.url, "https://github.com/owner/repo.git");
  assert.equal(https.repo, "repo");
  assert.equal(https.branch, undefined);

  const branched = parseGitHubRef("https://github.com/owner/repo/tree/release/v2");
  assert.equal(branched.repo, "repo");
  assert.equal(branched.branch, "release/v2");

  const ssh = parseGitHubRef("git@github.com:owner/repo.git");
  assert.equal(ssh.url, "https://github.com/owner/repo.git");
  assert.equal(ssh.repo, "repo");

  const bare = parseGitHubRef("owner/repo");
  assert.equal(bare.repo, "repo");

  assert.throws(() => parseGitHubRef("not-a-repo-ref"));
});

test("audit report mapping normalizes severities and dedupes advisories", () => {
  const mapped = mapAuditReport({
    vulnerabilities: {
      "some-pkg": {
        severity: "moderate",
        via: [
          { title: "Prototype Pollution", url: "https://example.com/advisory-1", severity: "high" },
          { title: "Prototype Pollution", url: "https://example.com/advisory-1", severity: "high" },
          "3.0.0 < 3.0.2"
        ]
      },
      "critical-pkg": {
        severity: "critical",
        via: [{ title: "RCE", severity: "critical" }]
      }
    }
  });

  const somePkg = mapped.get("some-pkg")!;
  assert.equal(somePkg.length, 2, "duplicate advisories collapse");
  assert.equal(somePkg[0].severity, "high", "via-level severity wins");
  assert.equal(somePkg[1].title, "Vulnerable range via 3.0.0 < 3.0.2");

  const criticalPkg = mapped.get("critical-pkg")!;
  assert.equal(criticalPkg[0].severity, "critical");
});

test("dependency scanner reads manifests without lockfile or network", async () => {
  assert.deepEqual(await scanDependencies(os.tmpdir()), []);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttrust-deps-"));
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "x", dependencies: { lodash: "^4.17.20" } }),
    "utf8"
  );
  try {
    const deps = await scanDependencies(dir);
    assert.equal(deps.length, 1);
    assert.equal(deps[0].name, "lodash");
    assert.deepEqual(deps[0].vulnerabilities, [], "no lockfile means no audit, no invented vulns");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
