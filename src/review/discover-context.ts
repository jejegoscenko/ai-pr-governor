import { fetchRepositoryFile } from "../github/fetch-file.js";
import { listRepositoryFiles } from "../github/list-files.js";
import { extractModifiedLineNumbers } from "./diff-parser.js";
import { findModifiedPythonFunctions } from "./python-function-locator.js";
import {
  extractChangedFunctions,
  selectContextCandidates,
  rankContextCandidates,
} from "./context-selector.js";

type ChangedFile = {
  filename: string;
  patch?: string;
};

export type SelectedContextFile = {
  path: string;
  content: string;
  matchedSymbols: string[];
};

const MAX_CANDIDATES = 20;
const MAX_CONTEXT_FILES = 3;
const MAX_FILE_CHARACTERS = 12_000;
const MAX_TOTAL_CONTEXT_CHARACTERS = 24_000;

export async function discoverContext(
  owner: string,
  repo: string,
  ref: string,
  changedFiles: ChangedFile[]
): Promise<SelectedContextFile[]> {
  // Discover repository files at the PR commit.
  const repositoryFiles = await listRepositoryFiles(
    owner,
    repo,
    ref
  );

  // Identify functions from the PR diff.
  const changedFunctionNames = new Set(
    extractChangedFunctions(changedFiles)
  );

  // Identify existing Python functions containing modified lines.
  for (const file of changedFiles) {
    if (!file.filename.endsWith(".py") || !file.patch) {
      continue;
    }

    const modifiedLines = extractModifiedLineNumbers(file.patch);

    if (modifiedLines.length === 0) {
      continue;
    }

    const source = await fetchRepositoryFile(
      owner,
      repo,
      file.filename,
      ref
    );

    const modifiedFunctions = findModifiedPythonFunctions(
      source,
      modifiedLines
    );

    for (const name of modifiedFunctions) {
      changedFunctionNames.add(name);
    }
  }

  // Identify unchanged source files that might provide context.
  const candidates = selectContextCandidates(
    changedFiles,
    repositoryFiles
  );

  // Retrieve a bounded number of candidate files.
  const fileContents = new Map<string, string>();

  for (const candidate of candidates.slice(0, MAX_CANDIDATES)) {
    const content = await fetchRepositoryFile(
      owner,
      repo,
      candidate.path,
      ref
    );

    fileContents.set(candidate.path, content);
  }

  // Rank candidates by references to changed functions.
  const rankedCandidates = rankContextCandidates(
    candidates,
    [...changedFunctionNames],
    fileContents
  );

  // Select relevant files within the context budget.
  const selectedContext: SelectedContextFile[] = [];
  let totalCharacters = 0;

  for (const candidate of rankedCandidates) {
    if (selectedContext.length >= MAX_CONTEXT_FILES) {
      break;
    }

    const content = fileContents.get(candidate.path);

    if (!content || content.length > MAX_FILE_CHARACTERS) {
      continue;
    }

    if (
      totalCharacters + content.length >
      MAX_TOTAL_CONTEXT_CHARACTERS
    ) {
      continue;
    }

    selectedContext.push({
      path: candidate.path,
      content,
      matchedSymbols: candidate.matchedSymbols,
    });

    totalCharacters += content.length;
  }

  return selectedContext;
}
