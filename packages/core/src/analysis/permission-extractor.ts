import fs from "node:fs";
import path from "node:path";
import type { PermissionManifest } from "../types/index.js";

export async function extractPermissions(dirPath: string): Promise<PermissionManifest> {
  const manifest: PermissionManifest = {
    network: [],
    filesystem: [],
    shell: false,
    shellCommands: [],
    secrets: [],
    envVars: [],
    externalServices: [],
    humanApprovalRequired: [],
    canSpawnProcesses: false,
    canAccessDB: false,
    canSendEmail: false,
    canAccessBrowser: false,
    canModifyFiles: false,
    canDeleteFiles: false,
    canMakeHTTPRequests: false,
    estimatedScope: "minimal"
  };

  const files = collectSourceFiles(dirPath);

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      analyzeFileContent(content, manifest);
    } catch {}
  }

  let riskPoints = 0;
  if (manifest.shell) riskPoints += 4;
  if (manifest.canDeleteFiles) riskPoints += 3;
  if (manifest.canModifyFiles) riskPoints += 1;
  if (manifest.canAccessBrowser) riskPoints += 2;
  if (manifest.canSendEmail) riskPoints += 2;
  if (manifest.canAccessDB) riskPoints += 2;
  if (manifest.canMakeHTTPRequests) riskPoints += 1;
  if (manifest.secrets.length > 3) riskPoints += 2;

  if (riskPoints >= 7) manifest.estimatedScope = "excessive";
  else if (riskPoints >= 4) manifest.estimatedScope = "broad";
  else if (riskPoints >= 2) manifest.estimatedScope = "moderate";
  else manifest.estimatedScope = "minimal";

  return manifest;
}

function analyzeFileContent(content: string, manifest: PermissionManifest): void {
  if (/\b(?:exec|execSync|spawn|child_process|subprocess\.Popen|os\.system)\b/.test(content)) {
    manifest.shell = true;
    manifest.canSpawnProcesses = true;
    const matches = content.matchAll(/(?:exec|spawn)\s*\(\s*["']([^"'\s]+)/g);
    for (const m of matches) {
      if (!manifest.shellCommands.includes(m[1])) {
        manifest.shellCommands.push(m[1]);
      }
    }
  }

  if (/\b(?:fetch|axios|requests|http\.get|https\.request)\b/.test(content)) {
    manifest.canMakeHTTPRequests = true;
    const urlMatches = content.matchAll(/https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
    for (const m of urlMatches) {
      const host = m[1];
      if (!manifest.externalServices.includes(host)) {
        manifest.externalServices.push(host);
        manifest.network.push({ type: "outbound", host, protocol: "https" });
      }
    }
  }

  if (/\b(?:writeFileSync|writeFile|appendFileSync|createWriteStream)\b/.test(content)) {
    manifest.canModifyFiles = true;
    manifest.filesystem.push({ type: "write", path: "host-workspace" });
  }
  if (/\b(?:unlinkSync|unlink|rmSync|rmdirSync|shutil\.rmtree)\b/.test(content)) {
    manifest.canDeleteFiles = true;
    manifest.filesystem.push({ type: "delete", path: "host-workspace" });
  }

  if (/\b(?:playwright|puppeteer|selenium|browser\.launch|page\.goto)\b/.test(content)) {
    manifest.canAccessBrowser = true;
  }

  if (/\b(?:nodemailer|sendgrid|resend|sesClient|smtpClient)\b/.test(content)) {
    manifest.canSendEmail = true;
  }

  if (/\b(?:pg|postgres|mysql|sqlite3|prisma|drizzle|mongoose|redis)\b/.test(content)) {
    manifest.canAccessDB = true;
  }

  const envMatches = content.matchAll(/process\.env\.([A-Z0-9_]+)/g);
  for (const m of envMatches) {
    const varName = m[1];
    if (!manifest.envVars.includes(varName)) manifest.envVars.push(varName);
    if (/KEY|TOKEN|SECRET|PASSWORD|AUTH|CREDENTIAL/i.test(varName)) {
      if (!manifest.secrets.includes(varName)) manifest.secrets.push(varName);
    }
  }

  if (/\b(?:requireApproval|confirmPrompt|askHumanConsent|operatorApproval)\b/.test(content)) {
    manifest.humanApprovalRequired.push("operator-confirmation-gate");
  }
}

function collectSourceFiles(dir: string): string[] {
  const result: string[] = [];
  const ignored = new Set(["node_modules", ".git", "dist", "build"]);

  function walk(current: string) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (ignored.has(entry.name)) continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && [".ts", ".js", ".py", ".json", ".yaml", ".md"].includes(path.extname(entry.name))) {
          result.push(full);
        }
      }
    } catch {}
  }

  walk(dir);
  return result;
}
