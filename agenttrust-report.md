# AgentTrust Evaluation Report

> **Capability:** `agenttrust-monorepo` (mcp-server)  
> **Trust Grade:** **F** (36/100)  
> **Confidence:** HIGH  
> **Date:** 2026-09-09T09:35:35.240Z
>
> Static analysis only (8-rule suite, OWASP-mapped). Not a certification or penetration test.

---

## 🛡️ Trust Score Breakdown

| Category | Score | Status |
|---|---|---|
| **Security** | 0/100 | ⚠️ Risk Detected |
| **Permissions** | 10/100 | Scope: `excessive` |
| **Provenance** | 90/100 | Signals present |
| **Reliability** | 75/100 | Standard |
| **Stability** | 90/100 | Lockfile: Yes |

**Rationale:** Score constrained by 14 critical and 4 high-severity findings.

---

## 🎯 Fix this week (18 critical/high)

- **[CRITICAL] Direct Prompt Concatenation (Injection Vulnerability)** — `examples/vulnerable-mcp-server/server.ts:24` (AT-SEC-001, LLM01): Use parameterized messages, structured schema validation (Zod), and clear boundary delimiters.
- **[CRITICAL] Hardcoded Credential or API Secret** — `examples/vulnerable-mcp-server/server.ts:11` (AT-SEC-002, LLM02): Move credentials to secure environment variables or a key vault. Never commit API keys.
- **[CRITICAL] Unbounded Dynamic Shell Execution** — `examples/vulnerable-mcp-server/server.ts:16` (AT-SEC-003, ASI02): Strictly restrict shell execution to an immutable allowlist of binary commands with explicit argument arrays, or execute inside microVM sandboxes.
- **[CRITICAL] eval() / Function Constructor Invocation** — `packages/core/src/tests/core.test.ts:53` (AT-SEC-004, ASI05): Eliminate eval(). Use safe AST parsers or isolated sandboxes (e.g. E2B Firecracker microVMs).
- **[CRITICAL] Unbounded Dynamic Shell Execution** — `packages/core/src/tests/integrity.test.ts:159` (AT-SEC-003, ASI02): Strictly restrict shell execution to an immutable allowlist of binary commands with explicit argument arrays, or execute inside microVM sandboxes.
- **[CRITICAL] Unbounded Dynamic Shell Execution** — `packages/core/src/tests/integrity.test.ts:166` (AT-SEC-003, ASI02): Strictly restrict shell execution to an immutable allowlist of binary commands with explicit argument arrays, or execute inside microVM sandboxes.
- **[CRITICAL] eval() / Function Constructor Invocation** — `packages/core/src/tests/integrity.test.ts:32` (AT-SEC-004, ASI05): Eliminate eval(). Use safe AST parsers or isolated sandboxes (e.g. E2B Firecracker microVMs).
- **[CRITICAL] eval() / Function Constructor Invocation** — `packages/core/src/tests/integrity.test.ts:33` (AT-SEC-004, ASI05): Eliminate eval(). Use safe AST parsers or isolated sandboxes (e.g. E2B Firecracker microVMs).
- **[CRITICAL] eval() / Function Constructor Invocation** — `packages/core/src/tests/integrity.test.ts:34` (AT-SEC-004, ASI05): Eliminate eval(). Use safe AST parsers or isolated sandboxes (e.g. E2B Firecracker microVMs).
- **[CRITICAL] eval() / Function Constructor Invocation** — `packages/core/src/tests/integrity.test.ts:112` (AT-SEC-004, ASI05): Eliminate eval(). Use safe AST parsers or isolated sandboxes (e.g. E2B Firecracker microVMs).
- **[CRITICAL] eval() / Function Constructor Invocation** — `packages/core/src/tests/integrity.test.ts:124` (AT-SEC-004, ASI05): Eliminate eval(). Use safe AST parsers or isolated sandboxes (e.g. E2B Firecracker microVMs).
- **[CRITICAL] eval() / Function Constructor Invocation** — `packages/core/src/tests/integrity.test.ts:140` (AT-SEC-004, ASI05): Eliminate eval(). Use safe AST parsers or isolated sandboxes (e.g. E2B Firecracker microVMs).
- **[CRITICAL] Unbounded Dynamic Shell Execution** — `scripts/build-reports.mjs:24` (AT-SEC-003, ASI02): Strictly restrict shell execution to an immutable allowlist of binary commands with explicit argument arrays, or execute inside microVM sandboxes.
- **[CRITICAL] Unbounded Dynamic Shell Execution** — `scripts/seed-registry.mjs:113` (AT-SEC-003, ASI02): Strictly restrict shell execution to an immutable allowlist of binary commands with explicit argument arrays, or execute inside microVM sandboxes.
- **[HIGH] Unrestricted Recursive File Deletion / Modification** — `examples/vulnerable-mcp-server/server.ts:31` (AT-SEC-005, ASI02): Enforce strict jail/root directories and require explicit human-in-the-loop confirmation before file deletions.
- **[HIGH] Unfiltered SSRF / Arbitrary Network Egress** — `packages/core/src/tests/integrity.test.ts:160` (AT-SEC-006, LLM06): Define an explicit egress domain allowlist and block private IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254).
- **[HIGH] Unfiltered SSRF / Arbitrary Network Egress** — `packages/core/src/tests/integrity.test.ts:169` (AT-SEC-006, LLM06): Define an explicit egress domain allowlist and block private IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254).
- **[HIGH] Missing Human-in-the-Loop Gate for Critical Actions** — `packages/core/src/tests/integrity.test.ts:99` (AT-COMP-001, ASI09): Mark high-impact tools with approval requirements and verify operator signature before dispatch.

---

## 🚨 All Security Findings (19 Total)

| Severity | Rule | Title | Location |
|---|---|---|---|
| **CRITICAL** | `AT-SEC-001` | Direct Prompt Concatenation (Injection Vulnerability) | `examples/vulnerable-mcp-server/server.ts:24` |
| **CRITICAL** | `AT-SEC-002` | Hardcoded Credential or API Secret | `examples/vulnerable-mcp-server/server.ts:11` |
| **CRITICAL** | `AT-SEC-003` | Unbounded Dynamic Shell Execution | `examples/vulnerable-mcp-server/server.ts:16` |
| **CRITICAL** | `AT-SEC-004` | eval() / Function Constructor Invocation | `packages/core/src/tests/core.test.ts:53` |
| **CRITICAL** | `AT-SEC-003` | Unbounded Dynamic Shell Execution | `packages/core/src/tests/integrity.test.ts:159` |
| **CRITICAL** | `AT-SEC-003` | Unbounded Dynamic Shell Execution | `packages/core/src/tests/integrity.test.ts:166` |
| **CRITICAL** | `AT-SEC-004` | eval() / Function Constructor Invocation | `packages/core/src/tests/integrity.test.ts:32` |
| **CRITICAL** | `AT-SEC-004` | eval() / Function Constructor Invocation | `packages/core/src/tests/integrity.test.ts:33` |
| **CRITICAL** | `AT-SEC-004` | eval() / Function Constructor Invocation | `packages/core/src/tests/integrity.test.ts:34` |
| **CRITICAL** | `AT-SEC-004` | eval() / Function Constructor Invocation | `packages/core/src/tests/integrity.test.ts:112` |
| **CRITICAL** | `AT-SEC-004` | eval() / Function Constructor Invocation | `packages/core/src/tests/integrity.test.ts:124` |
| **CRITICAL** | `AT-SEC-004` | eval() / Function Constructor Invocation | `packages/core/src/tests/integrity.test.ts:140` |
| **CRITICAL** | `AT-SEC-003` | Unbounded Dynamic Shell Execution | `scripts/build-reports.mjs:24` |
| **CRITICAL** | `AT-SEC-003` | Unbounded Dynamic Shell Execution | `scripts/seed-registry.mjs:113` |
| **HIGH** | `AT-SEC-005` | Unrestricted Recursive File Deletion / Modification | `examples/vulnerable-mcp-server/server.ts:31` |
| **HIGH** | `AT-SEC-006` | Unfiltered SSRF / Arbitrary Network Egress | `packages/core/src/tests/integrity.test.ts:160` |
| **HIGH** | `AT-SEC-006` | Unfiltered SSRF / Arbitrary Network Egress | `packages/core/src/tests/integrity.test.ts:169` |
| **HIGH** | `AT-COMP-001` | Missing Human-in-the-Loop Gate for Critical Actions | `packages/core/src/tests/integrity.test.ts:99` |
| **MEDIUM** | `AT-SEC-007` | Raw Secret Leakage in Debug Logging | `examples/vulnerable-mcp-server/server.ts:25` |

---

## 🔑 Permissions Declared & Detected

- **Shell Execution:** ⚠️ Enabled ()
- **Network Egress:** ⚠️ Outbound requests enabled
- **Filesystem Modification:** Write enabled
- **Filesystem Deletion:** ⚠️ File deletion enabled
- **Human In The Loop:** None

---

*Generated automatically by [AgentTrust](https://eulogik.github.io/AgentTrust)*
