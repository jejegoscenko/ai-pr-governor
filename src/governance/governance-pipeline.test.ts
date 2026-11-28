
import { describe, expect, it } from "vitest";

import { normalizeFindings } from "./normalize-findings.js";
import { classifyRisk } from "./classify-risk.js";
import { evaluatePolicy } from "./evaluate-policy.js";
import { getGovernancePolicy } from "./policies.js";

import type { ReviewResult } from "../llm/review-schema.js";
import type { SemgrepFinding } from "../analysis/semgrep.js";

describe("Governance pipeline integration", () => {
  const aiReview: ReviewResult = {
    summary: "Potential refund calculation issue.",
    findings: [
      {
        file: "app/orders.py",
        severity: "medium",
        title: "Incorrect refund ratio",
        explanation: "Uses the remaining order balance.",
      },
    ],
  };

  const staticFindings: SemgrepFinding[] = [
    {
      ruleId: "security.stripe-key",
      file: "app/config.py",
      line: 14,
      severity: "ERROR",
      message: "Stripe API Key detected",
    },
  ];

  it("requires human review for hybrid findings under standard policy", () => {
    const findings = normalizeFindings(
      aiReview,
      staticFindings
    );

    const assessment = classifyRisk(findings);

    const decision = evaluatePolicy(
      assessment,
      getGovernancePolicy("standard")
    );

    expect(findings).toHaveLength(2);
    expect(assessment.level).toBe("high");
    expect(decision.action).toBe("require_human_review");
    expect(decision.requiresHumanApproval).toBe(true);
  });

  it("recommends blocking the same findings under strict policy", () => {
    const findings = normalizeFindings(
      aiReview,
      staticFindings
    );

    const assessment = classifyRisk(findings);

    const decision = evaluatePolicy(
      assessment,
      getGovernancePolicy("strict")
    );

    expect(decision.riskLevel).toBe("high");
    expect(decision.action).toBe("block");
    expect(decision.policyName).toBe("strict");
  });

  it("preserves static analysis evidence when AI reports no findings", () => {
    const findings = normalizeFindings(
      {
        summary: "No AI findings.",
        findings: [],
      },
      staticFindings
    );

    const assessment = classifyRisk(findings);

    const decision = evaluatePolicy(
      assessment,
      getGovernancePolicy("standard")
    );

    expect(assessment.level).toBe("high");
    expect(decision.action).toBe("require_human_review");

    expect(decision.reasons).toContain(
      "[SEMGREP] app/config.py: Stripe API Key detected"
    );
  });

  it("allows completed reviews without findings under standard policy", () => {
    const findings = normalizeFindings(
      {
        summary: "No findings reported.",
        findings: [],
      },
      []
    );

    const assessment = classifyRisk(findings);

    const decision = evaluatePolicy(
      assessment,
      getGovernancePolicy("standard")
    );

    expect(assessment.level).toBe("low");
    expect(decision.action).toBe("allow");
    expect(decision.requiresHumanApproval).toBe(false);
  });

  it("rejects unsupported severity before producing a decision", () => {
    const invalidFindings: SemgrepFinding[] = [
      {
        ...staticFindings[0],
        severity: "UNKNOWN",
      },
    ];

    expect(() => {
      const findings = normalizeFindings(
        aiReview,
        invalidFindings
      );

      const assessment = classifyRisk(findings);

      evaluatePolicy(
        assessment,
        getGovernancePolicy("standard")
      );
    }).toThrow("Unsupported Semgrep severity");
  });
});
