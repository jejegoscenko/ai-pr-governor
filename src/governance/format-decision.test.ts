
import { describe, expect, it } from "vitest";

import { formatGovernanceDecision } from "./format-decision.js";

import type { GovernanceDecision } from "./types.js";

describe("Governance decision formatter", () => {
  const decision: GovernanceDecision = {
    policyName: "standard",
    action: "require_human_review",
    riskLevel: "high",
    requiresHumanApproval: true,
    reasons: [
      "Applied governance policy: standard.",
      "Overall PR risk: HIGH.",
      "[SEMGREP] app/config.py: Stripe API Key detected",
    ],
  };

  it("formats the governance assessment", () => {
    const result = formatGovernanceDecision(decision);

    expect(result).toContain("## Governance Assessment");
    expect(result).toContain("**Policy:** standard");
    expect(result).toContain("**Risk level:** HIGH");
  });

  it("displays a human-readable governance action", () => {
    const result = formatGovernanceDecision(decision);

    expect(result).toContain(
      "**Recommended action:** Require human review"
    );
  });

  it("displays whether human approval is required", () => {
    const result = formatGovernanceDecision(decision);

    expect(result).toContain(
      "**Human approval required by policy:** Yes"
    );
  });

  it("preserves the supporting decision reasons", () => {
    const result = formatGovernanceDecision(decision);

    expect(result).toContain(
      "- Applied governance policy: standard."
    );

    expect(result).toContain(
      "- [SEMGREP] app/config.py: Stripe API Key detected"
    );
  });

  it("formats an allow decision correctly", () => {
    const allowDecision: GovernanceDecision = {
      ...decision,
      action: "allow",
      riskLevel: "low",
      requiresHumanApproval: false,
      reasons: ["No findings were reported."],
    };

    const result = formatGovernanceDecision(allowDecision);

    expect(result).toContain(
      "**Recommended action:** Allow normal review"
    );

    expect(result).toContain(
      "**Human approval required by policy:** No"
    );
  });

  it("explains that human approval alone does not resolve a block", () => {
    const blockDecision: GovernanceDecision = {
      ...decision,
      policyName: "strict",
      action: "block",
    };

    const result = formatGovernanceDecision(blockDecision);

    expect(result).toContain(
      "**Recommended action:** Recommend blocking merge"
    );

    expect(result).toContain(
      "Human approval alone does not resolve a block recommendation."
    );
  });

  it("includes the advisory disclaimer", () => {
    const result = formatGovernanceDecision(decision);

    expect(result).toContain(
      "Governance decisions are advisory. Merge restrictions are not enforced."
    );
  });

  it("redacts sensitive values from decision reasons", () => {
    const decisionWithSecret: GovernanceDecision = {
      ...decision,
      reasons: [
        "Detected credential: sk_test_EXAMPLE1234567890",
      ],
    };

    const result = formatGovernanceDecision(
      decisionWithSecret
    );

    expect(result).toContain("[REDACTED_STRIPE_KEY]");

    expect(result).not.toContain(
      "sk_test_EXAMPLE1234567890"
    );
  });
});
