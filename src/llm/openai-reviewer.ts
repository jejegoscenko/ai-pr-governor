
import "dotenv/config";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import type { CodeReviewer } from "./reviewer.js";
import {
  ReviewResultSchema,
  type ReviewResult,
} from "./review-schema.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIReviewer implements CodeReviewer {
  async review(context: string): Promise<ReviewResult> {
    const response = await client.responses.parse({
      model: "gpt-5.6",
      instructions: `
You are a senior software engineer performing a pull request review.

Review only the code changes provided.

Focus on:
- correctness and bugs
- security vulnerabilities
- maintainability problems
- error handling
- risky implementation choices

Avoid stylistic feedback unless it materially affects the code.

Report only actionable findings.
Do not assume that a suspicious change is necessarily a bug.
If more context is needed to confirm a finding, explain the uncertainty.
`,
      input: context,
      text: {
        format: zodTextFormat(
          ReviewResultSchema,
          "code_review"
        ),
      },
    });

    if (response.status !== "completed") {
      throw new Error(
        `AI review did not complete: ${response.status}`
      );
    }

    if (!response.output_parsed) {
      throw new Error(
        "AI review returned no structured result."
      );
    }

    return response.output_parsed;
  }
}
