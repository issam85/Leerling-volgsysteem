// src/components/ErrorBoundary.js - React Error Boundary for graceful error handling
import React from 'react';
import { logError, sanitizeError } from '../utils/errorHandling';
import Button from './Button';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorId: Date.now().toString(36) // Simple error ID for tracking
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    logError(error, 'React Error Boundary', {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      errorId: this.state.errorId
    });

    this.setState({
      errorInfo
    });

    // Report to external error tracking service if configured
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const sanitizedMessage = sanitizeError(this.state.error);
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Er is een fout opgetreden
                </h2>
                
                <p className="text-sm text-gray-500 mb-6">
                  {sanitizedMessage || 'Er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen.'}
                </p>

                {isDevelopment && this.state.error && (
                  <details className="text-left mb-6 p-4 bg-gray-100 rounded-lg">
                    <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                      Ontwikkelaarsinformatie (alleen zichtbaar in development)
                    </summary>
                    <div className="text-xs text-gray-600 font-mono">
                      <p className="mb-2"><strong>Error:</strong> {this.state.error.toString()}</p>
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                        </div>
                      )}
                      {this.state.errorId && (
                        <p className="mt-2"><strong>Error ID:</strong> {this.state.errorId}</p>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex flex-col space-y-3">
                  <Button
                    onClick={this.handleRetry}
                    variant="primary"
                    className="flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Opnieuw proberen
                  </Button>
                  
                  <Button
                    onClick={this.handleGoHome}
                    variant="secondary"
                    className="flex items-center justify-center"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Naar dashboard
                  </Button>
                </div>

                {this.state.errorId && (
                  <p className="text-xs text-gray-400 mt-4">
                    Fout-ID: {this.state.errorId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;