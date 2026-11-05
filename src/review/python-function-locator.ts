export function findModifiedPythonFunctions(
  source: string,
  modifiedLines: number[]
): string[] {
  const lines = source.split("\n");
  const functions = new Set<string>();

  type FunctionScope = {
    name: string;
    indent: number;
  };

  const scopes: FunctionScope[] = [];
  const modified = new Set(modifiedLines);

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    const lineNumber = index + 1;

    if (!line.trim() || line.trimStart().startsWith("#")) {
      continue;
    }

    const indent = line.match(/^\s*/)?.[0].length ?? 0;

    // Leave scopes when indentation returns to an outer level.
    while (
      scopes.length > 0 &&
      indent <= scopes[scopes.length - 1]!.indent
    ) {
      scopes.pop();
    }

    const match = line.match(
      /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/
    );

    if (match?.[1]) {
      scopes.push({
        name: match[1],
        indent,
      });
    }

    // Associate modified lines with their enclosing function.
    if (modified.has(lineNumber) && scopes.length > 0) {
      functions.add(scopes[scopes.length - 1]!.name);
    }
  }

  return [...functions];
}
