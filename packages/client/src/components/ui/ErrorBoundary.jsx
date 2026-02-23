import React from 'react';
import { Card, Button } from './';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream paper-texture flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <Card className="border-terracotta-dark">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-4xl font-poster text-vintage-text mb-4">
                  Something Went Wrong
                </h1>
                <p className="text-vintage-text mb-6">
                  An unexpected error occurred. Please refresh the page or contact support if the problem persists.
                </p>
                {this.state.error && (
                  <details className="text-left mb-6 p-4 bg-sand rounded">
                    <summary className="font-ui uppercase text-sm cursor-pointer">
                      Error Details
                    </summary>
                    <pre className="mt-4 text-xs font-mono overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
