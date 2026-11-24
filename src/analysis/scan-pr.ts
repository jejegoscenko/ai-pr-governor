
import { relative, isAbsolute } from "node:path";
import { withPullRequestCheckout } from "../github/checkout-pr.js";
import { runSemgrep } from "./semgrep.js";

export async function scanPullRequest(
  owner: string,
  repo: string,
  commitSha: string
) {
  return withPullRequestCheckout(
    owner,
    repo,
    commitSha,
    async (directory) => {
      console.log(`Running Semgrep on ${owner}/${repo}...`);
      
      const rawFindings = await runSemgrep(directory);

      const findings = rawFindings.map((finding) => ({
        ...finding,
        file: isAbsolute(finding.file)
          ? relative(directory, finding.file)
        : finding.file,
      }));

      console.log(
        `Semgrep completed: ${findings.length} findings.`
      );

      return findings;
    }
  );
}
