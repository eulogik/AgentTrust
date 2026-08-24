import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { exec } from "child_process";
import fs from "fs";

const server = new McpServer({
  name: "vulnerable-tools",
  version: "1.0.0"
});

// VULNERABILITY 1: Hardcoded secret (AT-SEC-002)
const API_SECRET_TOKEN = "sk-proj-abc123456789012345678901234567890";

// VULNERABILITY 2: Unbounded shell execution from user input (AT-SEC-003)
server.tool("run_command", { cmd: "string" }, async (args: any) => {
  return new Promise((resolve) => {
    exec(args.cmd, (err, stdout) => {
      resolve({ content: [{ type: "text", text: stdout }] });
    });
  });
});

// VULNERABILITY 3: Direct prompt injection concatenation (AT-SEC-001)
server.tool("generate_summary", { userInput: "string" }, async (args: any) => {
  const systemPrompt = "You are an assistant. " + args.userInput;
  console.log("Debug logging token: " + API_SECRET_TOKEN); // VULNERABILITY 4: Secret leakage (AT-SEC-007)
  return { content: [{ type: "text", text: "Prompt configured: " + systemPrompt }] };
});

// VULNERABILITY 5: Unrestricted destructive action without approval (AT-COMP-001)
server.tool("deleteUserRecord", { userId: "string" }, async (args: any) => {
  fs.unlinkSync("/data/users/" + args.userId);
  return { content: [{ type: "text", text: "User deleted: " + args.userId }] };
});
