
type ChangedFile = {
  filename: string;
  patch?: string;
};

type ContextCandidate = {
  path: string;
  score: number;
  matchedSymbols: string[];
};

const IGNORED_DIRECTORIES = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  "__pycache__/",
];

const SOURCE_EXTENSIONS = [
  ".py",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
];

export function extractChangedFunctions(
  files: ChangedFile[]
): string[] {
  const functions = new Set<string>();

  for (const file of files) {
    if (!file.patch) continue;

    const lines = file.patch.split("\n");

    for (const line of lines) {
      // Identify newly added function definitions.
      if (line.startsWith("+") && !line.startsWith("+++")) {
        const match = line.match(
          /^\+\s*(?:async\s+)?(?:def|function)\s+([A-Za-z_]\w*)\s*\(/
        );

        if (match?.[1]) {
          functions.add(match[1]);
        }
      }

      // Identify existing functions from diff hunk headers.
      if (line.startsWith("@@")) {
        const match = line.match(
          /@@.*@@.*\b(?:def|function)\s+([A-Za-z_]\w*)\s*\(/
        );

        if (match?.[1]) {
          functions.add(match[1]);
        }
      }
    }
  }

  return [...functions];
}

export function selectContextCandidates(
  changedFiles: ChangedFile[],
  repositoryFiles: string[]
): ContextCandidate[] {
  const changedPaths = new Set(
    changedFiles.map((file) => file.filename)
  );

  return repositoryFiles
    .filter((path) => !changedPaths.has(path))
    .filter((path) =>
      SOURCE_EXTENSIONS.some((ext) => path.endsWith(ext))
    )
    .filter(
      (path) =>
        !IGNORED_DIRECTORIES.some((dir) =>
          path.startsWith(dir)
        )
    )
    .map((path) => ({
      path,
      score: 0,
      matchedSymbols: [] as string[],
    }));
}

export function rankContextCandidates(
  candidates: ContextCandidate[],
  changedFunctions: string[],
  fileContents: Map<string, string>
): ContextCandidate[] {
  return candidates
    .map((candidate) => {
      const content = fileContents.get(candidate.path) ?? "";

      const matchedSymbols = changedFunctions.filter((symbol) => {
        const pattern = new RegExp(`\\b${symbol}\\s*\\(`);
        return pattern.test(content);
      });

      return {
        ...candidate,
        score: matchedSymbols.length,
        matchedSymbols,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);
}
