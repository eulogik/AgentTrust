import type { Severity } from "../types/index.js";

export const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export function meetsSeverityThreshold(severity: Severity, threshold: Severity): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[threshold];
}

export function isSeverity(value: string): value is Severity {
  return value in SEVERITY_ORDER;
}
