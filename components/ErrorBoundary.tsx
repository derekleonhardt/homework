'use client'

import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log error to console in development
    console.error('Error Boundary caught an error:', error, errorInfo)

    // TODO: Send to error tracking service (e.g., Sentry)
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-[var(--color-warm-50)] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[var(--color-warm-50)] rounded-lg border border-[var(--color-warm-300)] p-8 text-center">
            <div className="mb-4">
              <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="size-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Error icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[var(--color-warm-900)] mb-2 text-balance">
                Something went wrong
              </h2>
              <p className="text-[var(--color-warm-600)] mb-1 text-pretty">
                An unexpected error occurred while rendering this page.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-[var(--color-warm-500)] hover:text-[var(--color-warm-700)]">
                    Error details
                  </summary>
                  <pre className="mt-2 p-3 bg-[var(--color-warm-100)] rounded text-xs text-[var(--color-warm-700)] overflow-auto max-h-40">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white rounded-lg transition-colors"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/'
                }}
                className="px-4 py-2 bg-[var(--color-warm-200)] hover:bg-[var(--color-warm-300)] text-[var(--color-warm-700)] rounded-lg transition-colors"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
