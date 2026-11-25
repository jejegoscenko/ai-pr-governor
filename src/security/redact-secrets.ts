
type SecretPattern = {
  pattern: RegExp;
  replacement: string;
};

const secretPatterns: SecretPattern[] = [
  {
    pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/g,
    replacement: "[REDACTED_STRIPE_KEY]",
  },
  {
    pattern: /\bgh[pousr]_[A-Za-z0-9_]+\b/g,
    replacement: "[REDACTED_GITHUB_TOKEN]",
  },
  {
    pattern: /\bgithub_pat_[A-Za-z0-9_]+\b/g,
    replacement: "[REDACTED_GITHUB_TOKEN]",
  },
  {
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
    replacement: "[REDACTED_OPENAI_KEY]",
  },
  {
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    replacement: "[REDACTED_AWS_ACCESS_KEY_ID]",
  },
];

export function redactSecrets(content: string): string {
  let sanitizedContent = content;

  for (const { pattern, replacement } of secretPatterns) {
    sanitizedContent = sanitizedContent.replace(
      pattern,
      replacement
    );
  }

  return sanitizedContent;
}
