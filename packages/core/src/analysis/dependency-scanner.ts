import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { DependencyInfo, Severity } from "../types/index.js";

const AUDIT_SEVERITY_MAP: Record<string, Severity> = {
  critical: "critical",
  high: "high",
  moderate: "medium",
  low: "low",
  info: "info"
};

// Pure mapping of `npm audit --json` output (auditVersion 2+) into per-package
// vulnerability lists. Exported separately so it can be unit-tested without
// hitting the registry.
export function mapAuditReport(auditJson: { vulnerabilities?: Record<string, NpmAuditVulnerability> }): Map<string, DependencyInfo["vulnerabilities"]> {
  const result = new Map<string, DependencyInfo["vulnerabilities"]>();
  const vulns = auditJson.vulnerabilities ?? {};

  for (const [name, entry] of Object.entries(vulns)) {
    const items: DependencyInfo["vulnerabilities"] = [];
    for (const via of entry.via ?? []) {
      if (typeof via === "string") {
        // indirect advisory reference without details; range strings name the source
        items.push({ id: `via:${via}`, severity: AUDIT_SEVERITY_MAP[entry.severity ?? "medium"] ?? "medium", title: `Vulnerable range via ${via}` });
      } else {
        items.push({
          id: via.url ?? via.title ?? "unknown",
          severity: AUDIT_SEVERITY_MAP[via.severity ?? entry.severity ?? "medium"] ?? "medium",
          title: via.title ?? "Advisory",
          url: via.url
        });
      }
    }
    if (items.length > 0) result.set(name, dedupeById(items));
  }
  return result;
}

export async function scanDependencies(dirPath: string): Promise<DependencyInfo[]> {
  const manifestPath = path.join(dirPath, "package.json");
  let manifest: { dependencies?: Record<string, string>; version?: string; name?: string };
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return [];
  }

  const deps = Object.entries(manifest.dependencies ?? {}).map(([name, range]) => ({
    name,
    version: range,
    vulnerabilities: [] as DependencyInfo["vulnerabilities"]
  }));
  if (deps.length === 0) return [];

  // npm audit needs a lockfile; --package-lock-only works without node_modules installed.
  const hasLockfile =
    fs.existsSync(path.join(dirPath, "package-lock.json")) ||
    fs.existsSync(path.join(dirPath, "npm-shrinkwrap.json"));
  if (!hasLockfile) return deps;

  let auditOutput: string;
  try {
    auditOutput = execFileSync("npm", ["audit", "--json", "--package-lock-only"], {
      cwd: dirPath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch (err) {
    // npm audit exits non-zero when vulnerabilities exist — stdout still carries the report.
    const stdout = (err as { stdout?: string }).stdout;
    if (!stdout) return deps;
    auditOutput = stdout;
  }

  let byName: Map<string, DependencyInfo["vulnerabilities"]>;
  try {
    byName = mapAuditReport(JSON.parse(auditOutput));
  } catch {
    return deps;
  }

  for (const dep of deps) {
    dep.vulnerabilities = byName.get(dep.name) ?? [];
  }
  return deps;
}

interface NpmAuditVulnerability {
  severity?: string;
  via?: Array<string | { title?: string; url?: string; severity?: string }>;
}

function dedupeById(items: DependencyInfo["vulnerabilities"]): DependencyInfo["vulnerabilities"] {
  return [...new Map(items.map(i => [i.id, i])).values()];
}
