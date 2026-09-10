#!/usr/bin/env node
// Kill-metric check: how many of the 50 swept servers display an OpenTrustBench
// badge in their README? Fetches each repo's README via the GitHub API and
// looks for an opentrustbench badge reference. Writes web/public/r/adoption.json
// (consumed by nothing yet — reported in refresh commits and the one-pager).
// Usage: node scripts/check-badges.mjs  (uses GITHUB_TOKEN if set; works
// unauthenticated at low volume, 60 req/hr)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const RESULTS = "/tmp/at-sweep/results.json";
const OUT = path.join(ROOT, "web", "public", "r", "adoption.json");
const MONOREPO = "modelcontextprotocol/servers";

function api(urlPath) {
  return new Promise((resolve, reject) => {
    const headers = { "User-Agent": "opentrustbench-badge-check", Accept: "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    import("node:https").then(({ default: https }) => {
      https.get("https://api.github.com" + urlPath, { headers }, (res) => {
        let body = "";
        res.on("data", (c) => { body += c; });
        res.on("end", () => {
          if (res.statusCode === 200) resolve(JSON.parse(body));
          else if (res.statusCode === 404) resolve(null);
          else reject(new Error(`GitHub API ${res.statusCode} for ${urlPath}`));
        });
      }).on("error", reject);
    });
  });
}

async function main() {
  if (!fs.existsSync(RESULTS)) {
    console.error(`Missing ${RESULTS} — run scripts/seed-registry.mjs first.`);
    process.exit(1);
  }
  const results = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
  const repos = [...new Set(
    results.filter(r => !r.name.startsWith("mcp-") || r.name.includes("__")).map(r => r.repo).filter(Boolean)
  )];
  if (!repos.includes(MONOREPO)) repos.unshift(MONOREPO);
  const adoption = [];
  for (const repo of repos) {
    try {
      const meta = await api(`/repos/${repo}/readme`);
      const content = meta ? Buffer.from(meta.content, "base64").toString("utf8") : "";
      const has = /opentrustbench/i.test(content);
      adoption.push({ repo, badge: has });
      console.log(`${has ? "BADGE " : "nobadge"} ${repo}`);
    } catch (e) {
      console.log(`ERROR ${repo}: ${e.message}`);
      adoption.push({ repo, badge: false, error: String(e.message).slice(0, 80) });
    }
  }
  const count = adoption.filter(a => a.badge).length;
  fs.writeFileSync(OUT, JSON.stringify({
    date: new Date().toISOString().slice(0, 10),
    displaying: count,
    checked: adoption.length,
    repos: adoption
  }, null, 2));
  console.log(`\n${count}/${adoption.length} repos display an OpenTrustBench badge. -> web/public/r/adoption.json`);
}

main();
