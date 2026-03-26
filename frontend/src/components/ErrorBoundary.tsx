import React from 'react';
import type { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] px-4">
          <div className="max-w-md space-y-6 rounded-lg border border-[#FF6B00] bg-[#1a1a2e] p-8 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-[#FF6B00]/20 p-4">
                <svg
                  className="h-8 w-8 text-[#FF6B00]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-xl font-bold text-[#F7F7F7]">Oops! Something went wrong</h2>
              <p className="text-sm text-gray-400">
                {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-[#00FF88] px-4 py-2.5 font-semibold text-[#0B0B0B] transition-all hover:bg-[#00FF88]/90 active:scale-95"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
