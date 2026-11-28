
import type {
  GovernanceAction,
  GovernanceDecision,
} from "./types.js";

import { redactSecrets } from "../security/redact-secrets.js";

const actionLabels: Record<GovernanceAction, string> = {
  allow: "Allow normal review",
  require_human_review: "Require human review",
  block: "Recommend blocking merge",
};

export function formatGovernanceDecision(
  decision: GovernanceDecision
): string {
  const lines: string[] = [
    "## Governance Assessment",
    "",
    `**Policy:** ${decision.policyName}`,
    `**Risk level:** ${decision.riskLevel.toUpperCase()}`,
    `**Recommended action:** ${actionLabels[decision.action]}`,
    `**Human approval required by policy:** ${
      decision.requiresHumanApproval ? "Yes" : "No"
    }`,
    "",
    "### Decision Reasons",
    "",
  ];

  for (const reason of decision.reasons) {
    lines.push(`- ${reason}`);
  }

  if (decision.action === "block") {
    lines.push(
      "",
      "Human approval alone does not resolve a block recommendation."
    );
  }

  lines.push(
    "",
    "_Governance decisions are advisory. Merge restrictions are not enforced._",
    ""
  );

  return redactSecrets(lines.join("\n"));
}
