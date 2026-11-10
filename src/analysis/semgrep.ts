
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execFileAsync = promisify(execFile);

const SemgrepResultSchema = z.object({
  check_id: z.string(),
  path: z.string(),
  start: z.object({
    line: z.number(),
  }),
  extra: z.object({
    severity: z.string(),
    message: z.string(),
  }),
});

const SemgrepOutputSchema = z.object({
  results: z.array(SemgrepResultSchema),
});

export type SemgrepFinding = {
  ruleId: string;
  file: string;
  line: number;
  severity: string;
  message: string;
};


export async function runSemgrep(
  targetDirectory: string
): Promise<SemgrepFinding[]> {
  let stdout: string;

  try {
    const result = await execFileAsync("semgrep", [
      "scan",
      "--config",
      "auto",
      "--json",
      "--quiet",
      targetDirectory,
    ]);

    stdout = result.stdout;
  } catch (error) {
    throw new Error(
      `Semgrep scan failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  let parsed: z.infer<typeof SemgrepOutputSchema>;

  try {
    parsed = SemgrepOutputSchema.parse(JSON.parse(stdout));
  } catch {
    throw new Error("Semgrep returned invalid JSON output.");
  }

  return parsed.results.map((result) => ({
    ruleId: result.check_id,
    file: result.path,
    line: result.start.line,
    severity: result.extra.severity,
    message: result.extra.message,
  }));
}

