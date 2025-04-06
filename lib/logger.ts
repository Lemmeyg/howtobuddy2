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

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info(context || {}, message);
};

export const logError = (error: Error, context?: Record<string, any>) => {
  if (error instanceof Error) {
    logger.error(
      {
        ...context,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
      error.message
    );
  } else {
    logger.error(context || {}, String(error));
  }
};

export const logWarning = (message: string, context?: Record<string, any>) => {
  logger.warn(context || {}, message);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug(context || {}, message);
};

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