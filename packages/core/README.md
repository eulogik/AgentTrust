# @opentrustbench/core

[![npm version](https://img.shields.io/npm/v/@opentrustbench/core?color=cyan&label=npm)](https://www.npmjs.com/package/@opentrustbench/core)
[![License](https://img.shields.io/github/license/eulogik/OpenTrustBench.svg)](https://github.com/eulogik/OpenTrustBench/blob/main/LICENSE)

Core engines for AI agent trust scoring, OWASP analysis, permission extraction, and attack detection. Powers the [`@opentrustbench/cli`](https://www.npmjs.com/package/@opentrustbench/cli).

## Install

```bash
npm install @opentrustbench/core
```

Requires Node.js 18+. Pure ESM (`"type": "module"`, NodeNext resolution).

## What's Inside

| Engine | Description |
|--------|-------------|
| **Static Analyzer** | 8 regex rules (`AT-SEC-001`–`007` + `AT-COMP-001`) mapped to OWASP Agentic Top 10 and LLM Top 10 2025 |
| **Trust Scorer** | Computes a 0–100 score and A–F grade from security findings, permission scope, provenance, reliability, and stability |
| **Permission Extractor** | Analyzes code for shell, network, filesystem, browser, email, DB, and human-approval capabilities |
| **Attack Analyzer** | Static-heuristic adversarial checks (injection override, command execution, exfiltration, memory poisoning, destructive ops) |
| **Workflow Eval** | Parses and validates workflow suites in simulation mode |
| **SARIF Reporter** | Generates SARIF 2.1.0 output for GitHub Code Scanning |
| **Markdown Reporter** | Generates human-readable audit reports |
| **Card Builder** | Produces `opentrustbench/trust-card/v1` machine-readable credentials |

## Usage

```typescript
import { scanTarget, buildTrustCard, generateSarif } from "@opentrustbench/core";

const findings = await scanTarget("./my-mcp-server");
const card = buildTrustCard(findings);
const sarif = generateSarif(findings);
```

## OWASP Mappings

| Rule | Detects | OWASP |
|------|---------|-------|
| `AT-SEC-001` | Direct prompt concatenation (injection) | LLM01 |
| `AT-SEC-002` | Hardcoded credential or API secret | LLM02 |
| `AT-SEC-003` | Unbounded dynamic shell execution | ASI02 |
| `AT-SEC-004` | `eval()` / Function constructor | ASI05 |
| `AT-SEC-005` | Unrestricted recursive file deletion | ASI02 |
| `AT-SEC-006` | Unfiltered SSRF / arbitrary network egress | LLM06 |
| `AT-SEC-007` | Raw secret leakage in debug logging | LLM02 |
| `AT-COMP-001` | Missing human-in-the-loop gate | ASI09 |

## Honesty Model

- Attack engine runs in **static-heuristic mode**: results derive from static findings + permission manifest; no payloads execute.
- Workflow eval is **simulation mode**: suites are parsed and validated; nothing runs, costs/durations stay 0.
- Trust Cards are **evidence input**, never a certification or compliance verdict.

## Links

- **Website:** [opentrustbench.com](https://www.opentrustbench.com)
- **CLI:** [@opentrustbench/cli](https://www.npmjs.com/package/@opentrustbench/cli)
- **Source:** [github.com/eulogik/OpenTrustBench](https://github.com/eulogik/OpenTrustBench)
- **Docker:** [`eulogik/opentrustbench`](https://hub.docker.com/r/eulogik/opentrustbench)
- **PyPI:** [opentrustbench](https://pypi.org/project/opentrustbench/)

## License

Apache-2.0 — © 2026 [Eulogik](https://eulogik.com)
