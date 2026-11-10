import { describe, expect, it } from "vitest";

import { formatReview } from "./format-review.js";

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
