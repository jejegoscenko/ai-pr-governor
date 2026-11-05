import { describe, expect, it } from "vitest";

import {
  extractModifiedLineNumbers,
} from "./diff-parser.js";

describe("Diff Parser", () => {
  it("extracts added line numbers", () => {
    const patch = [
      "@@ -10,3 +10,4 @@",
      " def apply_refund(order, amount):",
      "+    ratio = amount / order.total",
      "     order.refunds.append(amount)",
      "     order.total -= amount",
    ].join("\n");

    expect(extractModifiedLineNumbers(patch)).toEqual([11]);
  });

  it("handles removed lines correctly", () => {
    const patch = [
      "@@ -5,3 +5,3 @@",
      " def calculate():",
      "-    return 10",
      "+    return 20",
      " ",
    ].join("\n");

    expect(extractModifiedLineNumbers(patch)).toEqual([6]);
  });

  it("handles multiple hunks", () => {
    const patch = [
      "@@ -2,2 +2,3 @@",
      " def first():",
      "+    print('new')",
      "     pass",
      "@@ -20,2 +21,3 @@",
      " def second():",
      "+    print('another')",
      "     pass",
    ].join("\n");

    expect(extractModifiedLineNumbers(patch)).toEqual([3, 22]);
  });
});
