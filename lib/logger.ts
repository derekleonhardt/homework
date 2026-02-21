type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

// Simple structured logger - can be swapped for Pino/Winston later
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, context))
    }
  },

  info(message: string, context?: LogContext): void {
    console.info(formatMessage('info', message, context))
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context))
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    }
    console.error(formatMessage('error', message, errorContext))
  },
}
