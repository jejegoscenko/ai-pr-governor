
import { describe, expect, it } from "vitest";

import { getGovernancePolicy } from "./policies.js";

describe("Governance policies", () => {
  it("uses the standard policy by default", () => {
    const policy = getGovernancePolicy();

    expect(policy.name).toBe("standard");
  });

  it("returns the permissive policy", () => {
    const policy = getGovernancePolicy("permissive");

    expect(policy.name).toBe("permissive");

    expect(policy.actions).toEqual({
      low: "allow",
      medium: "allow",
      high: "require_human_review",
      critical: "require_human_review",
    });
  });

  it("returns the standard policy", () => {
    const policy = getGovernancePolicy("standard");

    expect(policy.name).toBe("standard");

    expect(policy.actions).toEqual({
      low: "allow",
      medium: "allow",
      high: "require_human_review",
      critical: "block",
    });
  });

  it("returns the strict policy", () => {
    const policy = getGovernancePolicy("strict");

    expect(policy.name).toBe("strict");

    expect(policy.actions).toEqual({
      low: "allow",
      medium: "require_human_review",
      high: "block",
      critical: "block",
    });
  });

  it("rejects unsupported policy names", () => {
    expect(() =>
      getGovernancePolicy("unknown")
    ).toThrow("Unsupported governance policy");
  });

  it("rejects an empty policy name", () => {
    expect(() =>
      getGovernancePolicy("")
    ).toThrow("Unsupported governance policy");
  });

  it("does not silently accept misspelled policy names", () => {
    expect(() =>
      getGovernancePolicy("strcit")
    ).toThrow("Unsupported governance policy");
  });
});
