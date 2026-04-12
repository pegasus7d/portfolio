"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class GraphErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] py-16 px-6 text-center">
          <div>
            <p className="text-sm text-[var(--text-muted)]">
              Graph could not load.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 text-xs text-[var(--accent)] hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
