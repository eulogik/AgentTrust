import fs from "node:fs";
import path from "node:path";
import type { ProvenanceInfo } from "../types/index.js";

export async function analyzeProvenance(dirPath: string): Promise<ProvenanceInfo> {
  let files: string[] = [];
  try {
    files = fs.readdirSync(dirPath).map(f => f.toLowerCase());
  } catch {}
  const fileSet = new Set(files);

  let hasLicense = false;
  let license: string | undefined = undefined;
  let repositoryUrl: string | undefined = undefined;
  let hasLockfile = fileSet.has("package-lock.json") || fileSet.has("yarn.lock") || fileSet.has("pnpm-lock.yaml") || fileSet.has("poetry.lock");
  let hasSBOM = fileSet.has("sbom.json") || fileSet.has("bom.json") || fileSet.has("cyclonedx.json");
  let hasSecurityPolicy = fileSet.has("security.md") || fs.existsSync(path.join(dirPath, ".github", "SECURITY.md"));
  let hasChangelog = fileSet.has("changelog.md") || fileSet.has("history.md") || fileSet.has("releases.md");
  let signed = fileSet.has("signature.asc") || fileSet.has(".sigstore") || fileSet.has("checksums.txt");

  if (fileSet.has("license") || fileSet.has("license.md") || fileSet.has("license.txt")) {
    hasLicense = true;
    try {
      const licFile = files.find(f => f.startsWith("license"))!;
      const content = fs.readFileSync(path.join(dirPath, licFile), "utf8");
      if (content.includes("MIT")) license = "MIT";
      else if (content.includes("Apache")) license = "Apache-2.0";
      else if (content.includes("BSD")) license = "BSD-3-Clause";
      else license = "Custom";
    } catch {}
  }

  if (fileSet.has("package.json")) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dirPath, "package.json"), "utf8"));
      if (!license && pkg.license) {
        hasLicense = true;
        license = pkg.license;
      }
      if (pkg.repository) {
        repositoryUrl = typeof pkg.repository === "string" ? pkg.repository : pkg.repository.url;
      }
    } catch {}
  }

  // "Verified" here means documentary provenance signals are present
  // (license + lockfile + policy/changelog) — it is NOT a safety verdict.
  // Display layers must not render this as "Verified Safe".
  const isVerified = hasLicense && hasLockfile && (hasSecurityPolicy || hasChangelog);

  return {
    signed,
    buildReproducible: hasLockfile,
    hasLockfile,
    hasSBOM,
    hasLicense,
    license,
    hasSecurityPolicy,
    hasChangelog,
    repositoryUrl,
    isVerified
  };
}
