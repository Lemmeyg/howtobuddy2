import * as Sentry from '@sentry/nextjs'

// Only use Sentry in production with a valid DSN
const shouldInitializeSentry = process.env.NODE_ENV === 'production' && 
  process.env.NEXT_PUBLIC_SENTRY_DSN && 
  process.env.NEXT_PUBLIC_SENTRY_DSN !== 'your_sentry_dsn_here'

if (shouldInitializeSentry) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    // Disable features that cause build issues
    autoSessionTracking: false,
    integrations: [],
    // Disable performance monitoring features
    enableTracing: false,
    tracesSampleRate: 0,
  })
}

// Error logging utility
export const logError = (error: Error, context?: Record<string, any>) => {
  if (!shouldInitializeSentry) {
    console.error(error, context)
    return
  }
  Sentry.captureException(error, { extra: context })
}

// Performance monitoring - simplified
export const startPerformanceTransaction = (name: string) => {
  const startTime = Date.now()
  
  return {
    name,
    startTimestamp: startTime,
    finish: () => {
      const duration = Date.now() - startTime
      if (shouldInitializeSentry) {
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
  if (!shouldInitializeSentry) return
  Sentry.captureMessage('User Feedback', {
    level: 'info',
    extra: feedback
  })
}

// Breadcrumb logging
export const logBreadcrumb = (message: string, category: string, data?: any) => {
  if (!shouldInitializeSentry) return
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}

// Set user context
export const setUserContext = (user: { id: string; email: string }) => {
  if (!shouldInitializeSentry) return
  Sentry.setUser(user)
}

// Clear user context
export const clearUserContext = () => {
  if (!shouldInitializeSentry) return
  Sentry.setUser(null)
}

export default Sentry 