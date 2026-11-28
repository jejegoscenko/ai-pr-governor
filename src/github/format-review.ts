
import type { ReviewResult } from "../llm/review-schema.js";
import type { SemgrepFinding } from "../analysis/semgrep.js";
import type { GovernanceDecision } from "../governance/types.js";

import { formatStaticAnalysisContext } from "../analysis/format-findings.js";
import { formatGovernanceDecision } from "../governance/format-decision.js";
import { redactSecrets } from "../security/redact-secrets.js";

export function formatReview(
  review: ReviewResult,
  staticFindings?: SemgrepFinding[],
  governanceDecision?: GovernanceDecision
): string {
  const lines: string[] = [
    "## AI PR Governor — Code Review",
    "",
    review.summary,
    "",
  ];

  // Governance assessment
  if (governanceDecision !== undefined) {
    lines.push(
      formatGovernanceDecision(governanceDecision),
      ""
    );
  } else {
    lines.push(
      "## Governance Assessment",
      "",
      "Governance assessment was not provided.",
      ""
    );
  }

  // Static analysis findings
  if (staticFindings !== undefined) {
    lines.push(
      formatStaticAnalysisContext(staticFindings),
      ""
    );
  } else {
    lines.push(
      "## Static Analysis",
      "",
      "Static analysis results were not provided.",
      ""
    );
  }

  // AI review findings
  lines.push(
    "## AI Review Findings",
    "",
    `**Findings:** ${review.findings.length}`,
    ""
  );

  if (review.findings.length === 0) {
    lines.push("No actionable findings identified.");
  }

  for (const finding of review.findings) {
    lines.push(
      `### [${finding.severity.toUpperCase()}] ${finding.title}`,
      "",
      `**File:** \`${finding.file}\``,
      "",
      finding.explanation,
      ""
    );
  }

  lines.push(
    "---",
    "_Automated AI review. Findings require human verification._"
  );

  return redactSecrets(lines.join("\n"));
}
