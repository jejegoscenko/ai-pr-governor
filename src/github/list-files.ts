
import { octokit } from "./client.js";

export async function listRepositoryFiles(
  owner: string,
  repo: string,
  ref: string
): Promise<string[]> {
  const { data: tree } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: ref,
    recursive: "true",
  });

  if (tree.truncated) {
    throw new Error(
      "Repository tree is truncated. Cannot safely discover all files."
    );
  }

  return tree.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
    .filter((path): path is string => Boolean(path));
}
