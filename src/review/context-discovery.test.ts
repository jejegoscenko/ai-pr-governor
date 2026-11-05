import { describe, expect, it } from "vitest";

import { extractModifiedLineNumbers } from "./diff-parser.js";
import { findModifiedPythonFunctions } from "./python-function-locator.js";
import {
  selectContextCandidates,
  rankContextCandidates,
} from "./context-selector.js";

describe("Automatic Context Discovery", () => {
  it("discovers a caller of a modified Python function", () => {
    // Simulate a PR that modifies apply_refund().
    const patch = [
      "@@ -1,3 +1,4 @@",
      " def apply_refund(order, amount):",
      "+    ratio = amount / order.total",
      "     order.total -= amount",
      "     return order.total",
    ].join("\n");

    const ordersSource = [
      "def apply_refund(order, amount):",
      "    ratio = amount / order.total",
      "    order.total -= amount",
      "    return order.total",
    ].join("\n");

    const checkoutSource = [
      "from app.orders import apply_refund",
      "",
      "def process_refund(order, amount):",
      "    if order.total <= 0:",
      '        raise ValueError("invalid total")',
      "    return apply_refund(order, amount)",
    ].join("\n");

    const changedFiles = [
      {
        filename: "app/orders.py",
        patch,
      },
    ];

    const repositoryFiles = [
      "app/orders.py",
      "app/checkout.py",
      "app/pricing.py",
    ];

    // Step 1: Identify changed line numbers.
    const modifiedLines = extractModifiedLineNumbers(patch);

    expect(modifiedLines).toEqual([2]);

    // Step 2: Identify the enclosing function.
    const modifiedFunctions = findModifiedPythonFunctions(
      ordersSource,
      modifiedLines
    );

    expect(modifiedFunctions).toContain("apply_refund");

    // Step 3: Find unchanged candidate files.
    const candidates = selectContextCandidates(
      changedFiles,
      repositoryFiles
    );

    // Step 4: Rank files by references to modified functions.
    const fileContents = new Map<string, string>([
      ["app/checkout.py", checkoutSource],
      [
        "app/pricing.py",
        "def calculate_discount(): return 0.1",
      ],
    ]);

    const rankedCandidates = rankContextCandidates(
      candidates,
      modifiedFunctions,
      fileContents
    );

    // Step 5: Verify automatic discovery.
    expect(rankedCandidates).toHaveLength(1);
    expect(rankedCandidates[0]?.path).toBe("app/checkout.py");
    expect(rankedCandidates[0]?.score).toBe(1);
    expect(rankedCandidates[0]?.matchedSymbols).toContain(
      "apply_refund"
    );
  });
});
