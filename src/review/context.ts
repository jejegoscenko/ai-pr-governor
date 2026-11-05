type PullRequestFile = {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
};

const IGNORED_FILES = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "uv.lock",
];

function shouldIgnoreFile(filename: string): boolean {
  return IGNORED_FILES.some(
    (ignoredFile) =>
      filename === ignoredFile || filename.endsWith(`/${ignoredFile}`)
  );
}

export function buildReviewContext(files: PullRequestFile[]): string {
  return files
    .filter((file) => !shouldIgnoreFile(file.filename))
    .filter((file) => file.patch)
    .map(
      (file) => `
### ${file.filename}

${file.patch}
`
    )
    .join("\n");
}