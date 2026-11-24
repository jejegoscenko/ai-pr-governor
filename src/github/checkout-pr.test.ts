
import { describe, expect, it, vi } from "vitest";
import { access } from "node:fs/promises";

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execFile: execFileMock,
}));

vi.mock("node:util", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("node:util")>();

  return {
    ...original,
    promisify: () => execFileMock,
  };
});

import { withPullRequestCheckout } from "./checkout-pr.js";

describe("Pull request checkout", () => {
  it("checks out the requested commit and cleans up", async () => {
    execFileMock.mockResolvedValue({
      stdout: "",
      stderr: "",
    });

    let checkoutDirectory = "";

    const result = await withPullRequestCheckout(
      "jejegoscenko",
      "ReviewMe",
      "abc123",
      async (directory) => {
        checkoutDirectory = directory;

        await access(directory);

        return "scan completed";
      }
    );

    expect(result).toBe("scan completed");

    expect(execFileMock).toHaveBeenCalledWith("git", [
      "clone",
      "--quiet",
      "--no-checkout",
      "https://github.com/jejegoscenko/ReviewMe.git",
      checkoutDirectory,
    ]);

    expect(execFileMock).toHaveBeenCalledWith("git", [
      "-C",
      checkoutDirectory,
      "checkout",
      "--detach",
      "abc123",
    ]);

    await expect(access(checkoutDirectory)).rejects.toThrow();
  });

  it("cleans up when the callback fails", async () => {
    execFileMock.mockResolvedValue({
      stdout: "",
      stderr: "",
    });

    let checkoutDirectory = "";

    await expect(
      withPullRequestCheckout(
        "jejegoscenko",
        "ReviewMe",
        "abc123",
        async (directory) => {
          checkoutDirectory = directory;
          throw new Error("Scan failed");
        }
      )
    ).rejects.toThrow("Scan failed");

    await expect(access(checkoutDirectory)).rejects.toThrow();
  });
});
