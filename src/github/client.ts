import "dotenv/config";
import { Octokit } from "octokit";

const token = process.env.GITHUB_TOKEN;

if (!token) {
  throw new Error(
    "GITHUB_TOKEN is not configured. Add it to your .env file."
  );
}

export const octokit = new Octokit({
  auth: token,
});