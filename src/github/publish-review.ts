import { octokit } from "./client.js";

export async function publishReview(
  owner: string,
  repo: string,
  pullNumber: number,
  commitId: string,
  body: string
): Promise<number> {
  const { data } = await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    commit_id: commitId,
    body,
    event: "COMMENT",
  });

  if (!data.id) {
    throw new Error("GitHub did not return a review ID.");
  }

  return data.id;
}
