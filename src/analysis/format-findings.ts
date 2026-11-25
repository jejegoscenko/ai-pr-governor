
import type { SemgrepFinding } from "./semgrep.js";

export function formatStaticAnalysisContext(
  findings: SemgrepFinding[]
): string {
  const lines: string[] = [
    "## Static Analysis Findings (Semgrep)",
    "",
    `Total findings on changed lines: ${findings.length}`,
    "",
  ];

  if (findings.length === 0) {
    lines.push(
      "No findings detected on known changed lines by the selected Semgrep rules."
    );

    return lines.join("\n");
  }

  for (const finding of findings) {
    lines.push(
      `### [${finding.severity}] ${finding.file}:${finding.line}`,
      "",
      `Rule: ${finding.ruleId}`,
      `Message: ${finding.message}`,
      ""
    );
  }

  return lines.join("\n");
}
