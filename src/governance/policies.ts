
import type {
  GovernancePolicy,
  GovernancePolicyName,
} from "./types.js";

export const governancePolicies: Record<
  GovernancePolicyName,
  GovernancePolicy
> = {
  permissive: {
    name: "permissive",
    description:
      "Prioritizes delivery flexibility with additional human review for significant risks.",
    actions: {
      low: "allow",
      medium: "allow",
      high: "require_human_review",
      critical: "require_human_review",
    },
  },

  standard: {
    name: "standard",
    description:
      "Balances delivery efficiency with security and quality requirements.",
    actions: {
      low: "allow",
      medium: "allow",
      high: "require_human_review",
      critical: "block",
    },
  },

  strict: {
    name: "strict",
    description:
      "Applies stronger governance controls to potentially risky changes.",
    actions: {
      low: "allow",
      medium: "require_human_review",
      high: "block",
      critical: "block",
    },
  },
};

export function getGovernancePolicy(
  name: string = "standard"
): GovernancePolicy {
  switch (name) {
    case "permissive":
    case "standard":
    case "strict":
      return governancePolicies[name];

    default:
      throw new Error(
        `Unsupported governance policy: ${name}`
      );
  }
}
