
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function withPullRequestCheckout<T>(
  owner: string,
  repo: string,
  commitSha: string,
  callback: (directory: string) => Promise<T>
): Promise<T> {
  const directory = await mkdtemp(
    join(tmpdir(), "ai-pr-governor-")
  );

  try {
    const repositoryUrl =
      `https://github.com/${owner}/${repo}.git`;

    await execFileAsync("git", [
      "clone",
      "--quiet",
      "--no-checkout",
      repositoryUrl,
      directory,
    ]);

    await execFileAsync("git", [
      "-C",
      directory,
      "checkout",
      "--detach",
      commitSha,
    ]);

    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
