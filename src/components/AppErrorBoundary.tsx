import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AppErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-4xl">⚠️</div>
          <p className="text-lg font-medium">Произошла непредвиденная ошибка</p>
          <p className="text-sm text-gray-500">{this.state.error?.message}</p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            onClick={() => window.location.reload()}
          >
            Перезапустить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
