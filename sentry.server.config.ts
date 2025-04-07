import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  
  // Disable problematic features
  integrations: [],
  autoSessionTracking: false,
  enableTracing: false,
  tracesSampleRate: 0,
}); 