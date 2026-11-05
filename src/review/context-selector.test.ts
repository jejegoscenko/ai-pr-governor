
import { describe, expect, it } from "vitest";

import {
  extractChangedFunctions,
  selectContextCandidates,
  rankContextCandidates,
} from "./context-selector.js";

describe("Context Selector", () => {
  it("extracts added function definitions from a PR diff", () => {
    const files = [
      {
        filename: "app/orders.py",
        patch: `
+def apply_refund(order, amount):
+    return amount / order.total
`,
      },
    ];

    const result = extractChangedFunctions(files);

    expect(result).toContain("apply_refund");
  });

  it("extracts existing functions from diff hunk headers", () => {
    const files = [
      {
        filename: "app/orders.py",
        patch: `
@@ -37,6 +37,8 @@ def apply_refund(order, amount):
+    ratio = amount / order.total
`,
      },
    ];

    const result = extractChangedFunctions(files);

    expect(result).toContain("apply_refund");
  });

  it("excludes changed files from context candidates", () => {
    const changedFiles = [
      {
        filename: "app/orders.py",
        patch: "+def apply_refund(order, amount):",
      },
    ];

    const repositoryFiles = [
      "app/orders.py",
      "app/checkout.py",
      "app/pricing.py",
      "uv.lock",
    ];

    const candidates = selectContextCandidates(
      changedFiles,
      repositoryFiles
    );

    expect(candidates.map((candidate) => candidate.path)).toEqual([
      "app/checkout.py",
      "app/pricing.py",
    ]);
  });

  it("ranks files referencing changed functions", () => {
    const candidates = [
      {
        path: "app/checkout.py",
        score: 0,
        matchedSymbols: [],
      },
      {
        path: "app/pricing.py",
        score: 0,
        matchedSymbols: [],
      },
    ];

    const fileContents = new Map([
      [
        "app/checkout.py",
        `
from app.orders import apply_refund

def process_refund(order, amount):
    return apply_refund(order, amount)
`,
      ],
      [
        "app/pricing.py",
        "def calculate_discount(customer, order): return 0.1",
      ],
    ]);

    const result = rankContextCandidates(
      candidates,
      ["apply_refund"],
      fileContents
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe("app/checkout.py");
    expect(result[0]?.score).toBe(1);
    expect(result[0]?.matchedSymbols).toContain("apply_refund");
  });
});
