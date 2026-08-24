import fs from "node:fs";
import type { WorkflowSuite, WorkflowTestCase, WorkflowTestStep, WorkflowEvalResult } from "../types/index.js";

// Simulation mode: suites are parsed and structurally validated, but steps are NOT
// executed against an agent. No durations, costs, or success rates are fabricated.
// Runtime execution (sandboxed agent runs) is planned for eval lab v2.

export async function evaluateWorkflow(suitePath: string): Promise<WorkflowEvalResult> {
  let suite: WorkflowSuite;
  try {
    const raw = fs.readFileSync(suitePath, "utf8");
    if (suitePath.endsWith(".json")) {
      suite = JSON.parse(raw);
    } else {
      suite = parseSimpleYamlSuite(raw);
    }
  } catch (err) {
    throw new Error(`Failed to load workflow suite from ${suitePath}: ${(err as Error).message}`);
  }

  if (suite.tests.length === 0) {
    throw new Error(`No tests could be parsed from ${suitePath}. Check that the suite defines a top-level 'tests:' list with named entries.`);
  }

  const stepResults: WorkflowEvalResult["stepResults"] = [];
  for (const test of suite.tests) {
    for (const step of test.steps) {
      stepResults.push({
        testName: test.name,
        stepName: step.name,
        status: "simulated",
        actualOutcome: "not_executed",
        durationSec: 0,
        costUsd: 0,
        policyViolations: []
      });
    }
  }

  const notice =
    "Simulation mode: the suite was parsed and validated, but no agent executed these steps. Durations, costs, and success rates are intentionally omitted until runtime execution ships.";

  return {
    workflow: suite.workflow,
    targetAgent: suite.targetAgent,
    timestamp: new Date().toISOString(),
    mode: "simulated",
    notice,
    totalTests: suite.tests.length,
    passedTests: 0,
    failedTests: 0,
    successRate: 0,
    totalCostUsd: 0,
    avgDurationSec: 0,
    regressions: [],
    stepResults
  };
}

// Minimal indentation-aware parser for the flat YAML subset used by workflow suites:
// top-level scalar keys plus a 'tests:' list of { name, steps: [{ name, input, ... }] }.
export function parseSimpleYamlSuite(content: string): WorkflowSuite {
  const suite: WorkflowSuite = {
    workflow: "agent-workflow",
    targetAgent: "target-agent",
    tests: []
  };

  let currentTest: WorkflowTestCase | null = null;
  let currentStep: WorkflowTestStep | null = null;
  let inSteps = false;
  let testIndent = -1;

  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (!line.trim()) continue;

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();
    const listMatch = trimmed.match(/^-\s+(.+)$/);
    const kvSource = listMatch ? listMatch[1] : trimmed;
    const kvMatch = kvSource.match(/^([A-Za-z_][\w.-]*):\s*(.*)$/);

    if (listMatch && kvMatch && kvMatch[1] === "name") {
      const clean = stripQuotes(kvMatch[2]);
      if (inSteps && currentTest && indent > testIndent) {
        currentStep = { name: clean, input: "" };
        currentTest.steps.push(currentStep);
      } else {
        currentTest = { name: clean, steps: [] };
        currentStep = null;
        inSteps = false;
        testIndent = indent;
        suite.tests.push(currentTest);
      }
      continue;
    }

    if (!kvMatch) continue;
    const [, key, value] = kvMatch;
    const clean = stripQuotes(value);

    if (!listMatch && indent === 0) {
      if (key === "workflow" && clean) suite.workflow = clean;
      else if (key === "targetAgent" && clean) suite.targetAgent = clean;
      else if (key === "version" && clean) suite.version = clean;
      continue;
    }

    if (key === "steps" && !clean) {
      inSteps = true;
      continue;
    }

    if (currentStep && !listMatch) {
      if (key === "input" && clean) currentStep.input = clean;
      else if (key === "expectedOutcome" && clean) currentStep.expectedOutcome = clean;
    }
  }

  return suite;
}

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, "").trim();
}
