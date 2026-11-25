
import "dotenv/config";
import {
  filterFindingsByChangedFiles,
  filterFindingsByChangedLines,
} from "./filter-findings.js";
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

const { pullRequest, files } = await fetchPullRequest(
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

  const fileLevelFindings = filterFindingsByChangedFiles(
    findings,
    files
  );

  const lineLevelFindings = filterFindingsByChangedLines(
    findings,
    files
  );

  console.log("\n=== STATIC ANALYSIS SUMMARY ===");
  console.log(`Total repository findings: ${findings.length}`);
  console.log(`Findings in changed files: ${fileLevelFindings.length}`);
  console.log(`Findings on changed lines: ${lineLevelFindings.length}`);


  console.log("\n=== PR-RELEVANT SEMGREP FINDINGS ===");

  for (const finding of lineLevelFindings) {
    console.log(
      `[${finding.severity}] ${finding.file}:${finding.line}`
    );
    console.log(`Rule: ${finding.ruleId}`);
    console.log(finding.message);
    console.log("");
  }

  if (lineLevelFindings.length === 0) {
    console.log("No Semgrep findings starting on known changed lines.");
  }
}

main().catch((error: unknown) => {
  console.error("PR static analysis failed:", error);
  process.exitCode = 1;
});
