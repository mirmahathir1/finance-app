'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorState } from './ErrorState'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  resetKeys?: unknown[]
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

function arraysAreEqual(a: unknown[] = [], b: unknown[] = []) {
  if (a.length !== b.length) return false
  return a.every((value, index) => Object.is(value, b[index]))
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: undefined,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (!this.state.hasError) {
      return
    }

    if (!arraysAreEqual(prevProps.resetKeys, this.props.resetKeys)) {
      this.resetErrorBoundary()
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorState
          title="Unexpected error"
          message="We ran into an unexpected issue. Please try again."
          onRetry={this.resetErrorBoundary}
        />
      )
    }

    return this.props.children
  }
}

