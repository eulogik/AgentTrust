# OpenTrustBench Evaluation Report

> **Capability:** `LexRAG` (generic-agent)  
> **Trust Grade:** **C** (68/100)  
> **Confidence:** MEDIUM  
> **Date:** 2026-09-11T08:00:08.141Z
>
> Static analysis only (8-rule suite, OWASP-mapped). Not a certification or penetration test.

---

## 🛡️ Trust Score Breakdown

| Category | Score | Status |
|---|---|---|
| **Security** | 40/100 | ⚠️ Risk Detected |
| **Permissions** | 90/100 | Scope: `moderate` |
| **Provenance** | 75/100 | Unverified origin |
| **Reliability** | 85/100 | Standard |
| **Stability** | 75/100 | Lockfile: No |

**Rationale:** Score constrained by 0 critical and 4 high-severity findings.

---

## 🎯 Fix this week (4 critical/high)

- **[HIGH] Unfiltered SSRF / Arbitrary Network Egress** — `scrapers/india_scraper.py:35` (AT-SEC-006, LLM06): Define an explicit egress domain allowlist and block private IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254).
- **[HIGH] Unfiltered SSRF / Arbitrary Network Egress** — `scrapers/uae_scraper.py:28` (AT-SEC-006, LLM06): Define an explicit egress domain allowlist and block private IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254).
- **[HIGH] Unfiltered SSRF / Arbitrary Network Egress** — `scrapers/uae_scraper.py:58` (AT-SEC-006, LLM06): Define an explicit egress domain allowlist and block private IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254).
- **[HIGH] Unfiltered SSRF / Arbitrary Network Egress** — `ui/app.js:55` (AT-SEC-006, LLM06): Define an explicit egress domain allowlist and block private IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254).

---

## 🚨 All Security Findings (4 Total)

| Severity | Rule | Title | Location |
|---|---|---|---|
| **HIGH** | `AT-SEC-006` | Unfiltered SSRF / Arbitrary Network Egress | `scrapers/india_scraper.py:35` |
| **HIGH** | `AT-SEC-006` | Unfiltered SSRF / Arbitrary Network Egress | `scrapers/uae_scraper.py:28` |
| **HIGH** | `AT-SEC-006` | Unfiltered SSRF / Arbitrary Network Egress | `scrapers/uae_scraper.py:58` |
| **HIGH** | `AT-SEC-006` | Unfiltered SSRF / Arbitrary Network Egress | `ui/app.js:55` |

---

## 🔑 Permissions Declared & Detected

- **Shell Execution:** ✅ Disabled
- **Network Egress:** ⚠️ Outbound requests enabled
- **Filesystem Modification:** Read only
- **Filesystem Deletion:** ✅ None
- **Human In The Loop:** None

---

*Generated automatically by [OpenTrustBench](https://www.opentrustbench.com)*
