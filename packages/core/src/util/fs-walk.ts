import fs from "node:fs";
import path from "node:path";

export const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".venv",
  "venv",
  "__pycache__",
  ".agenttrust",
  "coverage",
  ".next",
  ".turbo"
]);

const DEFAULT_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".json",
  ".yaml",
  ".yml",
  ".md"
]);

export function walkFiles(
  dir: string,
  options: { extensions?: Set<string>; maxFiles?: number; maxDepth?: number } = {}
): string[] {
  const extensions = options.extensions ?? DEFAULT_EXTS;
  const maxFiles = options.maxFiles ?? 4000;
  const maxDepth = options.maxDepth ?? 12;
  const result: string[] = [];

  function walk(current: string, depth: number) {
    if (result.length >= maxFiles || depth > maxDepth) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (result.length >= maxFiles) return;
      if (IGNORE_DIRS.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.has(ext) || extensions.size === 0) {
          result.push(full);
        }
      }
    }
  }

  walk(dir, 0);
  return result;
}

export function listBasenamesLower(dir: string): string[] {
  try {
    return fs.readdirSync(dir).map(f => f.toLowerCase());
  } catch {
    return [];
  }
}
