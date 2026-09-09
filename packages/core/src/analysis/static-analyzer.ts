import fs from "node:fs";
import path from "node:path";
import type { Finding, Severity } from "../types/index.js";
import { walkFiles } from "../util/fs-walk.js";
import { stableFindingId } from "../util/finding-id.js";

interface RuleDef {
  rule: string;
  title: string;
  severity: Severity;
  category: Finding["category"];
  owaspCode: string;
  cwe: string;
  description: string;
  remediation: string;
  /** "code" (default) = source files only; "codeAndData" = also JSON/YAML. Markdown docs are never pattern-scanned. */
  scope?: "code" | "codeAndData";
  pattern?: RegExp | RegExp[];
  validator?: (content: string, filePath: string) => { match: boolean; line?: number; evidence?: string };
}

/** Source extensions eligible for code-pattern rules. */
const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"]);
/** Secret scanning additionally covers structured data files (never prose docs). */
const SECRET_EXTS = new Set([...CODE_EXTS, ".json", ".yaml", ".yml"]);

/**
 * Lines shaped like the scanner's own rule DSL (`rule:`, `title:`, `pattern:`,
 * `remediation:`, … keys whose string values can mention e.g. `eval()`) are
 * meta, not target code — never flag them. Deliberately NOT based on rule-ID
 * substrings, so real findings in files that merely mention a rule ID in a
 * comment are still reported.
 */
const RULE_DSL_KEY = /^(?:rule|title|severity|category|owaspCode|cwe|description|remediation|pattern|scope)\s*:/;
function isRuleMetaLine(trimmed: string): boolean {
  return RULE_DSL_KEY.test(trimmed);
}

// owaspCode references the canonical OWASP lists:
// LLM Top 10 2025 (LLM01-LLM10) and Top 10 for Agentic Applications (ASI01-ASI10,
// published 2025-12-09). e.g. ASI05 = Unexpected Code Execution, ASI09 = Human-Agent
// Trust Exploitation, LLM02 = Sensitive Information Disclosure, LLM06 = Excessive Agency.

const RULES: RuleDef[] = [
  {
    rule: "AT-SEC-001",
    title: "Direct Prompt Concatenation (Injection Vulnerability)",
    severity: "critical",
    category: "security",
    owaspCode: "LLM01",
    cwe: "CWE-20",
    description: "User or tool input is directly concatenated into prompt templates without sanitization or boundary delimitation.",
    remediation: "Use parameterized messages, structured schema validation (Zod), and clear boundary delimiters.",
    pattern: [
      /(?:prompt|systemPrompt|userPrompt)\s*[+]=?\s*(?:req|request|input|userInput|query|params|args\.[a-zA-Z0-9_]+)/i,
      /(?:prompt|systemPrompt|userPrompt)\s*=\s*["'`][^"'`]*["'`]\s*\+\s*(?:args\.|req\.|request\.|input\b|userInput\b|params\b)/i
    ]
  },
  {
    rule: "AT-SEC-002",
    title: "Hardcoded Credential or API Secret",
    severity: "critical",
    category: "security",
    owaspCode: "LLM02",
    cwe: "CWE-798",
    description: "A hardcoded API key, private token, or secret was identified in source code.",
    remediation: "Move credentials to secure environment variables or a key vault. Never commit API keys.",
    scope: "codeAndData",
    pattern: /(?:api_?key|secret|password|bearer|auth_?token)[a-zA-Z0-9_]*\s*=\s*["'][a-zA-Z0-9_\-.]{20,}["']/i
  },
  {
    rule: "AT-SEC-003",
    title: "Unbounded Dynamic Shell Execution",
    severity: "critical",
    category: "security",
    owaspCode: "ASI02",
    cwe: "CWE-78",
    description: "The agent executes shell commands directly from dynamic parameters, allowing remote arbitrary command injection.",
    remediation: "Strictly restrict shell execution to an immutable allowlist of binary commands with explicit argument arrays, or execute inside microVM sandboxes.",
    pattern: /(?:exec|execSync|spawn|child_process\.exec|os\.system|subprocess\.Popen)\s*\(\s*[`"']?\s*(?:req|params|input|cmd|command|args)/i
  },
  {
    rule: "AT-SEC-004",
    title: "eval() / Function Constructor Invocation",
    severity: "critical",
    category: "security",
    owaspCode: "ASI05",
    cwe: "CWE-94",
    description: "Dangerous eval() or Function constructor used to dynamically execute code strings from LLM or external sources.",
    remediation: "Eliminate eval(). Use safe AST parsers or isolated sandboxes (e.g. E2B Firecracker microVMs).",
    pattern: /\beval\s*\(|new\s+Function\s*\(/
  },
  {
    rule: "AT-SEC-005",
    title: "Unrestricted Recursive File Deletion / Modification",
    severity: "high",
    category: "permissions",
    owaspCode: "ASI02",
    cwe: "CWE-732",
    description: "Capability can delete or overwrite arbitrary files on the host filesystem without path validation or human confirmation.",
    remediation: "Enforce strict jail/root directories and require explicit human-in-the-loop confirmation before file deletions.",
    pattern: /(?:fs\.rmdirSync|fs\.rmSync|fs\.unlinkSync|rmdir|unlink|shutil\.rmtree)\s*\([^)]*(?:req|input|path|target|args)/i
  },
  {
    rule: "AT-SEC-006",
    title: "Unfiltered SSRF / Arbitrary Network Egress",
    severity: "high",
    category: "permissions",
    owaspCode: "LLM06",
    cwe: "CWE-918",
    description: "Network requests accept arbitrary external URLs from agent or user input without host allowlisting.",
    remediation: "Define an explicit egress domain allowlist and block private IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254).",
    pattern: /(?:fetch|axios\.get|axios\.post|requests\.get|http\.request)\s*\(\s*(?:args\.[a-zA-Z0-9_]+|url|req\.body|input)/i
  },
  {
    rule: "AT-SEC-007",
    title: "Raw Secret Leakage in Debug Logging",
    severity: "medium",
    category: "security",
    owaspCode: "LLM02",
    cwe: "CWE-532",
    description: "Console or file logging dumps raw tokens, authorization headers, or environment objects.",
    remediation: "Implement PII/secret redaction masks before writing to log streams.",
    pattern: /console\.log\([^)]*(?:process\.env|authorization|password|apiKey|api_key|token)/i
  },
  {
    rule: "AT-COMP-001",
    title: "Missing Human-in-the-Loop Gate for Critical Actions",
    severity: "high",
    category: "compliance",
    owaspCode: "ASI09",
    cwe: "CWE-284",
    description: "Irreversible actions (e.g. database wipe, financial transaction, email dispatch) execute autonomously with no approval trigger.",
    remediation: "Mark high-impact tools with approval requirements and verify operator signature before dispatch.",
    validator: (content: string) => {
      // Require an actual call (identifier + paren) so type/field names such as
      // `canSendEmail` do not self-flag. Previously the bare-substring match
      // flagged the scanner's own PermissionManifest type as a finding.
      const call = /\b(transferFunds|sendEmail|dropTable|deleteUser|publishArticle|executeTrade)\s*\(/i.exec(content);
      if (!call) return { match: false };
      const hasApproval = /(?:requireApproval|humanInTheLoop|confirmAction|operatorConsent|humanApprovalRequired)/i.test(content);
      if (!hasApproval) {
        const line = content.slice(0, call.index).split("\n").length;
        return { match: true, line, evidence: `High-impact call ${call[1]}(...) detected without approval validation` };
      }
      return { match: false };
    }
  }
];

export async function runStaticAnalysis(dirPath: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const seen = new Set<string>();
  const push = (f: Finding) => {
    if (seen.has(f.id)) return;
    seen.add(f.id);
    findings.push(f);
  };

  const files = walkFiles(dirPath, { extensions: SECRET_EXTS });

  for (const file of files) {
    const relPath = path.relative(dirPath, file);
    const ext = path.extname(file).toLowerCase();
    const isCode = CODE_EXTS.has(ext);
    let content = "";
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split("\n");

    for (const rule of RULES) {
      const inScope = rule.scope === "codeAndData" ? true : isCode;
      if (!inScope) continue;
      const patterns = rule.pattern ? (Array.isArray(rule.pattern) ? rule.pattern : [rule.pattern]) : [];
      for (const pattern of patterns) {
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) return;
          if (isRuleMetaLine(trimmed)) return;

          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            const evidence = trimmed.slice(0, 140);
            push({
              id: stableFindingId(rule.rule, relPath, index + 1, evidence),
              title: rule.title,
              description: rule.description,
              severity: rule.severity,
              category: rule.category,
              file: relPath,
              line: index + 1,
              rule: rule.rule,
              remediation: rule.remediation,
              cwe: rule.cwe,
              owaspCode: rule.owaspCode,
              evidence
            });
          }
        });
      }
      if (rule.validator && isCode) {
        const valRes = rule.validator(content, relPath);
        if (valRes.match) {
          push({
            id: stableFindingId(rule.rule, relPath, valRes.line, valRes.evidence),
            title: rule.title,
            description: rule.description,
            severity: rule.severity,
            category: rule.category,
            file: relPath,
            line: valRes.line,
            rule: rule.rule,
            remediation: rule.remediation,
            cwe: rule.cwe,
            owaspCode: rule.owaspCode,
            evidence: valRes.evidence
          });
        }
      }
    }
  }

  return findings;
}
