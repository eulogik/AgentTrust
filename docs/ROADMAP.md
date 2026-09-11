# OpenTrustBench Roadmap — researched, sequenced, buildable

Date: 2026-09-11. Status: planning doc, not committed code (except item 0).
Inputs: launch feedback (LocalLLaMA runtime-gap thread, npm staleness thread, EU AI Act compliance thread),
two deep-research briefs (verifiable attestations + EU AI Act Art. 50; AST options + baseline diff + credential rules),
and ground truth from the current codebase (`packages/core/src/types`, `trust/card-builder.ts`).

## Non-negotiable constraints (every item must satisfy these)

1. Fully local, seconds per scan, dependency-light.
2. Honesty model holds: static-heuristic attack, simulated eval, Trust Cards are evidence input, never certified or compliant. No fabricated narratives, no invented metrics.
3. Grades rot: every grade is a dated snapshot of a specific revision, never a floating verdict.
4. No silent behavior: suppressions require reasons, expired suppressions warn, unknown rule IDs warn.

## Codebase ground truth (what exists today, verified by reading source)

- `Finding` has deterministic `id` (stableFindingId), file/line/col, rule, severity, evidence. It has NO fingerprint field and NO per-finding confidence.
- `TrustCard` has NO validity window, subject has version/repository but NO commit-sha field. The registry records upstream sha externally; the card itself does not.
- `PermissionManifest` already extracts `secrets: string[]` and `envVars: string[]`. This is the foundation for credential rules, no new plumbing needed for signal collection.
- `TrustScore` already carries top-level `confidence`. Per-rule confidence does not exist yet.
- FIXED with this doc (was live): `card-builder.ts` pushed tag `"gold-certified"` for A grades. The word certified must never appear in emitted artifacts. This file records the fix; the verify sweep below excludes historical mentions.

---

## v0.2.0 — trust the grade (next, ~2-3 weekends)

Ordered by unblock value. Each item lists done criteria.

### 0. Rename `gold-certified` tag (immediate, with this doc)

Change to `"grade-a"`. One line, zero behavior change except honesty. Verify: full test suite green, no `certified` string emitted anywhere in source, cards, or badges (historical mentions in this doc and the FAQ denial excluded).

### 1. Baseline diff CI mode (build first, biggest adoption unlock)

Problem: `--fail-on` fires on all findings including acknowledged ones, so teams disable the gate.
Design (Gitleaks-style file mode, NOT Semgrep double-scan: no checkout, no git history needed, cacheable in CI):

- Add `fingerprint` to `Finding`: `sha256(ruleId + NUL + normPath + NUL + snippetHash + NUL + occurrenceIndex)`, where snippetHash normalizes whitespace per line and occurrenceIndex disambiguates identical snippets in one file (the CodeQL `:1`/`:2` trick). Line/col stay as display metadata only, never identity. This survives moved code and line shifts; renames count as new (documented, matches CodeQL).
- Flags: `scan --baseline <file>` (fail only on fingerprints not in baseline), `scan --update-baseline` (rewrite baseline), optional `--fail-on fixed` reporting.
- Semantics: `current minus baseline = new (fail)`; `baseline minus current = fixed (info only)`.
- Baseline file is versioned JSON (`{version: 1, findings: [...]}`), committed to the scanned repo.
- Done criteria: fixture repo where moving a flagged line to another file does NOT refire; renaming the file DOES refire with a documented message; `--update-baseline` round-trips byte-stable; tests cover both.

### 2. Version-pinned badges + validity window (small, high visibility)

Problem (npm staleness thread): grades float past the code they graded.
Design:

- Card gains `subject.revision` (commit sha for git targets, version pin for npm targets) and top-level `validFrom` / `validUntil` (default 30 days, configurable).
- Bound badge embeds the pinned ref: `name@x.y.z` or short sha in the badge SVG text/aria-label; badge links to the evidence page which shows revision + date prominently.
- Registry pages already record sha externally; promote it into the card so the invariant holds for self-serve users too.
- Done criteria: rescan of a changed target produces a new card whose badge does not match the old page; methodology page documents the 30-day default and the rot policy.

### 3. Credential-exposure rules CRED-01/02/03 (the LocalLLaMA ask)

Signals already collected (`permissions.secrets`, `permissions.envVars`). New rules, each with explicit confidence:

- **CRED-01, long-lived credential handed to server (high severity, medium confidence).** Triggers when credential-shaped env/config (`*_KEY|*_TOKEN|*_SECRET|*_PASSWORD|*_PRIVATE`, high-entropy literals 20+ chars) reaches a server/client spawn path with NO broker/TTL signal in file (`AssumeRole`, `getSessionToken`, `expiresIn`, `durationSeconds`, `ttl`, `lease`, case-insensitive). Message states the limit: static sees the handoff, not the TTL. Never claim proof of "long-lived".
- **CRED-02, hardcoded static secret literal (high severity, high confidence).** Provider patterns (`AKIA`, `ghp_`, `github_pat_`, `sk-live/test-`, `xox*`, PEM blocks) plus generic key/value with entropy gate (>= 3.5) and stopword rejection (`example|test|placeholder|xxx|changeme|dummy`). `ASIA` (STS-temp) prefix downgrades to info with "verify scope" messaging.
- **CRED-03, secret-read plus network-egress in same scope (medium severity, medium confidence, exfil shape).** Same-scope AST confirmation fails CI only when flow is confirmed; file-level co-occurrence warns with "unconfirmed flow" wording and never fails CI alone.
- Exclusions: `*.test.*`, `fixtures/`, `examples/`, `*.md` never confer findings (consistent with existing prose-skipping).
- Done criteria: each rule ships with positive, negative, and adversarial fixtures (attack strings in strings/comments must not fire); docs state the static-visibility limit in one paragraph per rule.

### 4. Signed Trust Cards (make "verifiable" literally true)

Problem (EU AI Act thread): the badge is currently a link, not proof.
Design (npm-provenance model, the combination the ecosystem already standardized):

- Card content becomes an in-toto Statement v1 with custom predicate `https://opentrustbench.com/trust-card/v1`; builder fields follow SLSA provenance conventions. Schema string stays `opentrustbench/trust-card/v1` for back-compat; envelope version noted in docs.
- Distribution as Sigstore bundle: `trust-card.json` (canonical bytes: UTF-8, sorted keys) plus `trust-card.json.sigstore.json` (DSSE envelope + Fulcio cert + Rekor entry). Libraries: `@sigstore/sign` / `@sigstore/verify`. CI issuance is keyless via GHA OIDC (`id-token: write`); verify policy pins issuer `https://token.actions.githubusercontent.com` plus workflow-identity regexp.
- Document the offline caveat explicitly: true offline-from-zero is impossible with Sigstore; `verify --offline` uses cached TUF root plus bundled proofs and fails closed when stale. Optional later: minisign/ed25519 detached sidecar for air-gapped consumers (same keypair, different encoding), never presented as identity-equivalent.
- Target SLSA Build L2 (hosted, signed provenance). Do not claim L3.
- Done criteria: `sign` in CI plus `verify` against a tampered card fails with a clear reason at each check stage (digest mismatch, identity mismatch, Rekor absence); interop test with `cosign verify-blob-attestation`; docs carry the offline caveat verbatim.

### 5. Per-rule fixture harness + confidence + suppressions (FP program)

- Every rule (old + new) gets positive/negative/adversarial fixtures run in CI.
- Add per-rule `confidence` (high/medium/low), decoupled from severity. CI gate becomes `severity >= threshold AND confidence >= threshold` (CRED-03-medium warns, never fails alone).
- `opentrustbench.yaml` gains an `ignore` section: paths, per-rule paths with required `reason`, and exact-fingerprint findings with required `reason` plus optional `expires`. Inline suppression `// opentrustbench-ignore RULE-ID -- reason` with optional expiry. Unknown IDs, missing reasons, expired entries warn, never silent. Ship `--explain <fingerprint>` printing rule, snippet, confidence, and which clause matched.
- Done criteria: fixture suite green; an expired suppression produces a warning in test; `--explain` output verified against a known fixture.

---

## v0.3.0 — engine upgrade (~6-8 weekends)

### 6. AST parsing for JS/TS behind a sink-finder interface

Research verdict: use the TypeScript compiler API parse-only (`ts.createSourceFile`, never `createProgram`/checker in the scan path). It is the only option satisfying all three hard constraints today (pure JS, no toolchain, fast enough at current corpus sizes) and it avoids a verified tree-sitter native-build failure on modern Node. oxc-parser stays as a future opt-in (`try require, fallback ts`) once profiling proves parse is the bottleneck; tree-sitter stays rejected for JS/TS (revisit only for Python, WASM build preferred).

Isolate behind `parseFile(): SinkEvents` so the parser is swappable; rule logic ports 1:1 later since both APIs expose CallExpression/MemberExpression/literal-vs-identifier shapes. Regex rules remain as fallback per file when parsing fails. Done criteria: benchmark fixture corpus shows zero FP regression vs regex suite, parse failures fall back silently with a debug log line, no new runtime dependency beyond `typescript` promoted from devDep (measure and record the packed-size delta in the PR).

### 7. EU AI Act evidence pack (artifact, not certification)

Framing (legally precise): Trust Cards are governance evidence INPUT for deployer files (capabilities, permissions, limitations), never conformity evidence. They cannot satisfy Art. 50(2) marking or 50(4) labelling duties and must never say certified or compliant.

- Ship `docs/EU-AI-ACT-EVIDENCE.md`: article-by-article mapping (Art. 50 paras 1-5 duties for providers vs deployers, what a Trust Card supports: vendor due-diligence file, capability/limitation annex, pre-deployment risk inventory, change-monitoring log), plus pointers to Commission Guidelines C(2026)5054, the Transparency Code of Practice, EN 18286 (Annex ZA mapping once OJ-listed), and ISO/IEC 42001 for management-system mapping (noting 42001 alone gives no presumption of conformity).
- Card gains optional deployer fields: intended use, deployment context, known limitations, human-review pointer. All optional, all documentary.
- Track (do not hard-code): OJ citation status of EN 18286, final watermark/C2PA technical references, the disputed AI Omnibus grace dates. The doc carries a "last checked" date and a re-check reminder.
- Done criteria: a reviewer can assemble a deployer evidence folder from CLI outputs alone following only this doc; legal-adjacent claims reviewed line by line against the sources below; methodology page links it with the evidence-input wording intact.

### 8. Dependency re-scan depth

Lockfile-aware, recursive, with reachability shading (a vulnerable dep never imported ranks below one in the hot path). Keep `npm audit --package-lock-only` as the data source where lockfiles exist; document the pip-audit/Trivy gap instead of faking it.

---

## Later (only if traction justifies)

9. **Runtime guidance profiles.** Never execute code. Emit least-privilege run manifests instead (minimal env allowlist, read-only mounts, egress policy). Answers "what happens after install" without becoming a sandbox company.
10. **Eval lab v2.** Real workflow execution in containers. The simulated eval is the weakest honesty-model limb long term; do not touch it until then.
11. **Registry expansion.** Top npm/PyPI agent packages alongside MCP servers. Same snapshot + sha + weekly discipline.
12. **Python AST.** Second parser only after the JS/TS interface proves itself.

## Sequencing within v0.2.0

Baseline diff first (unblocks every CI user), pinned badges second (small, visible), credential rules plus fixtures third (one workstream), signing fourth (touches the card schema once, do it while cards are open). Item 0 ships with this doc.

## Sources (authoritative, checked Sept 2026)

- SLSA provenance spec: https://slsa.dev/spec/v1.0/provenance
- Sigstore model (Fulcio/Rekor/TUF): https://docs.sigstore.dev/
- npm provenance reference: https://docs.npmjs.com/generating-provenance-statements
- EU AI Act Art. 50 text: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50
- Commission transparency Guidelines C(2026)5054: https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems
- CodeQL fingerprinting: https://github.com/github/codeql-action/blob/main/src/fingerprints.ts
- Semgrep baseline scans: https://docs.semgrep.dev/semgrep-ci/findings-ci
- Gitleaks config/baseline/allowlist: https://github.com/gitleaks/gitleaks
- TruffleHog verified/unverified model: https://github.com/trufflesecurity/trufflehog
- oxc parser: https://oxc.rs/docs/guide/usage/parser.html

## Open unknowns (re-verify before building, not assumed)

- Sigstore offline-with-inclusion-proof behavior against live TUF/Rekor; test before promising `verify --offline` semantics.
- Head-to-head parse benchmarks on an agent/MCP corpus; all speed claims above are vendor statements, and the doc says so where it matters.
- EN 18286 OJ citation status and final watermark/C2PA references; the evidence doc must carry last-checked dates.
- No prior static classifier for long-lived vs brokered credentials was found; CRED-01/03 are heuristics with stated confidence, and the doc must keep saying that.
