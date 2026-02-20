/**
 * Privacy filter — scrubs sensitive data before sending to server.
 * Runs client-side so secrets never leave the machine.
 */

// Patterns that indicate API keys and tokens
const SECRET_PATTERNS = [
  /sk[-_](?:live|test|proj|prod)[a-zA-Z0-9_-]{20,}/g, // OpenAI, Stripe keys
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub PATs
  /gho_[a-zA-Z0-9]{36}/g, // GitHub OAuth
  /github_pat_[a-zA-Z0-9_]{20,}/g, // GitHub fine-grained PATs
  /glpat-[a-zA-Z0-9-]{20,}/g, // GitLab tokens
  /xox[bpras]-[a-zA-Z0-9-]{20,}/g, // Slack tokens
  /AKIA[0-9A-Z]{16}/g, // AWS access keys
  /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g, // JWTs (3 parts)
  /(?:password|passwd|pwd|secret|token|api_key|apikey|auth)\s*[:=]\s*["']?[^\s"',]{8,}/gi, // key=value secrets
  /-----BEGIN (?:RSA |EC |DSA )?(?:PRIVATE|PUBLIC) KEY-----/g, // PEM keys
];

// Path patterns to strip
const PATH_PATTERN = /(?:\/(?:Users|home|var|etc|opt|usr)\/[^\s,)"]+)/g;
const WINDOWS_PATH_PATTERN = /(?:[A-Z]:\\[^\s,)"]+)/g;

// URL with auth params
const AUTH_URL_PATTERN =
  /https?:\/\/[^\s]*(?:token|key|secret|password|auth)=[^\s]*/gi;

// Credential URLs like https://user:pass@host
const CRED_URL_PATTERN = /https?:\/\/[^:]+:[^@]+@[^\s]+/g;

export function sanitize(input: string): string {
  let result = input;

  // Remove file paths
  result = result.replace(PATH_PATTERN, "[path]");
  result = result.replace(WINDOWS_PATH_PATTERN, "[path]");

  // Remove URLs with credentials or auth params
  result = result.replace(CRED_URL_PATTERN, "[url]");
  result = result.replace(AUTH_URL_PATTERN, "[url]");

  // Remove secrets
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, "[redacted]");
  }

  return result;
}

export function sanitizeArray(items: string[]): string[] {
  return items
    .map((item) => sanitize(item))
    .filter((item) => {
      // Drop items that are mostly redacted
      const redactedCount = (item.match(/\[redacted\]/g) || []).length;
      return redactedCount < 3;
    });
}
