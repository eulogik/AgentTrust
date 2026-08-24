import fs from "node:fs";
import path from "node:path";
import type { Finding, Severity } from "../types/index.js";

interface RuleDef {
  rule: string;
  title: string;
  severity: Severity;
  category: Finding["category"];
  owaspCode: string;
  cwe: string;
  description: string;
  remediation: string;
  pattern?: RegExp;
  validator?: (content: string, filePath: string) => { match: boolean; line?: number; evidence?: string };
}

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
    pattern: /(?:prompt|systemPrompt|userPrompt)\s*[+]=?\s*(?:req|request|input|userInput|query|params|args\.[a-zA-Z0-9_]+)/i
  },
  {
    rule: "AT-SEC-002",
    title: "Hardcoded Credential or API Secret",
    severity: "critical",
    category: "security",
    owaspCode: "LLM08",
    cwe: "CWE-798",
    description: "A hardcoded API key, private token, or secret was identified in source code.",
    remediation: "Move credentials to secure environment variables or a key vault. Never commit API keys.",
    pattern: /(?:api_?key|secret|password|bearer|auth_?token)\s*=\s*["'][a-zA-Z0-9_\-.]{20,}["']/i
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
    owaspCode: "LLM02",
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
    owaspCode: "ASI03",
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
    owaspCode: "ASI07",
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
    owaspCode: "LLM06",
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
    owaspCode: "LLM08",
    cwe: "CWE-284",
    description: "Irreversible actions (e.g. database wipe, financial transaction, email dispatch) execute autonomously with no approval trigger.",
    remediation: "Mark high-impact tools with approval requirements and verify operator signature before dispatch.",
    validator: (content: string) => {
      const hasDestructiveAction = /(?:transferFunds|sendEmail|dropTable|deleteUser|publishArticle|executeTrade)/i.test(content);
      const hasApproval = /(?:requireApproval|humanInTheLoop|confirmAction|operatorConsent)/i.test(content);
      if (hasDestructiveAction && !hasApproval) {
        return { match: true, evidence: "High-impact function detected without approval validation" };
      }
      return { match: false };
    }
  }
];

export async function runStaticAnalysis(dirPath: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const files = collectScannableFiles(dirPath);

  for (const file of files) {
    const relPath = path.relative(dirPath, file);
    let content = "";
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split("\n");

    for (const rule of RULES) {
      if (rule.pattern) {
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) return;

          if (rule.pattern!.test(line)) {
            findings.push({
              id: `${rule.rule}-${Math.random().toString(36).slice(2, 7)}`,
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
              evidence: trimmed.slice(0, 140)
            });
          }
        });
      } else if (rule.validator) {
        const valRes = rule.validator(content, relPath);
        if (valRes.match) {
          findings.push({
            id: `${rule.rule}-${Math.random().toString(36).slice(2, 7)}`,
            title: rule.title,
            description: rule.description,
            severity: rule.severity,
            category: rule.category,
            file: relPath,
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

function collectScannableFiles(dir: string): string[] {
  const result: string[] = [];
  const ignored = new Set(["node_modules", ".git", "dist", "build", ".venv", "__pycache__"]);

  function walk(current: string) {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (ignored.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if ([".ts", ".js", ".mjs", ".cjs", ".py", ".json", ".yaml", ".yml", ".md"].includes(ext)) {
          result.push(full);
        }
      }
    }
  }

  walk(dir);
  return result;
}
