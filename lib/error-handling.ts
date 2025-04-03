import { logError } from "./logger";

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  shouldRetry?: (error: Error) => boolean;
}

export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
    public readonly attempts: number
  ) {
    super(message);
    this.name = "RetryableError";
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    shouldRetry = (error) => !(error instanceof RetryableError),
  } = options;

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      attempt++;

      if (!shouldRetry(lastError) || attempt >= maxAttempts) {
        logError("Operation failed after retries", {
          error: lastError,
          attempts: attempt,
          maxAttempts,
        });
        throw new RetryableError(
          `Operation failed after ${attempt} attempts`,
          lastError,
          attempt
        );
      }

      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

export function isRateLimitError(error: Error): boolean {
  return (
    error.message.includes("Rate limit exceeded") ||
    error.message.includes("429") ||
    error.message.includes("Too Many Requests")
  );
}

export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes("network") ||
    error.message.includes("timeout") ||
    error.message.includes("ECONNRESET")
  );
} 