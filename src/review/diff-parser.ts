/**
 * Extracts line numbers added or modified in the new version
 * of a file from a GitHub unified diff.
 */
export function extractModifiedLineNumbers(
  patch: string
): number[] {
  const modifiedLines = new Set<number>();

  let newLineNumber = 0;
  let insideHunk = false;

  for (const line of patch.split("\n")) {
    // A hunk header identifies where changes begin.
    // Example: @@ -37,6 +37,8 @@
    const hunkMatch = line.match(
      /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/
    );

    if (hunkMatch) {
      newLineNumber = Number(hunkMatch[1]);
      insideHunk = true;
      continue;
    }

    if (!insideHunk) {
      continue;
    }

    // Added lines exist only in the new version.
    if (line.startsWith("+") && !line.startsWith("+++")) {
      modifiedLines.add(newLineNumber);
      newLineNumber++;
      continue;
    }

    // Removed lines do not consume a new-file line number.
    if (line.startsWith("-") && !line.startsWith("---")) {
      continue;
    }

    // Metadata about missing newline is not source code.
    if (line.startsWith("\\")) {
      continue;
    }

    // Unchanged context exists in both versions.
    if (line.startsWith(" ")) {
      newLineNumber++;
    }
  }

  return [...modifiedLines].sort((a, b) => a - b);
}
