import { pino } from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
    },
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

export function logInfo(message: string, context: LogContext = {}) {
  logger.info({ ...context, timestamp: new Date().toISOString() }, message);
}

export function logError(message: string, context: LogContext = {}) {
  if (context.error) {
    context.error = {
      message: context.error.message,
      stack: context.error.stack,
      name: context.error.name,
    };
  }
  logger.error({ ...context, timestamp: new Date().toISOString() }, message);
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