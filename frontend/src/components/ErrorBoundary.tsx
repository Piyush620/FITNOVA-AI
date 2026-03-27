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
        <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#070710_0%,#0b0d17_100%)] px-4">
          <div className="max-w-md space-y-6 rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,181,211,0.12),transparent_34%),linear-gradient(180deg,#1f1f34_0%,#151726_100%)] p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="flex justify-center">
              <div className="rounded-full border border-[#ffb5d3]/30 bg-[#ffb5d3]/10 p-4">
                <svg
                  className="h-8 w-8 text-[#ffb5d3]"
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
              className="w-full rounded-[1rem] border border-white/20 bg-[linear-gradient(135deg,#fff5fb_0%,#ffe2ef_40%,#d4c9ff_100%)] px-4 py-3 font-semibold text-[#151628] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(255,181,211,0.24)] active:scale-[0.98]"
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
