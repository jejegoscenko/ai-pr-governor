
import { z } from "zod";

export const ReviewResultSchema = z.object({
  summary: z.string(),
  findings: z.array(
    z.object({
      file: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      title: z.string(),
      explanation: z.string(),
    })
  ),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;
