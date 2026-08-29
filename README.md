<p align="center">
  <a href="https://agenttrust.dev">
    <img src="https://agenttrust.dev/badge/b.svg" alt="AgentTrust Grade B" width="128">
  </a>
  <br>
  <strong>Trust &amp; Security for AI Agents &amp; MCP Servers</strong>
</p>

<h1 align="center">AgentTrust</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/agenttrust"><img src="https://img.shields.io/npm/v/agenttrust?color=cyan&label=npm" alt="npm version"></a>
  <a href="https://github.com/eulogik/AgentTrust/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://owasp.org"><img src="https://img.shields.io/badge/OWASP-Agentic%20Top%2010-34d399.svg" alt="OWASP Agentic AI"></a>
  <a href="https://agenttrust.dev"><img src="https://img.shields.io/badge/EU%20AI%20Act-Article%2050%20Ready-22d3ee.svg" alt="EU AI Act Ready"></a>
</p>

<p align="center">
  Scan your AI agent or MCP server for vulnerabilities.<br>
  Get a verifiable <strong>Trust Card</strong> with a public grade badge.
</p>

---

## What is AgentTrust?

AgentTrust is a trust and security verification platform for autonomous AI agents and MCP (Model Context Protocol) servers. It scans your codebase for vulnerabilities, maps findings to [OWASP Agentic AI Top 10](https://owasp.org/) and [OWASP LLM Top 10 2025](https://owasp.org/), generates a verifiable **Trust Card** with a letter grade, and provides a **shareable badge** for your README.

**Zero data retention.** Everything runs locally on your machine. No telemetry. No account required.

## Quick Start

```bash
# Scan a local folder, MCP server, or Agent Skill
npx agenttrust scan ./my-mcp-server

# Scan a GitHub repository
npx agenttrust scan https://github.com/owner/repo

# Scan an npm package
npx agenttrust scan some-npm-package --npm

# Fail CI when findings meet a severity threshold
npx agenttrust scan ./my-mcp-server --fail-on high

# Run the OWASP Agentic Top 10 Adversarial Attack Suite
npx agenttrust attack ./my-mcp-server

# Evaluate workflow reliability
npx agenttrust eval ./tests/workflow.yaml
```

## What You Get

| Output | Description |
|--------|-------------|
| **Trust Card** | Machine-readable credential (`agenttrust/trust-card/v1`) with grade, score, findings, and permissions |
| **SARIF Report** | Industry-standard format for GitHub Security tab integration |
| **Markdown Report** | Human-readable audit report for compliance and review |
| **Grade Badge** | Shareable SVG badge for your README ([example](https://agenttrust.dev/badge/a.svg)) |

## Grade Badge

Embed your trust score in your README:

```markdown
[![AgentTrust](https://agenttrust.dev/badge/a.svg)](https://agenttrust.dev/report/your-org/your-repo)
```

This tells buyers, auditors, and AI hosts that your agent has been verified.

## How It Works

1. **Scan** — Point `agenttrust` at a local directory, GitHub repo, or npm package
2. **Grade** — Receive a Trust Card with a letter grade (A–F) and security score (0–100)
3. **Share** — Embed your badge and link to the detailed report

## Features

- **18 detection rules** across shell injection, secret leaks, prompt injection, tool exploitation, and more
- **OWASP mapping** — Every finding tagged to OWASP Agentic Top 10 (ASI01–ASI10) and LLM Top 10 2025 (LLM01–LLM10)
- **Permission manifest** — Automatic extraction and scoping of agent permissions
- **Dependency audit** — `npm audit` integration for lockfile-based vulnerability detection
- **SARIF output** — Native GitHub Code Scanning integration
- **CI integration** — `--fail-on` severity gate for pipeline enforcement
- **GitHub Action** — Drop-in composite action for workflows
- **GitHub URL detection** — Scan any public repo by URL
- **EU AI Act evidence** — Timestamped, versioned artifacts for Article 50 compliance

## Professional Audits

Need a deeper assessment? [Get a professional audit](mailto:audit@agenttrust.dev?subject=Professional%20Audit%20Request) with manual code review, custom remediation plan, and EU AI Act evidence pack.

| Tier | Price | What You Get |
|------|-------|-------------|
| **Self-Serve** | Free | Unlimited local scans, Trust Card, badge, OWASP findings, SARIF |
| **Professional** | $2,500/target | Everything in Free + manual review, remediation plan, EU AI Act pack, debrief call |
| **Enterprise** | Custom | Everything in Professional + continuous monitoring, custom rules, SLA |

[Book an audit →](mailto:audit@agenttrust.dev?subject=Audit%20Request)

## Monorepo Structure

```
packages/
  core/     — Detection engines, OWASP rules, trust scoring, attack analysis
  cli/      — Terminal CLI with SARIF export and badge generation
  action/   — GitHub Action for CI/CD pipelines
web/        — Landing page and interactive demo
badges/     — Shareable grade badge SVGs
examples/   — Vulnerable and secure test fixtures
scripts/    — Verification and demo scripts
```

## Build & Test

```bash
npm install          # installs + builds via prepare
npm test             # build + 14 unit tests
node scripts/verify-demos.mjs  # end-to-end smoke checks
```

## Standards

- **OWASP Agentic AI Top 10** (ASI01–ASI10) — Published December 2025
- **OWASP LLM Top 10 2025** (LLM01–LLM10)
- **EU AI Act** Article 50 transparency obligations (enforceable August 2, 2026)
- **SARIF 2.1.0** for GitHub Code Scanning integration

## License

[Apache 2.0](LICENSE) © 2026 [Eulogik](https://eulogik.com)

---

<p align="center">
  <a href="https://agenttrust.dev">Website</a> ·
  <a href="https://github.com/eulogik/AgentTrust">GitHub</a> ·
  <a href="https://www.npmjs.com/package/agenttrust">npm</a> ·
  <a href="mailto:audit@agenttrust.dev">Get Audited</a>
</p>
