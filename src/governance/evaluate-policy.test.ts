
import { describe, expect, it } from "vitest";

import { evaluatePolicy } from "./evaluate-policy.js";
import { getGovernancePolicy } from "./policies.js";

import type {
  RiskAssessment,
  RiskLevel,
} from "./types.js";

function createAssessment(
  level: RiskLevel
): RiskAssessment {
  return {
    level,
    findings: [],
    reasons: [`Example ${level} risk finding.`],
  };
}

describe("Governance policy evaluation", () => {
  it("allows low-risk PRs under the standard policy", () => {
    const decision = evaluatePolicy(
      createAssessment("low"),
      getGovernancePolicy("standard")
    );

    expect(decision.action).toBe("allow");
    expect(decision.requiresHumanApproval).toBe(false);
  });

  it("allows medium-risk PRs under the standard policy", () => {
    const decision = evaluatePolicy(
      createAssessment("medium"),
      getGovernancePolicy("standard")
    );

    expect(decision.action).toBe("allow");
  });

  it("requires human review for high-risk PRs", () => {
    const decision = evaluatePolicy(
      createAssessment("high"),
      getGovernancePolicy("standard")
    );

    expect(decision.action).toBe("require_human_review");
    expect(decision.requiresHumanApproval).toBe(true);
  });

  it("recommends blocking critical-risk PRs", () => {
    const decision = evaluatePolicy(
      createAssessment("critical"),
      getGovernancePolicy("standard")
    );

    expect(decision.action).toBe("block");
    expect(decision.requiresHumanApproval).toBe(true);
  });

  it("requires human review for medium risk under strict policy", () => {
    const decision = evaluatePolicy(
      createAssessment("medium"),
      getGovernancePolicy("strict")
    );

    expect(decision.action).toBe("require_human_review");
  });

  it("recommends blocking high risk under strict policy", () => {
    const decision = evaluatePolicy(
      createAssessment("high"),
      getGovernancePolicy("strict")
    );

    expect(decision.action).toBe("block");
  });

  it("requires human review for critical risk under permissive policy", () => {
    const decision = evaluatePolicy(
      createAssessment("critical"),
      getGovernancePolicy("permissive")
    );

    expect(decision.action).toBe("require_human_review");
  });

  it("preserves the applied policy and original risk level", () => {
    const decision = evaluatePolicy(
      createAssessment("high"),
      getGovernancePolicy("strict")
    );

    expect(decision.policyName).toBe("strict");
    expect(decision.riskLevel).toBe("high");
  });

  it("includes the original risk assessment reasons", () => {
    const decision = evaluatePolicy(
      createAssessment("high"),
      getGovernancePolicy("standard")
    );

    expect(decision.reasons).toContain(
      "Applied governance policy: standard."
    );

    expect(decision.reasons).toContain(
      "Overall PR risk: HIGH."
    );

    expect(decision.reasons).toContain(
      "Recommended action: require_human_review."
    );

    expect(decision.reasons).toContain(
      "Example high risk finding."
    );
  });

  it("produces different decisions for the same risk under different policies", () => {
    const assessment = createAssessment("high");

    const standardDecision = evaluatePolicy(
      assessment,
      getGovernancePolicy("standard")
    );

    const strictDecision = evaluatePolicy(
      assessment,
      getGovernancePolicy("strict")
    );

    expect(standardDecision.action).toBe(
      "require_human_review"
    );

    expect(strictDecision.action).toBe("block");

    expect(standardDecision.riskLevel).toBe(
      strictDecision.riskLevel
    );
  });
});
