# State of MCP Permissions — September 2026

50 popular public MCP servers and SDKs scanned with **AgentTrust v0.1.0**
(8-rule static suite, OWASP-mapped). Shallow clones at HEAD on 2026-09-09; re-scanned 2026-09-09 with v0.1.0 string-literal permission handling.
Methodology and target list: `scripts/seed-registry.mjs` (resumable, all work in `/tmp`).

## Headline numbers

| Metric | Value |
|---|---|
| Servers scanned | 50 |
| Average Trust Score | **70.2 / 100 (C)** |
| Graded D or F | **18 / 50 (36%)** |
| Total findings | 461 (146 critical) |
| Excessive permission scope | **20 / 50 (40%)** |
| Minimal scope | 16 / 50 (14 graded A, 2 graded B) |

Grade distribution: A 15 · B 12 · C 5 · D 14 · F 4.

This converges with published research: Liu et al. (2026) found 26.1% of
42,447 skills vulnerable; Snyk (Feb 2026) found flaws in 36.8% of 3,984
published skills. Our 36% D/F lands in the same band.

## The pattern: scope is the story

Every A-grade server shares the same shape — **zero findings and
minimal-or-moderate scope**. Conversely, all 18 D/F servers are
excessive-scope except two broad ones. Findings matter, but **permission
breadth predicts the grade**.

40% of scanned servers still request excessive scope (shell + network +
filesystem deletion combined). For a tool the user installs with one command,
that is the supply-chain risk: a compromised or malicious update inherits
host privileges. (An earlier engine revision read 70% excessive — the drop
comes from no longer counting string literals and prose as capabilities.)

## Bottom 10 (by score)

| Score | Server | Findings (crit) | Scope |
|---|---|---|---|
| 35 | blender-mcp | 9 (3) | excessive |
| 37 | fastmcp | 49 (22) | excessive |
| 37 | mcp-use | 52 (22) | excessive |
| 39 | mongodb-mcp-server | 12 (7) | excessive |
| 40 | agent-toolkit | 10 (0) | excessive |
| 40 | context7 | 12 (6) | excessive |
| 40 | typescript-sdk | 78 (4) | excessive |
| 40 | inspector | 58 (29) | excessive |
| 43 | sentry-mcp | 19 (4) | excessive |
| 43 | cloudflare | 105 (21) | excessive |

## Top 10 (by score)

| Score | Server | Findings | Scope |
|---|---|---|---|
| 96 | mcp-cli | 0 | minimal |
| 95 | pinecone-mcp | 0 | minimal |
| 94 | tavily-mcp | 0 | minimal |
| 94 | java-sdk | 0 | minimal |
| 93 | terraform-mcp-server | 0 | minimal |
| 93 | csharp-sdk | 0 | moderate |
| 92 | go-sdk | 0 | minimal |
| 92 | kotlin-sdk | 0 | minimal |
| 92 | langchain-mcp-adapters | 0 | minimal |
| 91 | e2b-dev mcp-server | 0 | moderate |

## Limitations (read before citing)

- **Static regex only.** No runtime verification; findings need human triage.
  Counts include test/example code inside scanned repos (this inflates large
  codebases: `typescript-sdk`, `cloudflare`, `inspector`, `fastmcp`).
- **Frameworks ≠ servers.** SDKs and frameworks (`fastmcp`, `mcp-use`,
  `agent-toolkit`, both MCP SDKs) are larger attack surfaces than single
  servers; comparing their raw counts to single-purpose servers is apples to
  oranges. The grade already weights scope over raw counts for this reason.
- **Snapshot.** HEAD on 2026-09-09. Scores move with every commit — which is
  exactly why this should be a CI gate, not a PDF.
- **No vendor coordination.** Findings were not pre-disclosed; severities are
  scanner heuristics, not confirmed vulnerabilities.

## What this means for AgentTrust

1. The credential thesis holds: the spread (93 → 35) is wide enough that a
   grade is informative, and the scope signal is simple enough to explain.
2. The next milestone is distribution, not detection breadth: get the badge
   into these 50 READMEs (starting with the 5 A-grades, who have every reason
   to display it) and re-scan on a schedule so grades stay fresh.
3. Detection credibility work that would move these numbers most: AST-based
   rules (kill regex false positives in large repos) and test/example path
   attenuation so framework scores reflect shipped code.

*Generated with `node scripts/seed-registry.mjs 50`. Raw per-server
grade/score/counts were recorded at scan time; re-run the script to refresh.
Engine note: permission capabilities are evaluated on de-stringed code, so
string literals and prose never confer capabilities.*
