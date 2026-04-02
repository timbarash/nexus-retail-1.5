import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * React Error Boundary — catches render errors in child components
 * and shows a fallback UI instead of a white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent-red/12 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-accent-red" />
          </div>
          <h3 className="text-text-primary font-semibold text-lg mb-2">Something went wrong</h3>
          <p className="text-text-secondary text-sm mb-4 max-w-md">
            An error occurred while rendering this view. Try refreshing or clicking a different option.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/85 transition-colors"
          >
            Try Again
          </button>
          {this.state.error && (
            <p className="text-text-muted text-xs mt-3 font-mono max-w-md truncate">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
