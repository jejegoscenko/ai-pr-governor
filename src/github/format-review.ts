import type { ReviewResult } from "../llm/review-schema.js";

export function formatReview(review: ReviewResult): string {
  const lines: string[] = [
    "## AI PR Governor — Code Review",
    "",
    review.summary,
    "",
    `**Findings:** ${review.findings.length}`,
    "",
  ];

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

  return lines.join("\n");
}
