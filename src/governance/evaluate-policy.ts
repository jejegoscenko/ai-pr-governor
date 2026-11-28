
import type {
  GovernanceDecision,
  GovernancePolicy,
  RiskAssessment,
} from "./types.js";

export function evaluatePolicy(
  assessment: RiskAssessment,
  policy: GovernancePolicy
): GovernanceDecision {
  const action = policy.actions[assessment.level];

  const reasons = [
    `Applied governance policy: ${policy.name}.`,
    `Overall PR risk: ${assessment.level.toUpperCase()}.`,
    `Recommended action: ${action}.`,
    ...assessment.reasons,
  ];

  return {
    policyName: policy.name,
    action,
    riskLevel: assessment.level,
    reasons,
    requiresHumanApproval:
      action === "require_human_review" ||
      action === "block",
  };
}
