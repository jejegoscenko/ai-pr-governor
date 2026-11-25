
import type { ReviewResult } from "../llm/review-schema.js";
import type { SemgrepFinding } from "../analysis/semgrep.js";
import { formatStaticAnalysisContext } from "../analysis/format-findings.js";
import { redactSecrets } from "../security/redact-secrets.js";

export function formatReview(
  review: ReviewResult,
  staticFindings?: SemgrepFinding[]
): string {
  const lines: string[] = [
    "## AI PR Governor — Code Review",
    "",
    review.summary,
    "",
  ];

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
