import { detectCapability } from "../analysis/detector.js";
import { runStaticAnalysis } from "../analysis/static-analyzer.js";
import { extractPermissions } from "../analysis/permission-extractor.js";
import { scanDependencies } from "../analysis/dependency-scanner.js";
import { analyzeProvenance } from "../trust/provenance.js";
import { computeTrustScore } from "../trust/scorer.js";
import { buildTrustCard } from "../trust/card-builder.js";
import type { TrustCard, Finding, PermissionManifest, ProvenanceInfo, TrustScore, DependencyInfo } from "../types/index.js";
import type { DetectionResult } from "../analysis/detector.js";

export interface ScanResult {
  detection: DetectionResult;
  findings: Finding[];
  permissions: PermissionManifest;
  provenance: ProvenanceInfo;
  trustScore: TrustScore;
  dependencies: DependencyInfo[];
  trustCard: TrustCard;
}

export async function runScan(absPath: string): Promise<ScanResult> {
  const detection = await detectCapability(absPath);
  const findings = await runStaticAnalysis(absPath);
  const permissions = await extractPermissions(absPath);
  const provenance = await analyzeProvenance(absPath);
  const trustScore = computeTrustScore(findings, permissions, provenance);
  const dependencies = await scanDependencies(absPath);
  const trustCard = buildTrustCard({
    capabilityType: detection.type,
    name: detection.name,
    version: detection.version,
    description: detection.description,
    language: detection.language,
    findings,
    permissions,
    provenance,
    trustScore,
    dependencies
  });
  return { detection, findings, permissions, provenance, trustScore, dependencies, trustCard };
}
