# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | Yes — security fixes backported within the 0.1 line |
| < 0.1 | No |

## Reporting a vulnerability

Please **do not open a public issue** for suspected vulnerabilities in
OpenTrustBench itself. Instead:

1. Open a [private security advisory](https://github.com/eulogik/OpenTrustBench/security/advisories/new), or
2. Open a regular issue at <https://github.com/eulogik/OpenTrustBench/issues/new>
   if the above is unavailable, marked `security`, with exploit details omitted.

We aim to acknowledge reports within 5 business days. There is no paid bounty
program; reporters are credited in release notes on request.

## Scope

In scope: the scanner engines (`packages/core`), the CLI (`packages/cli`),
the GitHub Action (`packages/action`), and this site.

Out of scope: grades the scanner assigns to **third-party** projects — those
are heuristic findings for local triage, not vulnerability reports. Run the
CLI, triage the findings, and report confirmed issues to the upstream project.

## What the scanner does not do

OpenTrustBench is a static heuristic scanner. It never executes scanned code,
exfiltrates data, or phones home — all analysis runs locally on your machine.
