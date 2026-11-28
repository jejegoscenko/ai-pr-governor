import { describe, expect, it } from "vitest";
import { formatReview } from "./format-review.js";
import type { SemgrepFinding } from "../analysis/semgrep.js";
import type { GovernanceDecision } from "../governance/types.js";

describe("GitHub Review Formatter", () => {
  it("formats a review with findings", () => {
    const review = {
      summary: "Two issues were identified.",
      findings: [
        {
          file: "app/orders.py",
          severity: "high" as const,
          title: "Incorrect refund calculation",
          explanation: "The refund ratio uses a mutable balance.",
        },
        {
          file: "app/report.py",
          severity: "medium" as const,
          title: "Incorrect reporting totals",
          explanation: "Order totals are counted multiple times.",
        },
      ],
    };

    const result = formatReview(review);

    expect(result).toContain("AI PR Governor");
    expect(result).toContain("Two issues were identified.");
    expect(result).toContain("**Findings:** 2");
    expect(result).toContain("[HIGH] Incorrect refund calculation");
    expect(result).toContain("[MEDIUM] Incorrect reporting totals");
    expect(result).toContain("`app/orders.py`");
  });

  it("handles reviews without findings", () => {
    const review = {
      summary: "No significant issues found.",
      findings: [],
    };

    const result = formatReview(review);

    expect(result).toContain("**Findings:** 0");
    expect(result).toContain("No actionable findings identified.");
  });

  it("includes a human verification disclaimer", () => {
    const review = {
      summary: "One issue identified.",
      findings: [],
    };

    const result = formatReview(review);

    expect(result).toContain(
      "Automated AI review. Findings require human verification."
    );
  });
});


describe("Hybrid GitHub review formatter", () => {
  const review = {
    summary: "AI review completed.",
    findings: [],
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

  it("preserves static findings when AI reports no issues", () => {
    const result = formatReview(review, staticFindings);

    expect(result).toContain(
      "Static Analysis Findings (Semgrep)"
    );
    expect(result).toContain("[ERROR] app/config.py:14");
    expect(result).toContain("Rule: security.stripe-key");
    expect(result).toContain("Stripe API Key detected");
    expect(result).toContain("AI Review Findings");
    expect(result).toContain("**Findings:** 0");
  });

  it("distinguishes missing static analysis from zero findings", () => {
    const missingResults = formatReview(review);
    const emptyResults = formatReview(review, []);

    expect(missingResults).toContain(
      "Static analysis results were not provided."
    );

    expect(emptyResults).toContain(
      "Total findings on changed lines: 0"
    );

    expect(emptyResults).not.toContain(
      "Static analysis results were not provided."
    );
  });

  it("includes both static analysis and AI findings", () => {
    const aiReview = {
      summary: "Additional issue identified.",
      findings: [
        {
          file: "app/orders.py",
          severity: "high" as const,
          title: "Incorrect refund calculation",
          explanation: "The calculation uses a mutable balance.",
        },
      ],
    };

    const result = formatReview(aiReview, staticFindings);

    expect(result).toContain("[ERROR] app/config.py:14");
    expect(result).toContain(
      "[HIGH] Incorrect refund calculation"
    );
    expect(result).toContain("**Findings:** 1");
  });

  it("redacts sensitive values from the final review", () => {
    const reviewWithSecret = {
      summary: 'Detected key: sk_test_EXAMPLE1234567890',
      findings: [],
    };

    const result = formatReview(
      reviewWithSecret,
      staticFindings
    );

    expect(result).toContain("[REDACTED_STRIPE_KEY]");
    expect(result).not.toContain(
      "sk_test_EXAMPLE1234567890"
    );
  });
});


describe("GitHub review with governance assessment", () => {
  const review = {
    summary: "Potential security and correctness issues.",
    findings: [
      {
        file: "app/orders.py",
        severity: "medium" as const,
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

  const governanceDecision: GovernanceDecision = {
    policyName: "standard",
    action: "require_human_review",
    riskLevel: "high",
    requiresHumanApproval: true,
    reasons: [
      "[SEMGREP] app/config.py: Stripe API Key detected",
    ],
  };

  it("includes all three review components", () => {
    const result = formatReview(
      review,
      staticFindings,
      governanceDecision
    );

    expect(result).toContain("## Governance Assessment");
    expect(result).toContain(
      "## Static Analysis Findings (Semgrep)"
    );
    expect(result).toContain("## AI Review Findings");
    expect(result).toContain("[ERROR] app/config.py:14");
    expect(result).toContain("[MEDIUM] Incorrect refund ratio");
  });

  it("preserves the governance decision", () => {
    const result = formatReview(
      review,
      staticFindings,
      governanceDecision
    );

    expect(result).toContain("**Policy:** standard");
    expect(result).toContain("**Risk level:** HIGH");
    expect(result).toContain(
      "**Recommended action:** Require human review"
    );
    expect(result).toContain(
      "**Human approval required by policy:** Yes"
    );
  });

  it("places governance before detailed findings", () => {
    const result = formatReview(
      review,
      staticFindings,
      governanceDecision
    );

    const governancePosition = result.indexOf(
      "## Governance Assessment"
    );

    const staticPosition = result.indexOf(
      "## Static Analysis Findings (Semgrep)"
    );

    const aiPosition = result.indexOf(
      "## AI Review Findings"
    );

    expect(governancePosition).toBeGreaterThanOrEqual(0);
    expect(staticPosition).toBeGreaterThan(governancePosition);
    expect(aiPosition).toBeGreaterThan(staticPosition);
  });

  it("explicitly reports missing governance assessments", () => {
    const result = formatReview(review, staticFindings);

    expect(result).toContain(
      "Governance assessment was not provided."
    );

    expect(result).not.toContain(
      "**Recommended action:** Allow normal review"
    );
  });

  it("preserves a block recommendation and advisory disclaimer", () => {
    const blockDecision: GovernanceDecision = {
      ...governanceDecision,
      policyName: "strict",
      action: "block",
    };

    const result = formatReview(
      review,
      staticFindings,
      blockDecision
    );

    expect(result).toContain(
      "**Recommended action:** Recommend blocking merge"
    );

    expect(result).toContain(
      "Human approval alone does not resolve a block recommendation."
    );

    expect(result).toContain(
      "Governance decisions are advisory. Merge restrictions are not enforced."
    );
  });
});


