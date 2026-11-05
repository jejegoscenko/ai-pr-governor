import "dotenv/config";

import { fetchPullRequest } from "./github/fetch-pr.js";
import { buildReviewContext } from "./review/context.js";
import { discoverContext } from "./review/discover-context.js";
import { OpenAIReviewer } from "./llm/openai-reviewer.js";

async function main(): Promise<void> {
  // 1. Load configuration
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const pullNumber = Number(process.env.GITHUB_PR_NUMBER);

  if (
    !owner ||
    !repo ||
    !Number.isSafeInteger(pullNumber) ||
    pullNumber <= 0
  ) {
    throw new Error(
      "Valid GITHUB_OWNER, GITHUB_REPO and GITHUB_PR_NUMBER are required."
    );
  }

  // 2. Fetch pull request
  const { pullRequest, files } = await fetchPullRequest(
    owner,
    repo,
    pullNumber
  );

  console.log(`\nPR #${pullRequest.number}: ${pullRequest.title}`);
  console.log(`Repository: ${owner}/${repo}`);
  console.log(`Changed files: ${pullRequest.changed_files}`);
  console.log(`Additions: +${pullRequest.additions}`);
  console.log(`Deletions: -${pullRequest.deletions}`);

  // 3. Automatically discover relevant repository context
  console.log("\nDiscovering relevant repository context...");

  const selectedContext = await discoverContext(
    owner,
    repo,
    pullRequest.head.sha,
    files
  );

  console.log("\n=== SELECTED REPOSITORY CONTEXT ===");

  for (const file of selectedContext) {
    console.log(
      `${file.path} | matched=${file.matchedSymbols.join(", ")} | characters=${file.content.length}`
    );
  }

  // 4. Build review context
  const reviewContext = buildReviewContext(files);

  const additionalContext = selectedContext
    .map(
      (file) => `
### ${file.path}

Relevant functions: ${file.matchedSymbols.join(", ")}

${file.content}
`
    )
    .join("\n");

  const enrichedReviewContext = `
## Pull Request Changes

${reviewContext}

## Additional Repository Context

The following unchanged files were automatically selected
because they reference functions modified in the PR.

${additionalContext || "No additional relevant files identified."}
`;

  // 5. Allow testing without calling OpenAI
  if (process.env.SKIP_AI_REVIEW === "true") {
    console.log("\nAI review skipped (discovery test).");
    return;
  }

  // 6. Execute AI review
  console.log("\nRunning AI review...");

  const reviewer = new OpenAIReviewer();
  const review = await reviewer.review(enrichedReviewContext);

  // 7. Display findings
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
