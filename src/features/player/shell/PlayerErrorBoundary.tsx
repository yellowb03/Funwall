"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/design-system/Button";

interface Props {
  children: ReactNode;
  onRestart?: () => void;
  onExit?: () => void;
}

interface State {
  error: Error | null;
  diagnosticId: string | null;
}

/**
 * Catches fatal render errors in the player stage.
 * Does not display stack traces or raw payloads.
 */
export class PlayerErrorBoundary extends Component<Props, State> {
  state: State = { error: null, diagnosticId: null };

  static getDerivedStateFromError(error: Error): State {
    const diagnosticId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().slice(0, 8)
        : `err_${Date.now().toString(36)}`;
    return { error, diagnosticId };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Bounded diagnostic only — never log full content or secrets.
    if (process.env.NODE_ENV !== "production") {
      console.error("[PlayerErrorBoundary]", error.message, info.componentStack);
    }
  }

  private handleRestart = () => {
    this.setState({ error: null, diagnosticId: null });
    this.props.onRestart?.();
  };

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <h2 className="text-xl font-bold text-[var(--fw-color-ink)]">
            Something went wrong
          </h2>
          <p className="max-w-md text-sm text-[var(--fw-color-muted-strong)]">
            This activity could not continue. You can restart or leave.
            {this.state.diagnosticId ? (
              <>
                {" "}
                Reference:{" "}
                <code className="rounded bg-[var(--fw-color-surface-sunken)] px-1">
                  {this.state.diagnosticId}
                </code>
              </>
            ) : null}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={this.handleRestart}>
              Restart
            </Button>
            {this.props.onExit ? (
              <Button type="button" variant="secondary" onClick={this.props.onExit}>
                Exit
              </Button>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
