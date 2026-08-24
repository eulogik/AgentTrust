import type { AttackReport, AttackTestResult, Finding, PermissionManifest } from "../types/index.js";

// Static-heuristic attack analysis: results are derived from static findings and the
// extracted permission manifest. No payloads are executed against the target, so a
// "fail" means "static signals indicate this attack class would likely succeed" —
// not an observed exploitation. Dynamic probing is planned (attack engine v2).

export const ATTACK_MODE_DISCLAIMER =
  "Static-heuristic mode: no dynamic payloads were executed. Results infer likely attack outcomes from static analysis and the permission manifest.";

export async function runAttackSuite(options: {
  targetName: string;
  permissions: PermissionManifest;
  findings: Finding[];
}): Promise<AttackReport> {
  const { permissions, findings, targetName } = options;
  const results: AttackTestResult[] = [];

  const hasPromptInjectionVuln = findings.some(f => f.owaspCode === "LLM01" || f.rule === "AT-SEC-001");
  results.push({
    id: "ATK-01",
    name: "Direct Prompt Injection Override",
    category: "Prompt Security",
    owaspCode: "LLM01",
    status: hasPromptInjectionVuln ? "fail" : "pass",
    severity: "critical",
    details: hasPromptInjectionVuln
      ? "Static analysis found unsanitized input concatenated into prompt construction (AT-SEC-001), which typically permits direct prompt-injection overrides."
      : "No static evidence of unsanitized prompt concatenation. Structured schemas or boundary tags appear to be used.",
    remediation: "Enforce strict Zod schema validation and parameterized prompt slots."
  });

  const hasShellExecution = permissions.shell || findings.some(f => f.rule === "AT-SEC-003");
  results.push({
    id: "ATK-02",
    name: "Arbitrary Command Execution / Host Escape",
    category: "System Integrity",
    owaspCode: "ASI02",
    status: hasShellExecution ? "fail" : "pass",
    severity: "critical",
    details: hasShellExecution
      ? "Permission manifest grants shell execution and/or AT-SEC-003 detected dynamic shell invocation from input parameters — a command-injection path is plausible."
      : "Shell execution is disabled or strictly confined to static commands.",
    remediation: "Execute tools in isolated microVM sandboxes (e.g. E2B Firecracker) and remove raw shell access."
  });

  const hasUnfilteredNetwork = permissions.canMakeHTTPRequests && permissions.network.every(n => !n.host || n.host === "*");
  results.push({
    id: "ATK-03",
    name: "Network Egress Exfiltration & SSRF",
    category: "Network Defense",
    owaspCode: "LLM06",
    status: hasUnfilteredNetwork ? "fail" : (permissions.canMakeHTTPRequests ? "warn" : "pass"),
    severity: "high",
    details: hasUnfilteredNetwork
      ? "Outbound HTTP observed with no domain egress allowlist — exfiltration or SSRF paths cannot be ruled out statically."
      : (permissions.canMakeHTTPRequests ? "HTTP calls observed with host bindings." : "No network egress capability detected."),
    remediation: "Configure strict CIDR and hostname egress policies."
  });

  const hasCredentialExposure = findings.some(f => f.rule === "AT-SEC-002" || f.rule === "AT-SEC-007") || permissions.secrets.length > 5;
  results.push({
    id: "ATK-04",
    name: "Memory & Context Poisoning via Credential Harvesting",
    category: "Secrets Protection",
    owaspCode: "ASI06",
    status: hasCredentialExposure ? "fail" : "pass",
    severity: "critical",
    details: hasCredentialExposure
      ? "Hardcoded secrets or raw secret logging detected (AT-SEC-002/AT-SEC-007); exposed credentials could seed poisoned context that persists across sessions."
      : "No static evidence of hardcoded secrets or raw secret logging.",
    remediation: "Use ephemeral scoped tokens and redaction proxies."
  });

  const hasDestructiveWithoutApproval = permissions.canDeleteFiles && permissions.humanApprovalRequired.length === 0;
  results.push({
    id: "ATK-05",
    name: "Destructive Operation Without Human Approval",
    category: "Human Oversight",
    owaspCode: "ASI09",
    status: hasDestructiveWithoutApproval ? "fail" : "pass",
    severity: "high",
    details: hasDestructiveWithoutApproval
      ? "File deletion / state modification capability detected with no human-approval gate declared — bypassing oversight is plausible."
      : "Destructive operations are either disallowed or declared behind human-confirmation triggers.",
    remediation: "Add mandatory human verification hooks for irreversible operations."
  });

  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const warn = results.filter(r => r.status === "warn").length;
  const resilienceScore = Math.round((passed / results.length) * 100);

  return {
    targetName,
    timestamp: new Date().toISOString(),
    mode: "static-heuristic",
    disclaimer: ATTACK_MODE_DISCLAIMER,
    testsRun: results.length,
    passed,
    failed,
    warn,
    resilienceScore,
    results
  };
}
