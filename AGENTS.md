# AGENTS.md

## What this is

AgentTrust — trust/scanning layer for AI agent capabilities and MCP tools. npm workspaces monorepo, TypeScript, pure ESM (`"type": "module"`, NodeNext resolution, strict).

- `packages/core` — all engines: capability detectors, OWASP rule suite (`AT-SEC-*`), permission extraction, trust scoring/grades, attack heuristics, workflow eval parser, SARIF/markdown reporters. Public API re-exported from `src/index.ts`. Tests live in `src/tests/` (node:test), compiled into `dist/tests/`.
- `packages/cli` — `agenttrust` binary; thin dispatcher over core (`import ... from "@agenttrust/core"`).
- `packages/action` — GitHub Action wrapper; `action.yml` only, no code.
- `web/public` — single static `index.html`, no build step.
- `examples/` — scan fixtures: `vulnerable-mcp-server` (must grade F / fail attack heuristics), `secure-agent-skill`, `sample-workflow.yaml`.
- `scripts/verify-demos.mjs` — end-to-end smoke checks used by CI and local verification.
- `docs/` + `walkthrough.md` — product strategy/research prose, not engineering docs (walkthrough has stale absolute paths).

## Honesty model (don't regress this)

- The **attack engine runs in static-heuristic mode**: results derive from static findings + permission manifest; no payloads execute. Reports carry `mode: "static-heuristic"` + a disclaimer. Do not reintroduce fabricated narratives ("payload triggered...") or invented durations/costs/success rates anywhere.
- **Workflow eval is simulation mode**: suites are parsed and validated (`parseSimpleYamlSuite`), steps are marked `"simulated"`/`not_executed`, costs/durations stay 0. Real execution requires eval lab v2.
- `registry` command shows sample data (labeled as such). Badge links point at not-yet-deployed `agenttrust.dev`.
- OWASP codes follow the canonical lists: LLM Top 10 2025 (LLM01–LLM10) and Agentic Top 10 published 2025-12-09 (ASI01 Goal Hijack … ASI10 Rogue Agents). Note LLM08 ≠ "secrets"; ASI03 ≠ file deletion. See comment block atop `RULES` in `packages/core/src/analysis/static-analyzer.ts`.

## Build & test reality

- `npm i` triggers root `prepare` → builds core then cli (order pinned explicitly in root scripts; do NOT use `--workspaces` for build ordering — npm ran cli before core and broke resolution of `@agenttrust/core`, which needs core's `dist/index.d.ts` to exist).
- `typescript` + `@types/node` are root devDependencies. `types: ["node"]` is set in `tsconfig.base.json`.
- `dist/` is gitignored and untracked. Fresh clone: `npm i` builds everything automatically.
- `npm test` = build + real node:test suite (`packages/core/dist/tests/*.test.js`). No silent fallbacks — failures fail loudly.
- Verification = `npm test` green + `node scripts/verify-demos.mjs` passing (asserts F-grade vulnerable fixture, B-grade secure fixture, non-empty SARIF, heuristic-mode attack report, simulated eval).
- Demo scans overwrite root artifacts: `trust-card.json`, `agenttrust-report.sarif`, `agenttrust-report.md`, `agenttrust-attack-report.json` (committed samples get regenerated).
- Relative imports must use `.js` extensions in TS source (NodeNext requirement).

## Commands

```bash
npm i                                    # installs + auto-builds via prepare
npm test                                 # build + unit tests (9 tests)
node scripts/verify-demos.mjs            # end-to-end demo assertions (CI parity)
npm run scan:vulnerable                  # F-grade fixture scan
npm run scan:secure                      # B-grade fixture
npm run attack:demo                      # static-heuristic attack analysis
npm run eval:demo                        # simulation-mode workflow eval
node packages/cli/dist/index.js scan <path-or-dir>   # scan any target directly
npx serve web/public -p 3000             # static web UI
```

## Known gaps (roadmap context)

- Scanner accepts local paths only (no GitHub URL/npm package input yet); regex-only rules, no dependency scanning, no AST.
- GitHub Action's `fail-on` input is parsed by nothing; composite step just runs `npx agenttrust scan`.
- No lockfile committed yet (`package-lock.json` exists locally — commit it), no lint/format config.
