
import { describe, expect, it } from "vitest";

import { classifyRisk } from "./classify-risk.js";

import type {
  GovernanceFinding,
  RiskLevel,
  FindingSource,
} from "./types.js";

function createFinding(
  severity: RiskLevel,
  source: FindingSource = "ai"
): GovernanceFinding {
  return {
    source,
    file: "app/orders.py",
    severity,
    originalSeverity: severity,
    title: `${severity} severity issue`,
    description: "Example finding for testing.",
  };
}

describe("Risk classification", () => {
  it("classifies empty findings as low risk", () => {
    const result = classifyRisk([]);

    expect(result.level).toBe("low");
    expect(result.findings).toEqual([]);
    expect(result.reasons).toContain(
      "No findings were reported by the review engines."
    );
  });

  it("classifies low-severity findings as low risk", () => {
    const result = classifyRisk([
      createFinding("low"),
    ]);

    expect(result.level).toBe("low");
  });

  it("classifies medium-severity findings as medium risk", () => {
    const result = classifyRisk([
      createFinding("low"),
      createFinding("medium"),
    ]);

    expect(result.level).toBe("medium");
  });

  it("classifies high-severity findings as high risk", () => {
    const result = classifyRisk([
      createFinding("low"),
      createFinding("medium"),
      createFinding("high"),
    ]);

    expect(result.level).toBe("high");
  });

  it("classifies critical findings as critical risk", () => {
    const result = classifyRisk([
      createFinding("high"),
      createFinding("critical"),
    ]);

    expect(result.level).toBe("critical");
  });

  it("produces the same risk regardless of finding order", () => {
    const findings = [
      createFinding("medium"),
      createFinding("high"),
      createFinding("low"),
    ];

    const first = classifyRisk(findings);
    const second = classifyRisk([...findings].reverse());

    expect(first.level).toBe(second.level);
    expect(first.level).toBe("high");
  });

  it("explains the findings responsible for the risk level", () => {
    const result = classifyRisk([
      createFinding("low"),
      createFinding("high", "semgrep"),
      createFinding("high", "ai"),
    ]);

    expect(result.reasons).toEqual([
      "[SEMGREP] app/orders.py: high severity issue",
      "[AI] app/orders.py: high severity issue",
    ]);
  });

  it("preserves all original findings", () => {
    const findings = [
      createFinding("low"),
      createFinding("medium"),
      createFinding("high"),
    ];

    const result = classifyRisk(findings);

    expect(result.findings).toEqual(findings);
  });

  it("does not escalate multiple medium findings to high risk", () => {
    const result = classifyRisk([
      createFinding("medium"),
      createFinding("medium"),
      createFinding("medium"),
    ]);

    expect(result.level).toBe("medium");
  });
});
