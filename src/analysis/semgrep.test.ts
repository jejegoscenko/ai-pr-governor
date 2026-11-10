
import { describe, expect, it, vi, beforeEach } from "vitest";

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execFile: execFileMock,
}));

vi.mock("node:util", () => ({
  promisify: () => execFileMock,
}));

import { runSemgrep } from "./semgrep.js";

describe("Semgrep integration", () => {
  beforeEach(() => {
    execFileMock.mockReset();
  });

  it("parses security findings from Semgrep JSON", async () => {
    execFileMock.mockResolvedValue({
      stdout: JSON.stringify({
        results: [
          {
            check_id: "security.test-rule",
            path: "app/orders.py",
            start: { line: 42 },
            extra: {
              severity: "WARNING",
              message: "Potential security issue",
            },
          },
        ],
      }),
    });

    const findings = await runSemgrep("src/");

    expect(findings).toEqual([
      {
        ruleId: "security.test-rule",
        file: "app/orders.py",
        line: 42,
        severity: "WARNING",
        message: "Potential security issue",
      },
    ]);

    expect(execFileMock).toHaveBeenCalledWith("semgrep", [
      "scan",
      "--config",
      "auto",
      "--json",
      "--quiet",
      "src/",
    ]);
  });

  it("returns an empty array when Semgrep finds no issues", async () => {
    execFileMock.mockResolvedValue({
      stdout: JSON.stringify({ results: [] }),
    });

    const findings = await runSemgrep("src/");

    expect(findings).toEqual([]);
  });

  it("rejects invalid Semgrep output", async () => {
    execFileMock.mockResolvedValue({
      stdout: JSON.stringify({ unexpected: "data" }),
    });

    await expect(runSemgrep("src/")).rejects.toThrow();
  });
});
