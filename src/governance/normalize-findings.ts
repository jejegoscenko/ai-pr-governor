
import type { ReviewResult } from "../llm/review-schema.js";
import type { SemgrepFinding } from "../analysis/semgrep.js";
import type {
  GovernanceFinding,
  RiskLevel,
} from "./types.js";

export function normalizeSemgrepSeverity(
  severity: string
): RiskLevel {
  switch (severity.toUpperCase()) {
    case "INFO":
      return "low";

    case "WARNING":
      return "medium";

    case "ERROR":
      return "high";

    default:
      throw new Error(
        `Unsupported Semgrep severity: ${severity}`
      );
  }
}

export function normalizeAIFindings(
  review: ReviewResult
): GovernanceFinding[] {
  return review.findings.map((finding) => ({
    source: "ai",
    file: finding.file,
    severity: finding.severity,
    originalSeverity: finding.severity,
    title: finding.title,
    description: finding.explanation,
  }));
}

export function normalizeSemgrepFindings(
  findings: SemgrepFinding[]
): GovernanceFinding[] {
  return findings.map((finding) => ({
    source: "semgrep",
    file: finding.file,
    line: finding.line,
    severity: normalizeSemgrepSeverity(finding.severity),
    originalSeverity: finding.severity,
    title: finding.message,
    description: finding.message,
    ruleId: finding.ruleId,
  }));
}

export function normalizeFindings(
  review: ReviewResult,
  staticFindings: SemgrepFinding[]
): GovernanceFinding[] {
  return [
    ...normalizeSemgrepFindings(staticFindings),
    ...normalizeAIFindings(review),
  ];
}
