
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createReviewMock } = vi.hoisted(() => ({
  createReviewMock: vi.fn(),
}));

vi.mock("./client.js", () => ({
  octokit: {
    rest: {
      pulls: {
        createReview: createReviewMock,
      },
    },
  },
}));

import { publishReview } from "./publish-review.js";

describe("GitHub review publishing", () => {
  beforeEach(() => {
    createReviewMock.mockReset();
  });

  it("publishes an informational review to the correct PR", async () => {
    createReviewMock.mockResolvedValue({
      data: { id: 12345 },
    });

    const reviewId = await publishReview(
      "jejegoscenko",
      "ReviewMe",
      1,
      "abc123",
      "## AI PR Governor — Code Review"
    );

    expect(createReviewMock).toHaveBeenCalledExactlyOnceWith({
      owner: "jejegoscenko",
      repo: "ReviewMe",
      pull_number: 1,
      commit_id: "abc123",
      body: "## AI PR Governor — Code Review",
      event: "COMMENT",
    });

    expect(reviewId).toBe(12345);
  });

  it("throws an error when GitHub does not return a review ID", async () => {
    createReviewMock.mockResolvedValue({
      data: {},
    });

    await expect(
      publishReview(
        "jejegoscenko",
        "ReviewMe",
        1,
        "abc123",
        "Review body"
      )
    ).rejects.toThrow("GitHub did not return a review ID.");
  });
});
