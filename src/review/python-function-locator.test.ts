import { describe, expect, it } from "vitest";
import { findModifiedPythonFunctions } from "./python-function-locator.js";

describe("Python Function Locator", () => {
  it("identifies a function containing a modified line", () => {
    const source = [
      "def apply_refund(order, amount):",
      "    ratio = amount / order.total",
      "    order.total -= amount",
      "    return ratio",
    ].join("\n");

    expect(findModifiedPythonFunctions(source, [2])).toEqual([
      "apply_refund",
    ]);
  });

  it("distinguishes between multiple functions", () => {
    const source = [
      "def first():",
      "    return 1",
      "",
      "def second():",
      "    return 2",
    ].join("\n");

    expect(findModifiedPythonFunctions(source, [5])).toEqual([
      "second",
    ]);
  });

  it("supports multiple modified functions", () => {
    const source = [
      "def first():",
      "    return 1",
      "",
      "def second():",
      "    return 2",
    ].join("\n");

    expect(findModifiedPythonFunctions(source, [2, 5])).toEqual([
      "first",
      "second",
    ]);
  });
});
