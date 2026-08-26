# AgentTrust 🛡️

> **The neutral trust, reliability, and evidence layer for autonomous AI agents, skills, and MCP tools.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![OWASP Agentic AI](https://img.shields.io/badge/OWASP-Agentic%20Top%2010-emerald.svg)](https://owasp.org)
[![EU AI Act](https://img.shields.io/badge/EU%20AI%20Act-Article%2050%20Ready-cyan.svg)](https://agenttrust.dev)

---

## ⚡ Why AgentTrust?

Autonomous AI agents execute shell commands, edit files, call APIs, and access private databases. Yet:
- **135,000+** exposed personal agent instances identified worldwide
- **Prompt injection** attacks are up **340% YoY**
- **<30%** of developers trust AI output without extensive manual verification

AgentTrust is the vendor-neutral trust infrastructure that answers:
1. **Can I trust this agent capability or MCP tool?**
2. **What permissions and egress boundaries does it require?**
3. **Can an attacker hijack its goal or poison its memory?**
4. **Will it reliably succeed at business workflows without regressions?**

---

## 🚀 Quick Start

Scan any agent capability in under 60 seconds:

```bash
# Scan a local folder, MCP server, or Agent Skill
npx agenttrust scan ./my-mcp-server

# Scan straight from GitHub or the npm registry
npx agenttrust scan https://github.com/owner/repo
npx agenttrust scan owner/repo --github
npx agenttrust scan some-npm-package --npm

# Fail CI when findings meet a severity threshold
npx agenttrust scan ./my-mcp-server --fail-on high

# Run the OWASP Agentic Top 10 Adversarial Attack Suite
npx agenttrust attack ./my-mcp-server

# Evaluate workflow reliability and detect regression diffs
npx agenttrust eval ./tests/workflow.yaml
```

---

## 📦 Monorepo Structure

- `packages/core` — Detection, static analysis, permission extraction, trust scoring, and attack simulation engines.
- `packages/cli` — Interactive terminal CLI with colorized reports, SARIF export, and trust badge generators.
- `packages/action` — Drop-in GitHub Action for CI/CD pipelines.
- `web` — Interactive Web Dashboard, live scanner demo, and Verified Capabilities Registry.
- `examples` — Test fixtures including vulnerable MCP servers and certified Agent Skills.

---

## 🛠️ Build & Test

```bash
# Run scan on vulnerable sample
npm run scan:vulnerable

# Run scan on secure sample
npm run scan:secure

# Run attack simulation demo
npm run attack:demo

# Run workflow evaluation lab
npm run eval:demo
```

---

## 📄 Output Formats

- **`trust-card.json`** — Machine-readable Trust Card specification (`agenttrust/trust-card/v1`)
- **`agenttrust-report.sarif`** — SARIF 2.1.0 report for native GitHub Code Scanning integration
- **`agenttrust-report.md`** — Markdown audit report for compliance & human review

---

## 📜 License

MIT © 2026 AgentTrust Contributors
