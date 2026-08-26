import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ScanTarget } from "../types/index.js";

export interface ScanFlags {
  github?: boolean;
  npm?: boolean;
}

// Classifies scan input without touching the filesystem or network:
// explicit GitHub URLs win, then flags, then everything is treated as a local path.
export function classifyScanInput(input: string, flags: ScanFlags = {}): ScanTarget["type"] {
  const isGitHubUrl = /^https?:\/\/github\.com\//i.test(input) || /^git@github\.com:/i.test(input);
  if (isGitHubUrl || flags.github) return "github";
  if (flags.npm) return "npm";
  return "local";
}

export async function resolveScanTarget(input: string, flags: ScanFlags = {}): Promise<ScanTarget> {
  const type = classifyScanInput(input, flags);

  if (type === "local") {
    return {
      input,
      type: "local",
      resolvedPath: path.resolve(input),
      name: path.basename(path.resolve(input))
    };
  }

  if (type === "github") {
    const { url, repo, branch } = parseGitHubRef(input);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttrust-scan-github-"));
    const dest = path.join(dir, repo);
    const args = ["clone", "--depth", "1"];
    if (branch) args.push("--branch", branch);
    args.push(url, dest);
    try {
      execFileSync("git", args, { stdio: "pipe" });
    } catch (err) {
      throw new Error(`Failed to clone ${url}: ${(err as Error).message}`);
    }
    return {
      input,
      type: "github",
      resolvedPath: dest,
      url,
      name: repo,
      version: branch
    };
  }

  // npm: fetch the published tarball — that is what consumers actually install.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttrust-scan-npm-"));
  let packedFile: string;
  try {
    const out = execFileSync("npm", ["pack", input, "--pack-destination", dir], { cwd: os.tmpdir(), encoding: "utf8" });
    packedFile = out.trim().split("\n").pop()!.trim();
  } catch (err) {
    throw new Error(`Failed to download npm package ${input}: ${(err as Error).message}`);
  }
  try {
    execFileSync("tar", ["-xzf", path.join(dir, packedFile), "-C", dir], { stdio: "pipe" });
  } catch (err) {
    throw new Error(`Failed to extract npm tarball for ${input}: ${(err as Error).message}`);
  }
  const extracted = path.join(dir, "package");
  let version: string | undefined;
  try {
    version = JSON.parse(fs.readFileSync(path.join(extracted, "package.json"), "utf8")).version;
  } catch {}

  return {
    input,
    type: "npm",
    resolvedPath: extracted,
    name: input,
    version
  };
}

export function parseGitHubRef(input: string): { url: string; repo: string; branch?: string } {
  let working = input.replace(/\.git$/i, "");
  let branch: string | undefined;

  if (/^https?:\/\/github\.com\//i.test(working)) {
    const u = new URL(working);
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length < 2) throw new Error(`Invalid GitHub URL: ${input}`);
    if (segments[2] === "tree" && segments[3]) {
      const sep = segments.indexOf("tree");
      branch = decodeURIComponent(segments.slice(sep + 1).join("/"));
    }
    return { url: `https://github.com/${segments[0]}/${segments[1]}.git`, repo: segments[1], branch };
  }

  // git@github.com:owner/repo
  const ssh = working.match(/^git@github\.com:([^/]+)\/(.+)$/i);
  if (ssh) return { url: `https://github.com/${ssh[1]}/${ssh[2]}.git`, repo: ssh[2] };

  // bare owner/repo (requires --github flag upstream)
  const bare = working.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (!bare) throw new Error(`Invalid GitHub reference: ${input}. Use https://github.com/owner/repo or pass --github with owner/repo.`);
  return { url: `https://github.com/${bare[1]}/${bare[2]}.git`, repo: bare[2], branch };
}
