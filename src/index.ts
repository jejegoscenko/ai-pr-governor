
import "dotenv/config";

// GitHub integration
import { fetchPullRequest } from "./github/fetch-pr.js";
import { formatReview } from "./github/format-review.js";
import { publishReview } from "./github/publish-review.js";

// Repository context discovery
import { buildReviewContext } from "./review/context.js";
import { discoverContext } from "./review/discover-context.js";

// AI review
import { OpenAIReviewer } from "./llm/openai-reviewer.js";

// Static analysis
import { scanPullRequest } from "./analysis/scan-pr.js";
import { filterFindingsByChangedLines } from "./analysis/filter-findings.js";
import { formatStaticAnalysisContext } from "./analysis/format-findings.js";

// Security
import { redactSecrets } from "./security/redact-secrets.js";

// Governance
import { normalizeFindings } from "./governance/normalize-findings.js";
import { classifyRisk } from "./governance/classify-risk.js";
import { getGovernancePolicy } from "./governance/policies.js";
import { evaluatePolicy } from "./governance/evaluate-policy.js";

async function main(): Promise<void> {
  // 1. Load and validate configuration
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

  const governancePolicy = getGovernancePolicy(
    process.env.GOVERNANCE_POLICY ?? "standard"
  );

  console.log(
    `Governance policy: ${governancePolicy.name}`
  );

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

  // 6. Execute static analysis
  console.log("\nRunning static analysis...");

  const staticFindings = await scanPullRequest(
    owner,
    repo,
    pullRequest.head.sha
  );

  const relevantStaticFindings =
    filterFindingsByChangedLines(staticFindings, files);

  console.log(
    `PR-relevant static findings: ${relevantStaticFindings.length}`
  );

  const staticAnalysisContext =
    formatStaticAnalysisContext(relevantStaticFindings);

  // 7. Combine and sanitize review context
  const combinedReviewContext = [
    enrichedReviewContext,
    staticAnalysisContext,
  ].join("\n\n");

  const sanitizedReviewContext = redactSecrets(
    combinedReviewContext
  );

  // 8. Execute AI review
  console.log("\nRunning AI review...");

  const reviewer = new OpenAIReviewer();
  const review = await reviewer.review(sanitizedReviewContext);

  // 9. Display AI findings
  console.log("\n=== AI REVIEW ===");
  console.log(redactSecrets(`\nSummary: ${review.summary}`));

  for (const finding of review.findings) {
    console.log(
      redactSecrets(
        `\n[${finding.severity.toUpperCase()}] ${finding.file}`
      )
    );

    console.log(redactSecrets(finding.title));
    console.log(redactSecrets(finding.explanation));
  }

  // 10. Normalize findings from both review engines
  const governanceFindings = normalizeFindings(
    review,
    relevantStaticFindings
  );

  // 11. Determine the overall pull request risk
  const riskAssessment = classifyRisk(governanceFindings);

  // 12. Evaluate the risk against the selected policy
  const governanceDecision = evaluatePolicy(
    riskAssessment,
    governancePolicy
  );

  // 13. Display governance decision
  console.log("\n=== GOVERNANCE DECISION ===");

  console.log(`Policy: ${governanceDecision.policyName}`);

  console.log(
    `Risk level: ${governanceDecision.riskLevel.toUpperCase()}`
  );

  console.log(
    `Recommended action: ${governanceDecision.action}`
  );

  console.log(
    `Human approval required: ${
      governanceDecision.requiresHumanApproval ? "Yes" : "No"
    }`
  );

  console.log("\nDecision reasons:");

  for (const reason of governanceDecision.reasons) {
    console.log(redactSecrets(`- ${reason}`));
  }

  console.log(
    "\nGovernance decisions are advisory. Merge restrictions are not enforced."
  );

  // 14. Format the review for GitHub
  const reviewBody = formatReview(
    review,
    relevantStaticFindings,
    governanceDecision
  );

  console.log("\n=== GITHUB REVIEW PREVIEW ===");
  console.log(reviewBody);

  // 15. Publish only when explicitly enabled
  if (process.env.PUBLISH_REVIEW !== "true") {
    console.log(
      "\nPublishing disabled. Review was not posted to GitHub."
    );
    return;
  }

  console.log("\nPublishing review to GitHub...");

  const reviewId = await publishReview(
    owner,
    repo,
    pullNumber,
    pullRequest.head.sha,
    reviewBody
  );

  console.log(`Review published successfully! ID: ${reviewId}`);
}

main().catch((error: unknown) => {
  console.error("AI PR Governor failed:", error);
  process.exit(1);
});
