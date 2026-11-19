"use client";

import { Component } from "react";
import * as Sentry from "@sentry/nextjs";

const MAX_RETRIES = 2;

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retries: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info?.componentStack);
    try {
      Sentry.captureException(error, { extra: { componentStack: info?.componentStack } });
    } catch {}
  }

  handleRetry = () => {
    this.setState(s => ({ hasError: false, error: null, retries: s.retries + 1 }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const exhausted = this.state.retries >= MAX_RETRIES;
      return (
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 24,
          background: "var(--bg)", color: "var(--t1)", textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--ib6)", display: "grid", placeItems: "center",
            marginBottom: 20,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, letterSpacing: "-.2px" }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 14, color: "var(--t3)", lineHeight: 1.5, maxWidth: 280, marginBottom: 24 }}>
            {exhausted
              ? "The app keeps crashing. Please restart it and report the issue if it persists."
              : "The app encountered an unexpected error. You can try again or restart the app."}
          </div>
          {exhausted ? (
            <button
              onClick={() => { try { window.location.reload(); } catch {} }}
              style={{
                padding: "14px 28px", borderRadius: "var(--ios-radii)", border: "none",
                background: "var(--teal)", color: "white", fontSize: 16, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Restart app
            </button>
          ) : (
            <button
              onClick={this.handleRetry}
              style={{
                padding: "14px 28px", borderRadius: "var(--ios-radii)", border: "none",
                background: "var(--teal)", color: "white", fontSize: 16, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Try again
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
