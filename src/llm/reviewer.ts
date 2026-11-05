export type ReviewFinding = {
  file: string;
  severity: "low" | "medium" | "high";
  title: string;
  explanation: string;
};

export type ReviewResult = {
  summary: string;
  findings: ReviewFinding[];
};

export interface CodeReviewer {
  review(context: string): Promise<ReviewResult>;
}