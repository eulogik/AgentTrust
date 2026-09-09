import { createHash } from "node:crypto";

export function stableFindingId(
  rule: string,
  file: string,
  line: number | undefined,
  evidence: string | undefined
): string {
  const digest = createHash("sha256")
    .update([rule, file, String(line ?? 0), evidence ?? ""].join("\0"))
    .digest("hex")
    .slice(0, 12);
  return `${rule}-${digest}`;
}
