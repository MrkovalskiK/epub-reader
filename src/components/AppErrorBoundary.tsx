import React from 'react';
import './AppErrorBoundary.css';

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
        <div className="aeb-root">
          <div className="aeb-icon">⚠️</div>
          <p className="aeb-title">Произошла непредвиденная ошибка</p>
          <p className="aeb-desc">{this.state.error?.message}</p>
          <button type="button" className="aeb-btn" onClick={() => window.location.reload()}>Перезапустить</button>
        </div>
      );
    }
    return this.props.children;
  }
}
