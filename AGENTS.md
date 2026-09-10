# AGENTS.md

## What this is

OpenTrustBench — trust/scanning layer for AI agent capabilities and MCP tools. npm workspaces monorepo, TypeScript, pure ESM (`"type": "module"`, NodeNext resolution, strict).

- `packages/core` — all engines: capability detectors, OWASP rule suite (8 regex rules: `AT-SEC-001`–`007` + `AT-COMP-001`), permission extraction, trust scoring/grades, attack heuristics, workflow eval parser, SARIF/markdown reporters. Public API re-exported from `src/index.ts`. Tests live in `src/tests/` (node:test), compiled into `dist/tests/`.
- `packages/cli` — `opentrustbench` binary; thin dispatcher over core (`import ... from "@opentrustbench/core"`).
- `packages/action` — GitHub Action wrapper; `action.yml` only, no code.
- `web/public` — site v3 (no frameworks): `index.html`, `methodology.html`, `r/` (54 generated report pages + registry explorer), `assets/` (`site.css` tokens, `site.js` vanilla, self-hosted Inter + JetBrains Mono woff2), `llms.txt`, `.well-known/ai.txt`, `feed.xml`, SEO files (`sitemap.xml`, `robots.txt`, `404.html`). Served via GitHub Pages at `https://www.opentrustbench.com` (`opentrustbench.dev` is a parked squatter domain — never point URLs at it). Internal links are relative (work at root locally and on the custom domain); only canonical/OG use absolute URLs. `404.html` must keep root-absolute `/assets/` paths (it serves at arbitrary depths).
- `badges/` — shareable grade badge SVGs (`a.svg` through `f.svg`), shields.io-compatible, hosted at `https://www.opentrustbench.com/badge/`.
- `examples/` — scan fixtures: `vulnerable-mcp-server` (must grade F / fail attack heuristics), `secure-agent-skill`, `sample-workflow.yaml`.
- `scripts/verify-demos.mjs` — end-to-end smoke checks used by CI and local verification.
- `docs/` + `walkthrough.md` — product strategy/research prose, not engineering docs (walkthrough has stale absolute paths).
- License: Apache-2.0.

## Honesty model (don't regress this)

- The **attack engine runs in static-heuristic mode**: results derive from static findings + permission manifest; no payloads execute. Reports carry `mode: "static-heuristic"` + a disclaimer. Do not reintroduce fabricated narratives ("payload triggered...") or invented durations/costs/success rates anywhere.
- **Workflow eval is simulation mode**: suites are parsed and validated (`parseSimpleYamlSuite`), steps are marked `"simulated"`/`not_executed`, costs/durations stay 0. Real execution requires eval lab v2.
- `registry` command shows sample data (labeled as such). Badges link to static per-repo report pages under `web/public/r/` (registry index at `r/index.html`); regenerate with `node scripts/build-reports.mjs` (re-clones + re-scans, ~10 min; needs `/tmp/at-sweep/results.json` from `seed-registry.mjs`). Bound badges live next to pages (`r/<slug>.svg`); embed as `[![OpenTrustBench](<site>/r/<slug>.svg)](<site>/r/<slug>.html)`. `.github/workflows/rescan.yml` refreshes weekly (Mon 06:00 UTC) and pushes; deploys follow automatically.
- OWASP codes follow the canonical lists: LLM Top 10 2025 (LLM01–LLM10) and Agentic Top 10 published 2025-12-09 (ASI01 Goal Hijack … ASI10 Rogue Agents). Note LLM08 ≠ "secrets"; ASI03 ≠ file deletion. See comment block atop `RULES` in `packages/core/src/analysis/static-analyzer.ts`.
- **Marketing must match the engines**: site/README say **8 rules** (never 18), attack is static-heuristic, eval is simulated, Trust Cards are evidence input (never "certified"/"compliant"). The on-site demo is pre-rendered fixture output — never imply a live scan; badges link to the homepage until report pages exist.
- **Detection integrity**: finding IDs are deterministic hashes (`stableFindingId`) — never `Math.random()`; detector walks recursively (`walkFiles`) and reads `SKILL.md` case-insensitively; code-pattern rules skip prose docs and the scanner's own rule-DSL lines; `AT-COMP-001` requires a real call (paren), not a bare identifier; `compatibility` is inferred per capability type; `provenance.isVerified` means documentary signals present, never "safe".

## Build & test reality

- `npm i` triggers root `prepare` → builds core then cli (order pinned explicitly in root scripts; do NOT use `--workspaces` for build ordering — npm ran cli before core and broke resolution of `@opentrustbench/core`, which needs core's `dist/index.d.ts` to exist).
- `typescript` + `@types/node` are root devDependencies. `types: ["node"]` is set in `tsconfig.base.json`.
- `dist/` is gitignored and untracked. Fresh clone: `npm i` builds everything automatically.
- `npm test` = build + real node:test suite (`packages/core/dist/tests/*.test.js`). No silent fallbacks — failures fail loudly.
- Verification = `npm test` green + `node scripts/verify-demos.mjs` passing (asserts F-grade vulnerable fixture, B-grade secure fixture, non-empty SARIF, heuristic-mode attack report, simulated eval).
- Demo scans overwrite root artifacts: `trust-card.json`, `opentrustbench-report.sarif`, `opentrustbench-report.md`, `opentrustbench-attack-report.json` (committed samples get regenerated).
- Relative imports must use `.js` extensions in TS source (NodeNext requirement).

## Commands

```bash
npm i                                    # installs + auto-builds via prepare
npm test                                 # build + unit tests (14 tests)
node scripts/verify-demos.mjs            # end-to-end demo assertions (CI parity)
npm run scan:vulnerable                  # F-grade fixture scan
npm run scan:secure                      # B-grade fixture
npm run attack:demo                      # static-heuristic attack analysis
npm run eval:demo                        # simulation-mode workflow eval
node packages/cli/dist/index.js scan <path-or-dir>   # scan any target directly
node packages/cli/dist/index.js scan <t> --quiet --format json --output-dir ./trust   # CI-friendly: compact stdout, files to ./trust
npx serve web/public -p 3000             # static web UI (landing page)
# Badge URLs (after GitHub Pages deploy):
# https://www.opentrustbench.com/badge/a.svg  through  https://www.opentrustbench.com/badge/f.svg
```

## Known gaps (roadmap context)

- Dependency scanning runs `npm audit --package-lock-only` only when a lockfile exists; no pip-audit/Trivy yet. Rules remain regex-only, no AST.
- GitHub Action requires caller workflows to grant `security-events: write` for the SARIF upload step; scan targets must be local paths, full GitHub URLs, or flagged (`--github`, `--npm`) — bare `owner/repo` without a flag is treated as a local path by design.
- No lint/format config.
- npm packages to publish at 0.1.1: `@opentrustbench/cli` (CLI, bin `opentrustbench`) + `@opentrustbench/core` (lib). Unscoped `opentrustbench` is permanently blocked (typosquat guard vs real `agent-trust` package) — never reference it as installable.
- Repo is currently PRIVATE on GitHub — must be made public before npm publish and Pages deploy.
- Custom domain `www.opentrustbench.com` (apex redirects to www) via GitHub Pages + `web/public/CNAME`. `opentrustbench.dev` is parked by a squatter — never use it. Canonical URLs use `https://www.opentrustbench.com`. Contact is via GitHub issues (no project email exists).
