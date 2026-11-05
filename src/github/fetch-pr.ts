import { octokit } from "./client.js";

export async function fetchPullRequest(
  owner: string,
  repo: string,
  pullNumber: number
) {
  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const { data: files } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });

  return {
    pullRequest,
    files,
  };
}