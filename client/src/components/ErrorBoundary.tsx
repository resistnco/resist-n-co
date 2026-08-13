import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Error Boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: "2rem", fontFamily: "monospace", color: "#ff6b6b", background: "#1a1a1a", minHeight: "100vh" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Erreur de rendu</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#ff6b6b", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
