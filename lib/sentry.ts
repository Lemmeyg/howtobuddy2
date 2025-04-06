import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if we have a valid DSN
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    // Disable features that cause build issues
    autoSessionTracking: false,
    integrations: (defaults) => 
      defaults.filter(integration => 
        // Remove problematic integrations
        !integration.name.includes('OpenTelemetry') &&
        !integration.name.includes('Http') &&
        !integration.name.includes('Node')
      ),
    // Disable performance monitoring features that depend on Node
    enableTracing: false,
    tracesSampleRate: 0,
  })
}

// Error logging utility
export const logError = (error: Error, context?: Record<string, any>) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error(error, context)
    return
  }
  Sentry.captureException(error, { extra: context })
}

// Performance monitoring - simplified without OpenTelemetry
export const startPerformanceTransaction = (name: string) => {
  const startTime = Date.now()
  
  return {
    name,
    startTimestamp: startTime,
    finish: () => {
      const duration = Date.now() - startTime
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        Sentry.captureMessage('Performance Metric', {
          level: 'info',
          extra: {
            name,
            duration,
            timestamp: new Date().toISOString()
          }
        })
      } else {
        console.log(`Transaction ${name} finished in ${duration}ms`)
      }
    }
  }
}

// User feedback
export const captureUserFeedback = (feedback: {
  name: string
  email: string
  comments: string
}) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  Sentry.captureMessage('User Feedback', {
    level: 'info',
    extra: feedback
  })
}

// Breadcrumb logging
export const logBreadcrumb = (message: string, category: string, data?: any) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}

// Set user context
export const setUserContext = (user: { id: string; email: string }) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  Sentry.setUser(user)
}

// Clear user context
export const clearUserContext = () => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  Sentry.setUser(null)
}

export default Sentry 