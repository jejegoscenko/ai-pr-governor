
export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type FindingSource =
  | "ai"
  | "semgrep";

export type GovernanceAction =
  | "allow"
  | "require_human_review"
  | "block";

export type GovernanceFinding = {
  source: FindingSource;
  file: string;
  line?: number;
  severity: RiskLevel;
  originalSeverity: string;
  title: string;
  description: string;
  ruleId?: string;
};

export type RiskAssessment = {
  level: RiskLevel;
  findings: GovernanceFinding[];
  reasons: string[];
};

export type GovernanceDecision = {
  policyName: GovernancePolicyName;
  action: GovernanceAction;
  riskLevel: RiskLevel;
  reasons: string[];
  requiresHumanApproval: boolean;
};

export type GovernancePolicyName =
  | "permissive"
  | "standard"
  | "strict";

export type GovernancePolicy = {
  name: GovernancePolicyName;
  description: string;
  actions: Record<RiskLevel, GovernanceAction>;
};
