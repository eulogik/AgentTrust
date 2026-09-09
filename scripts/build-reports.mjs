#!/usr/bin/env node
// Build static per-repo Trust Card report pages + registry index.
// Input: /tmp/at-sweep/results.json (from scripts/seed-registry.mjs).
// Output: web/public/r/<slug>.html, web/public/r/index.html (+ 3 self scans).
// All pages are pure static HTML (no JS, no backend) for GitHub Pages.
// Re-run to refresh: results are a dated snapshot, never live data.
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CLI = path.join(ROOT, "packages", "cli", "dist", "index.js");
const CORE_PKG = JSON.parse(fs.readFileSync(path.join(ROOT, "packages", "core", "package.json"), "utf8"));
const SITE = "https://eulogik.github.io/AgentTrust";
const OUT_DIR = path.join(ROOT, "web", "public", "r");
const WORK = "/tmp/at-reports";
const CLONES = path.join(WORK, "clones");
const OUT = path.join(WORK, "out");
const RESULTS = "/tmp/at-sweep/results.json";
const MONOREPO = "modelcontextprotocol/servers";
const SCAN_DATE = new Date().toISOString().slice(0, 10);

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf8", timeout: 180000, ...opts }).trim();
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const GRADE_COLOR = { A: "#34d399", B: "#22d3ee", C: "#fbbf24", D: "#fb923c", F: "#fb7185" };
const SEV_COLOR = { critical: "#fb7185", high: "#fb923c", medium: "#fbbf24", low: "#94a3b8", info: "#64748b" };

function breakdownBars(b) {
  return Object.entries(b).map(([k, v]) => `
    <div style="margin:6px 0"><span style="display:inline-block;width:130px;color:#94a3b8">${esc(k)}</span>
    <span style="display:inline-block;width:220px;max-width:50vw;background:#1e293b;border-radius:4px;overflow:hidden;vertical-align:middle"><span style="display:block;height:10px;width:${Math.max(0, Math.min(100, v))}%;background:#22d3ee"></span></span>
    <span style="color:#e2e8f0"> ${v}/100</span></div>`).join("");
}

function findingsTable(findings) {
  if (!findings.length) return "<p>No findings in scope of the 8-rule static suite.</p>";
  const rank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const rows = [...findings]
    .sort((a, b) => (rank[a.severity] ?? 5) - (rank[b.severity] ?? 5))
    .map(f => `<tr><td><strong style="color:${SEV_COLOR[f.severity] || "#94a3b8"}">${esc(String(f.severity).toUpperCase())}</strong></td><td><code>${esc(f.rule)}</code> (${esc(f.owaspCode || "")})</td><td>${esc(f.title)}<br><code style="color:#94a3b8">${esc(f.file || "global")}:${esc(f.line ?? 1)}</code><br><span style="color:#94a3b8">Evidence: </span><code>${esc(f.evidence || "")}</code></td><td>${esc(f.remediation || "")}</td></tr>`)
    .join("");
  return `<table><thead><tr><th>Severity</th><th>Rule</th><th>Finding</th><th>Remediation</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function reportPage({ slug: sl, title, repoUrl, upstream, card }) {
  const g = card.trustScore.grade;
  const canon = `${SITE}/r/${sl}.html`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${title} — AgentTrust Grade ${g} (${card.trustScore.overall}/100)`,
    description: `Static security scan of ${title}: ${card.security.totalFindings} findings (${card.security.criticalCount} critical), permission scope ${card.permissions.estimatedScope}.`,
    datePublished: SCAN_DATE,
    author: { "@type": "Organization", name: "AgentTrust", url: SITE }
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} — Trust Card (Grade ${esc(g)}) · AgentTrust</title>
<meta name="description" content="Static security scan of ${esc(title)}: grade ${esc(g)} (${card.trustScore.overall}/100), ${card.security.totalFindings} findings, scope ${esc(card.permissions.estimatedScope)}.">
<link rel="canonical" href="${canon}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)} — AgentTrust Grade ${esc(g)}">
<meta property="og:url" content="${canon}">
<script type="application/ld+json">${jsonLd}</script>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#020617;color:#e2e8f0;margin:0;padding:24px;line-height:1.55}main{max-width:960px;margin:0 auto}a{color:#22d3ee}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px;border-bottom:1px solid #1e293b;vertical-align:top}code{font-family:ui-monospace,monospace;font-size:12.5px}.pill{display:inline-block;padding:6px 18px;border-radius:12px;font-size:28px;font-weight:800;border:1px solid}.card{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin:16px 0}</style>
</head>
<body><main>
<p><a href="${SITE}/r/">← All scanned servers</a> · <a href="${SITE}/">AgentTrust</a></p>
<h1>${esc(title)} <span class="pill" style="color:${GRADE_COLOR[g] || "#94a3b8"};border-color:${GRADE_COLOR[g] || "#94a3b8"}">${esc(g)} ${card.trustScore.overall}</span></h1>
<p>Static Trust Card <code>agenttrust/trust-card/v1</code> · scanned ${esc(SCAN_DATE)} · engine v${esc(CORE_PKG.version)} (8 regex rules, OWASP-mapped) · upstream ${esc(upstream)}</p>
<div class="card"><h2>Score breakdown</h2>${breakdownBars(card.trustScore.breakdown)}<p style="color:#94a3b8">${esc(card.trustScore.rationale || "")}</p></div>
<div class="card"><h2>Fix first (${card.security.findings.filter(f => f.severity === "critical" || f.severity === "high").length} critical/high)</h2>${findingsTable(card.security.findings)}</div>
<div class="card"><h2>Permissions</h2><p>Scope: <strong>${esc(card.permissions.estimatedScope)}</strong> · Shell: ${card.permissions.shell ? "enabled" : "disabled"} · Network egress: ${card.permissions.canMakeHTTPRequests ? "yes" : "no"} · File deletion: ${card.permissions.canDeleteFiles ? "enabled" : "none"} · Human approval: ${(card.permissions.humanApprovalRequired || []).length ? esc(card.permissions.humanApprovalRequired.join(", ")) : "none"}</p>
<h2>Provenance</h2><p>License: ${esc(card.provenance.license || "none detected")} · Lockfile: ${card.provenance.hasLockfile ? "yes" : "no"} · Security policy: ${card.provenance.hasSecurityPolicy ? "yes" : "no"} · Signals: ${card.provenance.isVerified ? "present (documentary, not a safety verdict)" : "unverified origin"}</p></div>
<div class="card"><h2>Methodology &amp; limits</h2><p>Static analysis only — no code executed, findings need human triage, counts may include test/example code. Reproduce: <code>npx agenttrust scan ${esc(repoUrl)}</code>. Dated snapshot; scores move with every upstream commit.</p></div>
</main></body></html>
`;
}

function indexPage(rows) {
  const trs = [...rows].sort((a, b) => b.overall - a.overall).map(r =>
    `<tr><td><a href="${SITE}/r/${r.slug}.html" style="color:${GRADE_COLOR[r.grade]};font-weight:800">${r.grade}</a></td><td><a href="${SITE}/r/${r.slug}.html">${esc(r.title)}</a></td><td>${r.overall}</td><td>${r.total} (${r.crit} crit)</td><td>${esc(r.scope)}</td><td style="color:#94a3b8">${esc(r.upstreamShort)}</td></tr>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Scanned MCP servers — Trust Card registry · AgentTrust</title>
<meta name="description" content="Static Trust Cards for ${rows.length} public MCP servers and SDKs: grades, scores, findings, permission scope. Dated snapshot, re-scanned periodically.">
<link rel="canonical" href="${SITE}/r/">
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#020617;color:#e2e8f0;margin:0;padding:24px}main{max-width:960px;margin:0 auto}a{color:#22d3ee}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px;border-bottom:1px solid #1e293b}</style>
</head>
<body><main>
<p><a href="${SITE}/">← AgentTrust</a></p>
<h1>Scanned servers (${rows.length})</h1>
<p>Dated snapshot (${esc(SCAN_DATE)}), engine v${esc(CORE_PKG.version)}. Static analysis only — findings need triage. Methodology: <a href="https://github.com/eulogik/AgentTrust/blob/main/docs/STATE-OF-MCP-2026.md">State of MCP Permissions</a>.</p>
<table><thead><tr><th>Grade</th><th>Server</th><th>Score</th><th>Findings</th><th>Scope</th><th>Upstream</th></tr></thead><tbody>${trs}</tbody></table>
</main></body></html>
`;
}

function scanTarget(targetPath, outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  execFileSync("node", [CLI, "scan", targetPath, "--quiet", "--format", "json", "--output-dir", outDir, "--no-color"], { stdio: "pipe", timeout: 180000 });
  return JSON.parse(fs.readFileSync(path.join(outDir, "trust-card.json"), "utf8"));
}

function clone(repo, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  sh(`git clone --depth 1 --quiet https://github.com/${repo}.git "${dest}"`);
}

function main() {
  if (!fs.existsSync(RESULTS)) {
    console.error(`Missing ${RESULTS} — run scripts/seed-registry.mjs first.`);
    process.exit(1);
  }
  const results = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
  fs.mkdirSync(CLONES, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rows = [];
  let failed = 0;

  const monoDir = path.join(CLONES, "monorepo-servers");
  const isMono = (name) => name.startsWith("mcp-") && !name.includes("__");
  const needMono = results.some(r => isMono(r.name));
  if (needMono && !fs.existsSync(path.join(monoDir, ".git"))) {
    console.log("cloning " + MONOREPO + " ...");
    clone(MONOREPO, monoDir);
  }
  const monoSha = needMono ? sh(`git -C "${monoDir}" rev-parse --short HEAD`) : "";
  const monoDate = needMono ? sh(`git -C "${monoDir}" log -1 --format=%cs`) : "";

  for (const r of results) {
    const sl = slug(r.name);
    try {
      let target, repoUrl, upstream;
      if (isMono(r.name)) {
        const sub = r.name.slice(4);
        target = path.join(monoDir, "src", sub);
        repoUrl = `https://github.com/${MONOREPO}/tree/main/src/${sub}`;
        upstream = `${MONOREPO} @ ${monoSha} (${monoDate})`;
      } else {
        const repo = r.repo;
        const dest = path.join(CLONES, sl);
        clone(repo, dest);
        target = dest;
        const sha = sh(`git -C "${dest}" rev-parse --short HEAD`);
        const date = sh(`git -C "${dest}" log -1 --format=%cs`);
        repoUrl = `https://github.com/${repo}`;
        upstream = `${repo} @ ${sha} (${date})`;
      }
      const card = scanTarget(target, path.join(OUT, sl));
      fs.writeFileSync(path.join(OUT_DIR, `${sl}.html`), reportPage({ slug: sl, title: r.name, repoUrl, upstream, card }));
      rows.push({ slug: sl, title: r.name, grade: card.trustScore.grade, overall: card.trustScore.overall, total: card.security.totalFindings, crit: card.security.criticalCount, scope: card.permissions.estimatedScope, upstreamShort: upstream.split(" (")[0] });
      console.log(`OK ${r.name} -> r/${sl}.html`);
    } catch (e) {
      failed++;
      console.log(`FAIL ${r.name}: ${String(e.message || e).split("\n")[0]}`);
    }
  }

  // Self scans (local tree, bound to our own commit).
  const selfSha = sh(`git -C "${ROOT}" rev-parse --short HEAD`);
  const self = [
    ["self-packages-cli", "agenttrust CLI (packages/cli)", path.join(ROOT, "packages", "cli")],
    ["self-examples-secure-agent-skill", "examples/secure-agent-skill", path.join(ROOT, "examples", "secure-agent-skill")],
    ["self-examples-vulnerable-mcp-server", "examples/vulnerable-mcp-server", path.join(ROOT, "examples", "vulnerable-mcp-server")]
  ];
  for (const [sl, title, target] of self) {
    try {
      const card = scanTarget(target, path.join(OUT, sl));
      const upstream = `eulogik/AgentTrust @ ${selfSha} (${SCAN_DATE})`;
      fs.writeFileSync(path.join(OUT_DIR, `${sl}.html`), reportPage({ slug: sl, title, repoUrl: "https://github.com/eulogik/AgentTrust", upstream, card }));
      rows.push({ slug: sl, title, grade: card.trustScore.grade, overall: card.trustScore.overall, total: card.security.totalFindings, crit: card.security.criticalCount, scope: card.permissions.estimatedScope, upstreamShort: `eulogik/AgentTrust @ ${selfSha}` });
      console.log(`OK ${title} -> r/${sl}.html`);
    } catch (e) {
      failed++;
      console.log(`FAIL ${title}: ${String(e.message || e).split("\n")[0]}`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexPage(rows));
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith(".html"));
  const bytes = files.reduce((n, f) => n + fs.statSync(path.join(OUT_DIR, f)).size, 0);
  console.log(`\nWrote ${files.length} pages (${(bytes / 1024).toFixed(0)} KB) to web/public/r/. Failed: ${failed}.`);
}

main();
