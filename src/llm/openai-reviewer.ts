import "dotenv/config";
import OpenAI from "openai";
import type { CodeReviewer, ReviewResult } from "./reviewer.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIReviewer implements CodeReviewer {
  async review(context: string): Promise<ReviewResult> {
    const response = await client.responses.create({
      model: "gpt-5.6",
      instructions: `
You are a senior software engineer performing a pull request review.

Review only the code changes provided to you.

Focus on:
- bugs and correctness
- security vulnerabilities
- maintainability problems
- error handling
- risky implementation choices

Do not report stylistic preferences unless they materially affect the code.

Return your review as JSON with this structure:

{
  "summary": "Short overall assessment",
  "findings": [
    {
      "file": "path/to/file",
      "severity": "low | medium | high",
      "title": "Short title",
      "explanation": "Clear explanation of the problem"
    }
  ]
}
`,
      input: context,
    });

    const text = response.output_text;

    if (!text) {
      throw new Error("OpenAI returned an empty review.");
    }

    return JSON.parse(text) as ReviewResult;
  }
}