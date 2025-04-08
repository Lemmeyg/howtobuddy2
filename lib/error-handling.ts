import { logError } from "./logger";

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  shouldRetry?: (error: any) => boolean;
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
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    shouldRetry = () => true
  } = options;

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
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