
import { octokit } from "./client.js";

export async function fetchRepositoryFile(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<string> {
  const response = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });

  const data = response.data;

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Expected a file at ${path}`);
  }

  if (!("content" in data) || typeof data.content !== "string") {
    throw new Error(`No content returned for ${path}`);
  }

  return Buffer.from(data.content, "base64").toString("utf8");
}
