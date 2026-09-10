# MEMORY.md

Session notes and durable context for future OpenCode sessions.

## User preferences

- **Always commit and push** after completing work (`git push` to `origin/main`). Confirmed 2026-08-24.

## 2026-08-24 — Repo setup + Phase 0 (honesty & engineering credibility)

**Setup:** Fetched repo from `https://github.com/eulogik/OpenTrustBench` (`main`, commit `7a1fb62`), remote `origin` configured.

**Deep research findings (drove the work):**
- Attack engine and eval lab were fully fabricated: attack results derived from static findings with invented "payload triggered" narratives; eval hardcoded `status = "pass"` + `Math.random()` costs/durations and ignored YAML content entirely.
- OWASP mappings were from a stale Feb-2025 draft taxonomy (e.g. file deletion labeled ASI03, SSRF labeled ASI07 — both wrong vs canonical Dec-2025 list).
- The CLI source NEVER compiled: 9 raw newlines inside double-quoted string literals; committed `dist/` was built from different source. Same for two regexes too narrow to fire on their own flagship fixture (AT-SEC-001 missed direct prompt concat; AT-SEC-002 missed `API_SECRET_TOKEN =`).
- npm name `opentrustbench` is unclaimed. Market check: static MCP scanning is commoditized (Cisco mcp-scanner, Snyk agent-scan, Akto, MCPShield, MCPhound); differentiation lives in real attack/eval execution + trust-card/badge/registry flywheel + EU AI Act compliance export.

**Phase 0 shipped (committed `50b1204`, pushed):**
1. Build fixed: root devDeps (`typescript@^7`, `@types/node`), `types:["node"]` in tsconfig.base, explicit core→cli build order in root scripts (workspace-ordering broke module resolution), all 9 broken string literals repaired in cli/src.
2. dist/ untracked + gitignored. Lockfile generated (`package-lock.json` — needs committing).
3. Real test suite: `packages/core/src/tests/core.test.ts` (9 node:test cases). Root `npm test` no longer falls back silently.
4. CI: `.github/workflows/ci.yml` (npm i → npm test → verify-demos) + `scripts/verify-demos.mjs`.
5. Honesty model enforced: attack reports carry `mode:"static-heuristic"` + disclaimer; eval rewritten as parser/validator with `"simulated"` steps and zero fabricated numbers; registry labeled sample data.
6. OWASP remapped to canonical lists (see comment block atop RULES in static-analyzer.ts).
7. Analyzer fixes: multi-pattern support; AT-SEC-001 catches string-template concat; AT-SEC-002 catches suffixed identifiers. Vulnerable fixture now grades **F (31)**, secure fixture **B (88)**.

**Verified:** clean-room `rm -rf node_modules && npm i` → build → 9/9 tests → all smoke checks pass.

**Open items:** make repo public; register npm name; attack engine v2 (real probing) + eval lab v2 (sandboxed execution) are the strategic unlock; EU AI Act compliance export timing-sensitive.

## 2026-08-24 — Phase 1 (scanner parity) — committed, pushed

- `--fail-on <sev>` CI gate in CLI (exit 1 on breach, exit 2 on invalid value); `action.yml` now passes `fail-on` through and uploads SARIF via `github/codeql-action/upload-sarif@v3` (callers must grant `security-events: write`).
- Scan targets: full GitHub URLs auto-detected; bare `owner/repo` needs `--github` (stays local otherwise by design); npm packages via `--npm` (`npm pack` + tar extract — scans what consumers install). GitHub refs support `.git` suffixes and `/tree/<branch>` (branch names with slashes handled).
- Dependency scanning: `npm audit --package-lock-only` when a lockfile exists (works without node_modules); audit JSON mapped into Trust Card `dependencies` block (moderate→medium normalized, advisory dedupe). No lockfile = no invented vulns.
- Tests: 14 total (added severity ranking, target classification, github-ref parsing incl. branch-with-slash case caught by tests, audit mapping, lockfile-less dep scan).
- Live-verified: cloned eulogik/OpenTrustBench itself and scanned it (9 criticals — repo contains its own vulnerable fixture; expected).

**Next up:** Phase 2 — attack engine v2 (real MCP probing over stdio/HTTP) + eval lab v2 (sandboxed execution). Also: register npm name, make repo public.
