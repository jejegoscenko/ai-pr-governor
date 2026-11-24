
import "dotenv/config";

import { fetchPullRequest } from "../github/fetch-pr.js";
import { scanPullRequest } from "./scan-pr.js";

async function main(): Promise<void> {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const pullNumber = Number(process.env.GITHUB_PR_NUMBER);

  if (
    !owner ||
    !repo ||
    !Number.isSafeInteger(pullNumber) ||
    pullNumber <= 0
  ) {
    throw new Error("Valid GitHub PR configuration is required.");
  }

  const { pullRequest } = await fetchPullRequest(
    owner,
    repo,
    pullNumber
  );

  console.log(
    `Scanning PR #${pullNumber} at commit ${pullRequest.head.sha}`
  );

  const findings = await scanPullRequest(
    owner,
    repo,
    pullRequest.head.sha
  );

  console.log("\n=== SEMGREP FINDINGS ===");

  for (const finding of findings) {
    console.log(
      `[${finding.severity}] ${finding.file}:${finding.line}`
    );
    console.log(`Rule: ${finding.ruleId}`);
    console.log(finding.message);
    console.log("");
  }

  if (findings.length === 0) {
    console.log("No findings detected by the selected Semgrep rules.");
  }
}

main().catch((error: unknown) => {
  console.error("PR static analysis failed:", error);
  process.exitCode = 1;
});
