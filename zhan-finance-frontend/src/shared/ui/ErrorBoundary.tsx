import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Translation } from 'react-i18next';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Translation ns="common">
          {(t) => (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl shadow-sm border border-red-100 max-w-lg w-full">
                <h2 className="text-xl font-semibold mb-2">{t('ui.errorBoundary.title', { defaultValue: 'Что-то пошло не так' })}</h2>
                <p className="text-sm opacity-80 mb-6 font-mono text-left bg-white p-3 rounded-lg overflow-auto">
                  {this.state.error?.message || t('ui.errorBoundary.unknown', { defaultValue: 'Неизвестная ошибка' })}
                </p>
                <button
                  onClick={this.handleReset}
                  className="px-6 py-2.5 bg-brand-green text-white rounded-xl hover:bg-brand-accent transition-colors w-full font-medium"
                >
                  {t('ui.errorBoundary.reload', { defaultValue: 'Перезагрузить страницу' })}
                </button>
              </div>
            </div>
          )}
        </Translation>
      );
    }

    return this.props.children;
  }
}
