import type { ReviewResult } from "./review-schema.js";

export interface CodeReviewer {
  review(context: string): Promise<ReviewResult>;
}