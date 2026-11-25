
import { describe, expect, it } from "vitest";

import { redactSecrets } from "./redact-secrets.js";

describe("Sensitive data redaction", () => {
  it("redacts Stripe API keys", () => {
    const content = 'STRIPE_KEY = "sk_test_EXAMPLE1234567890"';

    expect(redactSecrets(content)).toBe(
      'STRIPE_KEY = "[REDACTED_STRIPE_KEY]"'
    );
  });

  it("redacts GitHub personal access tokens", () => {
    const content = 'TOKEN = "ghp_EXAMPLE1234567890"';

    expect(redactSecrets(content)).toBe(
      'TOKEN = "[REDACTED_GITHUB_TOKEN]"'
    );
  });

  it("redacts fine-grained GitHub tokens", () => {
    const content = 'TOKEN = "github_pat_EXAMPLE1234567890"';

    expect(redactSecrets(content)).toBe(
      'TOKEN = "[REDACTED_GITHUB_TOKEN]"'
    );
  });

  it("redacts OpenAI API keys", () => {
    const content = 'API_KEY = "sk-EXAMPLE12345678901234567890"';

    expect(redactSecrets(content)).toBe(
      'API_KEY = "[REDACTED_OPENAI_KEY]"'
    );
  });

  it("redacts AWS access key IDs", () => {
    const content = 'AWS_KEY = "AKIAEXAMPLE123456789"';

    expect(redactSecrets(content)).toBe(
      'AWS_KEY = "[REDACTED_AWS_ACCESS_KEY_ID]"'
    );
  });

  it("redacts multiple secrets in the same content", () => {
    const content = `
STRIPE_KEY = "sk_test_EXAMPLE1234567890"
GITHUB_TOKEN = "ghp_EXAMPLE1234567890"
`;

    const result = redactSecrets(content);

    expect(result).toContain("[REDACTED_STRIPE_KEY]");
    expect(result).toContain("[REDACTED_GITHUB_TOKEN]");
    expect(result).not.toContain("sk_test_EXAMPLE1234567890");
    expect(result).not.toContain("ghp_EXAMPLE1234567890");
  });

  it("preserves content without secrets", () => {
    const content = `
def calculate_total(items):
    return sum(items)
`;

    expect(redactSecrets(content)).toBe(content);
  });

  it("handles empty content", () => {
    expect(redactSecrets("")).toBe("");
  });
});
