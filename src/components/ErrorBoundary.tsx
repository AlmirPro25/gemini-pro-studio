import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-bg-secondary rounded-lg p-6 border border-border-color">
            <div className="flex items-center gap-3 mb-4">
              <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
              <h1 className="text-xl font-bold text-text-primary">Algo deu errado</h1>
            </div>
            <p className="text-text-secondary mb-4">
              Ocorreu um erro inesperado na aplicação.
            </p>
            {this.state.error && (
              <pre className="bg-bg-tertiary p-3 rounded text-xs text-text-tertiary overflow-auto mb-4 max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
