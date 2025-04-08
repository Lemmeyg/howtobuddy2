import pino from "pino";

// Create a logger instance that works in both Node.js and Edge environments
const logger = pino({
  browser: {
    write: (o) => {
      if (typeof o === "string") {
        console.log(o);
      } else {
        console.log(JSON.stringify(o));
      }
    },
  },
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  base: {
    env: process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION,
  },
});

export interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

export function logInfo(message: string, data?: any) {
  console.log(`[INFO] ${message}`, data || '');
}

export function logError(message: string, data?: any) {
  console.error(`[ERROR] ${message}`, data || '');
}

export function logWarning(message: string, data?: any) {
  console.warn(`[WARN] ${message}`, data || '');
}

export function logDebug(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[DEBUG] ${message}`, data || '');
  }
}

export function logRequest(request: Request, duration: number, context: LogContext = {}) {
  const url = new URL(request.url);
  logInfo("API Request", {
    ...context,
    path: url.pathname,
    method: request.method,
    duration,
    query: Object.fromEntries(url.searchParams),
  });
}

export function logResponse(response: Response, duration: number, context: LogContext = {}) {
  const url = new URL(response.url);
  logInfo("API Response", {
    ...context,
    path: url.pathname,
    status: response.status,
    duration,
  });
} 