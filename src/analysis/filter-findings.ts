

import type { SemgrepFinding } from "./semgrep.js";
import { extractModifiedLineNumbers } from "../review/diff-parser.js";

type ChangedFile = {
  filename: string;
  patch?: string;
};

export function filterFindingsByChangedFiles(
  findings: SemgrepFinding[],
  changedFiles: ChangedFile[]
): SemgrepFinding[] {
  const changedFilePaths = new Set(
    changedFiles.map((file) => file.filename)
  );

  return findings.filter((finding) =>
    changedFilePaths.has(finding.file)
  );
}

export function filterFindingsByChangedLines(
  findings: SemgrepFinding[],
  changedFiles: ChangedFile[]
): SemgrepFinding[] {
  const modifiedLinesByFile = new Map<string, Set<number>>();

  for (const file of changedFiles) {
    if (!file.patch) {
      continue;
    }

    const modifiedLines = extractModifiedLineNumbers(file.patch);

    modifiedLinesByFile.set(
      file.filename,
      new Set(modifiedLines)
    );
  }

  return findings.filter((finding) => {
    const modifiedLines = modifiedLinesByFile.get(finding.file);

    return modifiedLines?.has(finding.line) ?? false;
  });
}
