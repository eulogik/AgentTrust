# @opentrustbench/cli

[![npm version](https://img.shields.io/npm/v/@opentrustbench/cli?color=cyan&label=npm)](https://www.npmjs.com/package/@opentrustbench/cli)
[![License](https://img.shields.io/github/license/eulogik/OpenTrustBench.svg)](https://github.com/eulogik/OpenTrustBench/blob/main/LICENSE)
[![Rules](https://img.shields.io/badge/Rules-8%20OWASP--mapped-cyan.svg)](https://www.opentrustbench.com/methodology.html)
[![Grades](https://img.shields.io/badge/Grades-A--F-blue.svg)](https://www.opentrustbench.com/r/)

Free, local-first security scanner for AI agents and MCP servers. 8 OWASP-mapped rules, Trust Cards graded A–F, SARIF output, CI gate.

## Install

```bash
npm install -g @opentrustbench/cli
```

Or run directly with no install:

```bash
npx @opentrustbench/cli scan .
```

## Quick Start

```bash
# Scan a local folder, MCP server, or Agent Skill
opentrustbench scan ./my-mcp-server

# Scan a GitHub repository
opentrustbench scan https://github.com/owner/repo

# Scan an npm package
opentrustbench scan some-npm-package --npm

# Fail CI when findings meet a severity threshold
opentrustbench scan ./my-mcp-server --fail-on high

# Run the OWASP Agentic Top 10 Adversarial Attack Suite
opentrustbench attack ./my-mcp-server

# Evaluate workflow reliability
opentrustbench eval ./tests/workflow.yaml
```

## What You Get

| Output | Description |
|--------|-------------|
| **Trust Card** | Machine-readable credential (`opentrustbench/trust-card/v1`) with grade, score, findings, and permissions |
| **SARIF Report** | Industry-standard format for GitHub Security tab integration |
| **Markdown Report** | Human-readable audit report for compliance and review |
| **Grade Badge** | Shareable SVG badge linking to a public report page |

## Command Reference

| Command | What it does |
|---------|--------------|
| `scan <path\|url\|repo>` | Scan a target, print graded findings, write `trust-card.json` + SARIF/Markdown reports |
| `attack <path-or-repo>` | OWASP-aligned adversarial analysis with fix guidance (static-heuristic mode) |
| `eval <workflow.yaml>` | Parse and validate a workflow suite (simulation mode — nothing executes) |
| `badge <path>` | Print embeddable Markdown for the target's grade badge |
| `init` | Scaffold an `opentrustbench.yaml` config |
| `registry` | Browse the public registry of scanned servers |

`scan` flags: `--github`, `--npm`, `--fail-on info|low|medium|high|critical`, `--format terminal|json|sarif|md`, `--output-dir <dir>`, `--quiet`, `--no-color`.

## CI Integration

```yaml
# .github/workflows/trust.yml
- uses: eulogik/opentrustbench-action@v0.1.3
  with:
    target: .
    fail-on: high
```

Or manually:

```bash
opentrustbench scan . --fail-on high --quiet --format sarif --output-dir ./trust
```

## Trust Card Example

```json
{
  "schema": "opentrustbench/trust-card/v1",
  "subject": { "type": "agent-skill", "name": "Secure Data Auditor Skill" },
  "trustScore": {
    "overall": 88,
    "grade": "B",
    "breakdown": { "security": 100, "permissions": 100, "provenance": 50 }
  },
  "compatibility": ["claude-code", "cursor", "codex"]
}
```

## Grade Badge

Embed your trust score in your README:

```markdown
[![OpenTrustBench](https://www.opentrustbench.com/r/self-packages-cli.svg)](https://www.opentrustbench.com/r/self-packages-cli.html)
```

## Links

- **Website:** [opentrustbench.com](https://www.opentrustbench.com)
- **Registry:** [53 scanned MCP servers](https://www.opentrustbench.com/r/)
- **Methodology:** [How scoring works](https://www.opentrustbench.com/methodology.html)
- **Source:** [github.com/eulogik/OpenTrustBench](https://github.com/eulogik/OpenTrustBench)
- **Core library:** [@opentrustbench/core](https://www.npmjs.com/package/@opentrustbench/core)
- **GitHub Action:** [eulogik/opentrustbench-action](https://github.com/eulogik/opentrustbench-action)
- **Docker:** [`eulogik/opentrustbench`](https://hub.docker.com/r/eulogik/opentrustbench)
- **PyPI:** [opentrustbench](https://pypi.org/project/opentrustbench/)
- **Homebrew:** [eulogik/opentrustbench](https://github.com/eulogik/homebrew-opentrustbench)
- **VS Code:** [eulogik.opentrustbench](https://marketplace.visualstudio.com/items?itemName=eulogik.opentrustbench)

## What the scanner is (and isn't)

- **8-rule static suite**, OWASP-mapped (Agentic ASI01–ASI10, LLM LLM01–LLM10). Regex-based today — no AST yet.
- **`attack` is static-heuristic**: it re-analyzes scan findings + permissions. No payloads execute.
- **`eval` is simulation mode**: suites are parsed and validated; nothing runs, costs/durations stay 0.
- **Not a certification.** The Trust Card is a CI-grade credential, not a pentest or legal verdict.

## License

Apache-2.0 — © 2026 [Eulogik](https://eulogik.com)
