import "dotenv/config";
import { fetchPullRequest } from "./github/fetch-pr.js";
import { buildReviewContext } from "./review/context.js";
import { OpenAIReviewer } from "./llm/openai-reviewer.js";

async function main(): Promise<void> {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const pullNumber = Number(process.env.GITHUB_PR_NUMBER);

  if (!owner || !repo || !pullNumber) {
    throw new Error(
      "GITHUB_OWNER, GITHUB_REPO and GITHUB_PR_NUMBER must be configured."
    );
  }

  // Fetch the pull request and its changed files from GitHub.
  const { pullRequest, files } = await fetchPullRequest(
    owner,
    repo,
    pullNumber
  );

  console.log(`\nPR #${pullRequest.number}: ${pullRequest.title}`);
  console.log(`Repository: ${owner}/${repo}`);
  console.log(`Author: ${pullRequest.user?.login}`);
  console.log(`Changed files: ${pullRequest.changed_files}`);
  console.log(`Additions: +${pullRequest.additions}`);
  console.log(`Deletions: -${pullRequest.deletions}`);

  // Prepare the relevant code changes for the AI reviewer.
  const reviewContext = buildReviewContext(files);

  console.log("\nRunning AI review...");

  // Ask the configured reviewer to analyse the pull request.
  const reviewer = new OpenAIReviewer();
  const review = await reviewer.review(reviewContext);

  console.log("\n=== AI REVIEW ===");
  console.log(`\nSummary: ${review.summary}`);

  for (const finding of review.findings) {
    console.log(
      `\n[${finding.severity.toUpperCase()}] ${finding.file}`
    );
    console.log(finding.title);
    console.log(finding.explanation);
  }
}

main().catch((error: unknown) => {
  console.error("AI PR Governor failed:", error);
  process.exit(1);
});