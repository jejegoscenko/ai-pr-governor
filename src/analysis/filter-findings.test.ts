

import { describe, expect, it } from "vitest";

import {
  filterFindingsByChangedFiles,
  filterFindingsByChangedLines,
} from "./filter-findings.js";
import type { SemgrepFinding } from "./semgrep.js";

describe("Semgrep findings filter", () => {
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
      file: "app/users.py",
      line: 25,
      severity: "WARNING",
      message: "Potential security issue",
    },
  ];

  it("keeps findings from changed files", () => {
    const changedFiles = [
      { filename: "app/config.py" },
    ];

    const result = filterFindingsByChangedFiles(
      findings,
      changedFiles
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.file).toBe("app/config.py");
  });

  it("excludes findings from unchanged files", () => {
    const changedFiles = [
      { filename: "app/orders.py" },
    ];

    const result = filterFindingsByChangedFiles(
      findings,
      changedFiles
    );

    expect(result).toEqual([]);
  });

  it("handles an empty findings list", () => {
    const result = filterFindingsByChangedFiles(
      [],
      [{ filename: "app/config.py" }]
    );

    expect(result).toEqual([]);
  });

  it("handles an empty changed files list", () => {
    const result = filterFindingsByChangedFiles(
      findings,
      []
    );

    expect(result).toEqual([]);
  });
});

describe("Semgrep line-level filtering", () => {
  const findings: SemgrepFinding[] = [
    {
      ruleId: "security.stripe-key",
      file: "app/config.py",
      line: 14,
      severity: "ERROR",
      message: "Stripe API Key detected",
    },
    {
      ruleId: "security.existing-issue",
      file: "app/config.py",
      line: 20,
      severity: "WARNING",
      message: "Existing security issue",
    },
    {
      ruleId: "security.other-file",
      file: "app/users.py",
      line: 14,
      severity: "WARNING",
      message: "Potential security issue",
    },
  ];

  const changedFiles = [
    {
      filename: "app/config.py",
      patch: `@@ -13,2 +13,3 @@
 existing_config = True
+stripe_key = "example"
 timeout = 30`,
    },
  ];

  it("keeps findings on newly added lines", () => {
    const result = filterFindingsByChangedLines(
      findings,
      changedFiles
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.file).toBe("app/config.py");
    expect(result[0]?.line).toBe(14);
  });

  it("excludes findings on unchanged lines", () => {
    const result = filterFindingsByChangedLines(
      [findings[1]],
      changedFiles
    );

    expect(result).toEqual([]);
  });

  it("excludes findings from unchanged files", () => {
    const result = filterFindingsByChangedLines(
      [findings[2]],
      changedFiles
    );

    expect(result).toEqual([]);
  });

  it("handles changed files without a patch", () => {
    const result = filterFindingsByChangedLines(
      findings,
      [{ filename: "app/config.py" }]
    );

    expect(result).toEqual([]);
  });

  it("handles an empty findings list", () => {
    const result = filterFindingsByChangedLines(
      [],
      changedFiles
    );

    expect(result).toEqual([]);
  });
});
