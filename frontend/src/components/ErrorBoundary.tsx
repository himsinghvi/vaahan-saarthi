import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Vaahan Saarthi render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container py-5" style={{ maxWidth: 640 }}>
          <div className="card-surface p-4">
            <h4 style={{ fontWeight: 800 }}>Something went wrong loading Vaahan Saarthi</h4>
            <p className="text-muted-2 mt-2">{this.state.error.message}</p>
            <button type="button" className="btn-grad mt-3" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
