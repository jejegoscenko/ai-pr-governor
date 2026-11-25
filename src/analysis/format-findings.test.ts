
import { describe, expect, it } from "vitest";

import { formatStaticAnalysisContext } from "./format-findings.js";
import type { SemgrepFinding } from "./semgrep.js";

describe("Static analysis context formatter", () => {
  const findings: SemgrepFinding[] = [
    {
      ruleId: "security.stripe-key",
      file: "app/config.py",
      line: 14,
      severity: "ERROR",
      message: "Stripe API Key detected",
    },
    {
      ruleId: "security.example-rule",
      file: "app/orders.py",
      line: 42,
      severity: "WARNING",
      message: "Potential security issue",
    },
  ];

  it("formats static analysis findings", () => {
    const result = formatStaticAnalysisContext(findings);

    expect(result).toContain("Static Analysis Findings (Semgrep)");
    expect(result).toContain("Total findings on changed lines: 2");
    expect(result).toContain("[ERROR] app/config.py:14");
    expect(result).toContain("Rule: security.stripe-key");
    expect(result).toContain("Message: Stripe API Key detected");
    expect(result).toContain("[WARNING] app/orders.py:42");
  });

  it("handles an empty findings list", () => {
    const result = formatStaticAnalysisContext([]);

    expect(result).toContain("Total findings on changed lines: 0");
    expect(result).toContain(
      "No findings detected on known changed lines by the selected Semgrep rules."
    );
  });

  it("preserves the original Semgrep severity", () => {
    const result = formatStaticAnalysisContext(findings);

    expect(result).toContain("[ERROR]");
    expect(result).toContain("[WARNING]");
  });
});
