import fs from "node:fs";
import path from "node:path";
import type { CapabilityType } from "../types/index.js";

export interface DetectionResult {
  type: CapabilityType;
  confidence: number;
  evidence: string[];
  name: string;
  version?: string;
  description?: string;
  language?: string;
}

export async function detectCapability(dirPath: string): Promise<DetectionResult> {
  const evidence: string[] = [];
  let files: string[] = [];
  
  try {
    files = fs.readdirSync(dirPath);
  } catch (err) {
    return {
      type: "unknown",
      confidence: 0,
      evidence: ["Unable to read directory: " + (err as Error).message],
      name: path.basename(dirPath)
    };
  }

  const fileSet = new Set(files.map(f => f.toLowerCase()));
  let name = path.basename(dirPath);
  let version = "0.1.0";
  let description = "";
  let language = "unknown";

  if (fileSet.has("package.json")) {
    language = fileSet.has("tsconfig.json") ? "TypeScript" : "JavaScript";
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dirPath, "package.json"), "utf8"));
      if (pkg.name) name = pkg.name;
      if (pkg.version) version = pkg.version;
      if (pkg.description) description = pkg.description;
    } catch {}
  } else if (fileSet.has("pyproject.toml") || fileSet.has("requirements.txt") || fileSet.has("setup.py")) {
    language = "Python";
  }

  if (fileSet.has("mcp.json") || fileSet.has("mcp.yaml")) {
    evidence.push("Explicit mcp.json/yaml configuration found");
    return { type: "mcp-server", confidence: 0.98, evidence, name, version, description, language };
  }

  const isMcp = checkHasPattern(dirPath, files, [
    "@modelcontextprotocol",
    "McpServer",
    "ListToolsRequestSchema",
    "CallToolRequestSchema",
    "server.tool(",
    "server.resource("
  ]);
  if (isMcp) {
    evidence.push("Model Context Protocol (MCP) server signatures detected in source code");
    return { type: "mcp-server", confidence: 0.95, evidence, name, version, description, language };
  }

  if (fileSet.has("skill.md") || fileSet.has("skill.yaml") || fileSet.has("skill.yml")) {
    evidence.push("Standard SKILL.md/yaml specification found");
    if (fileSet.has("skill.md")) {
      try {
        const content = fs.readFileSync(path.join(dirPath, "skill.md"), "utf8");
        const match = content.match(/^#\s+(.+)$/m);
        if (match) name = match[1].trim();
      } catch {}
    }
    return { type: "agent-skill", confidence: 0.95, evidence, name, version, description, language };
  }

  if (fileSet.has("claude.md") || fileSet.has(".claude") || fileSet.has("claude_desktop_config.json")) {
    evidence.push("Claude Desktop / Claude Code configuration detected");
    return { type: "claude-config", confidence: 0.90, evidence, name, version, description, language };
  }

  if (fileSet.has("openclaw.json") || fileSet.has("claw.json") || fileSet.has("clawhub.json")) {
    evidence.push("OpenClaw plugin metadata detected");
    return { type: "openclaw-plugin", confidence: 0.90, evidence, name, version, description, language };
  }

  const isLangGraph = checkHasPattern(dirPath, files, [
    "@langchain",
    "langgraph",
    "StateGraph",
    "createReactAgent",
    "from langchain"
  ]);
  if (isLangGraph) {
    evidence.push("LangGraph / LangChain orchestration patterns detected");
    return { type: "langgraph-agent", confidence: 0.85, evidence, name, version, description, language };
  }

  const isGeneric = checkHasPattern(dirPath, files, [
    "openai",
    "anthropic",
    "system_prompt",
    "tools",
    "agent"
  ]);
  if (isGeneric) {
    evidence.push("AI Agent prompt/tool interaction patterns detected");
    return { type: "generic-agent", confidence: 0.70, evidence, name, version, description, language };
  }

  return {
    type: "unknown",
    confidence: 0.30,
    evidence: ["Standard agent capability markers not detected"],
    name,
    version,
    description,
    language
  };
}

function checkHasPattern(dir: string, files: string[], patterns: string[]): boolean {
  for (const file of files) {
    const full = path.join(dir, file);
    try {
      const st = fs.statSync(full);
      if (st.isFile() && (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".py") || file.endsWith(".json") || file.endsWith(".md"))) {
        const content = fs.readFileSync(full, "utf8");
        if (patterns.some(p => content.includes(p))) {
          return true;
        }
      }
    } catch {}
  }
  return false;
}