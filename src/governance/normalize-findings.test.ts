
import { describe, expect, it } from "vitest";

import {
  normalizeSemgrepSeverity,
  normalizeAIFindings,
  normalizeSemgrepFindings,
  normalizeFindings,
} from "./normalize-findings.js";

import type { ReviewResult } from "../llm/review-schema.js";
import type { SemgrepFinding } from "../analysis/semgrep.js";

describe("Governance finding normalization", () => {
  const aiReview: ReviewResult = {
    summary: "Potential correctness issue identified.",
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

  it("normalizes INFO severity to low", () => {
    expect(normalizeSemgrepSeverity("INFO")).toBe("low");
  });

  it("normalizes WARNING severity to medium", () => {
    expect(normalizeSemgrepSeverity("WARNING")).toBe("medium");
  });

  it("normalizes ERROR severity to high", () => {
    expect(normalizeSemgrepSeverity("ERROR")).toBe("high");
  });

  it("handles lowercase severity values", () => {
    expect(normalizeSemgrepSeverity("error")).toBe("high");
  });

  it("rejects unsupported severity values", () => {
    expect(() =>
      normalizeSemgrepSeverity("UNKNOWN")
    ).toThrow("Unsupported Semgrep severity");
  });

  it("normalizes AI findings", () => {
    const result = normalizeAIFindings(aiReview);

    expect(result).toEqual([
      {
        source: "ai",
        file: "app/orders.py",
        severity: "medium",
        originalSeverity: "medium",
        title: "Incorrect refund ratio",
        description: "Uses the remaining order balance.",
      },
    ]);
  });

  it("normalizes Semgrep findings and preserves evidence", () => {
    const result = normalizeSemgrepFindings(staticFindings);

    expect(result).toEqual([
      {
        source: "semgrep",
        file: "app/config.py",
        line: 14,
        severity: "high",
        originalSeverity: "ERROR",
        title: "Stripe API Key detected",
        description: "Stripe API Key detected",
        ruleId: "security.stripe-key",
      },
    ]);
  });

  it("combines AI and Semgrep findings", () => {
    const result = normalizeFindings(
      aiReview,
      staticFindings
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.source).toBe("semgrep");
    expect(result[1]?.source).toBe("ai");
  });

  it("handles reviews without findings", () => {
    const result = normalizeFindings(
      {
        summary: "No findings identified.",
        findings: [],
      },
      []
    );

    expect(result).toEqual([]);
  });
});
