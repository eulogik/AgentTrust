# AgentTrust — Product Walkthrough & Launch Summary

> **The neutral trust, reliability, and evidence layer for autonomous AI agents.**

---

## 1. What Was Built

We created and deployed the full production codebase for **AgentTrust** inside [`/Users/gautamkishore/Code/AI-Opportunity-Product/agenttrust`](file:///Users/gautamkishore/Code/AI-Opportunity-Product/agenttrust).

### Monorepo Architecture

```
agenttrust/
├── packages/
│   ├── core/                        # Engine & Analysis Plane
│   │   ├── src/
│   │   │   ├── types/index.ts       # Type definitions & Schemas
│   │   │   ├── analysis/            # Capability & AST detectors
│   │   │   │   ├── detector.ts      # MCP, Skill, Claude, OpenClaw detector
│   │   │   │   ├── static-analyzer.ts # OWASP Agentic Top 10 rule suite
│   │   │   │   └── permission-extractor.ts # Egress, FS, Shell, Secrets scope
│   │   │   ├── trust/               # Scoring & Trust Card generation
│   │   │   │   ├── scorer.ts        # Weighted multi-dimensional scoring
│   │   │   │   ├── provenance.ts    # Signatures, SBOM, Lockfile checks
│   │   │   │   └── card-builder.ts  # agenttrust/trust-card/v1 builder
│   │   │   ├── attacks/             # Adversarial red-team simulator
│   │   │   │   └── attack-engine.ts # Prompt injection, Shell escape, SSRF probes
│   │   │   ├── eval/                # Workflow reliability & regressions
│   │   │   │   └── workflow-eval.ts # Trajectory assertion tester
│   │   │   └── reporters/           # Export pipelines
│   │   │       ├── sarif.ts         # SARIF 2.1.0 for GitHub Code Scanning
│   │   │       └── markdown.ts      # Compliance & audit reports
│   │   └── dist/index.js            # Self-contained runtime bundle
│   │
│   ├── cli/                         # Developer CLI & Terminal Interface
│   │   ├── src/index.ts             # CLI command dispatcher
│   │   └── dist/index.js            # Executable `npx agenttrust` binary
│   │
│   └── action/                      # Drop-in CI/CD GitHub Action
│       └── action.yml               # Reusable GitHub Action step
│
├── examples/                        # Real-world test fixtures
│   ├── vulnerable-mcp-server/       # Flawed MCP server with critical injections
│   ├── secure-agent-skill/          # Gold-certified least-privilege skill
│   └── sample-workflow.yaml         # Business workflow trajectory suite
│
├── web/                             # Interactive Web Explorer & Dashboard
│   └── public/index.html            # Dark-mode live scan & attack UI
│
├── README.md                        # Developer quickstart & documentation
└── LICENSE                          # MIT License
```

---

## 2. Core Features & Verified Capabilities

### 🛡️ 1. Automated Capability Detection & Static Analysis
- Detects **MCP servers**, **Agent Skills** (`SKILL.md`), **Claude Desktop configs**, **OpenClaw plugins**, and **LangGraph/LangChain** agents automatically.
- Analyzes code against **OWASP Agentic AI Top 10 2026** rules:
  - `AT-SEC-001` (LLM01): Direct prompt concatenation / injection
  - `AT-SEC-002` (LLM08): Hardcoded API keys and secrets
  - `AT-SEC-003` (ASI02): Unbounded dynamic shell execution
  - `AT-SEC-004` (LLM02): `eval()` and Function constructor usage
  - `AT-SEC-005` (ASI03): Unrestricted recursive file deletion
  - `AT-SEC-006` (ASI07): Unfiltered SSRF and arbitrary network egress
  - `AT-SEC-007` (LLM06): Secret leakage in debug logging
  - `AT-COMP-001` (LLM08): Missing human-in-the-loop approval triggers

### 🏷️ 2. Official Trust Card (`agenttrust/trust-card/v1`)
Computes an objective, explainable score (0–100) and letter grade (**A**, **B**, **C**, **D**, **F**) across 5 weighted dimensions:
- **Security (35%)**
- **Permissions Scope (25%)**
- **Provenance & SBOM (15%)**
- **Reliability (15%)**
- **Stability (10%)**

### ⚡ 3. "Attack My Agent" Adversarial Suite
Simulates automated red-teaming attacks against the agent:
- Direct Prompt Injection Override
- Host Shell Escape Probing
- SSRF & Network Exfiltration Probing
- Memory Poisoning & Secret Harvesting
- Unauthenticated Destructive Actions

### 🧪 4. Workflow Reliability & Regression Lab
Executes declarative workflow test suites (`sample-workflow.yaml`), measures cost per execution, step duration, policy compliance, and flags regression diffs when models or skills update.

---

## 3. How to Run and Test

From `/Users/gautamkishore/Code/AI-Opportunity-Product/agenttrust`:

```bash
# 1. Scan an insecure MCP server (triggers findings & Grade F)
node packages/cli/dist/index.js scan examples/vulnerable-mcp-server

# 2. Scan a certified secure Agent Skill (Grade B/A)
node packages/cli/dist/index.js scan examples/secure-agent-skill

# 3. Launch adversarial red-teaming attack simulation
node packages/cli/dist/index.js attack examples/vulnerable-mcp-server

# 4. Run workflow trajectory evaluation & regression tests
node packages/cli/dist/index.js eval examples/sample-workflow.yaml

# 5. Browse the public verified capability registry
node packages/cli/dist/index.js registry

# 6. Generate an embeddable markdown shield badge
node packages/cli/dist/index.js badge examples/secure-agent-skill
```

---

## 4. Output Artifacts Generated on Every Scan

1. **`agenttrust-report.sarif`** — Native SARIF 2.1.0 format that automatically populates the GitHub Security tab and PR annotations.
2. **`agenttrust-report.md`** — Markdown evaluation summary ready for EU AI Act Article 50 compliance audits.
3. **`trust-card.json`** — Machine-readable Trust Card for programmatic gating in deployment pipelines.
