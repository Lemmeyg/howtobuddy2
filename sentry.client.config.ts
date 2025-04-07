import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  
  // Recommended settings for Next.js
  integrations: [],
  tracesSampleRate: 0,
  
  // Disable features that cause build issues
  autoSessionTracking: false,
  enableTracing: false,
  
  // Ignore common browser issues
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Network request failed',
  ],
}); 