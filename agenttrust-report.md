# AgentTrust Evaluation Report

> **Capability:** `vulnerable-file-tools-mcp` (mcp-server)  
> **Trust Grade:** **D** (44/100)  
> **Confidence:** MEDIUM  
> **Date:** 2026-08-24T07:56:44.459Z

---

## 🛡️ Trust Score Breakdown

| Category | Score | Status |
|---|---|---|
| **Security** | 37/100 | ⚠️ Risk Detected |
| **Permissions** | 20/100 | Scope: `excessive` |
| **Provenance** | 50/100 | Unverified |
| **Reliability** | 75/100 | Standard |
| **Stability** | 75/100 | Lockfile: No |

**Rationale:** Score constrained by 1 critical and 2 high-severity findings.

---

## 🚨 Security Findings (4 Total)

| Severity | Rule | Title | Location |
|---|---|---|---|
| **CRITICAL** | `AT-SEC-003` | Unbounded Dynamic Shell Execution | `server.ts:16` |,| **HIGH** | `AT-SEC-005` | Unrestricted Recursive File Deletion / Modification | `server.ts:31` |,| **MEDIUM** | `AT-SEC-007` | Raw Secret Leakage in Debug Logging | `server.ts:25` |,| **HIGH** | `AT-COMP-001` | Missing Human-in-the-Loop Gate for Critical Actions | `server.ts:1` |

---

## 🔑 Permissions Declared & Detected

- **Shell Execution:** ⚠️ Enabled ()
- **Network Egress:** ✅ None
- **Filesystem Modification:** Read only
- **Filesystem Deletion:** ⚠️ File deletion enabled
- **Human In The Loop:** None

---

*Generated automatically by [AgentTrust](https://agenttrust.dev)*
