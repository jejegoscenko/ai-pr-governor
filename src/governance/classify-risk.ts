
import type {
  GovernanceFinding,
  RiskAssessment,
  RiskLevel,
} from "./types.js";

const severityRank: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function classifyRisk(
  findings: GovernanceFinding[]
): RiskAssessment {
  let level: RiskLevel = "low";

  for (const finding of findings) {
    if (severityRank[finding.severity] > severityRank[level]) {
      level = finding.severity;
    }
  }

  const reasons =
    findings.length === 0
      ? ["No findings were reported by the review engines."]
      : findings
          .filter((finding) => finding.severity === level)
          .map(
            (finding) =>
              `[${finding.source.toUpperCase()}] ${finding.file}: ${finding.title}`
          );

  return {
    level,
    findings,
    reasons,
  };
}
