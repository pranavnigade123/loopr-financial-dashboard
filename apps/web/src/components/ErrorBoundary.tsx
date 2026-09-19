import { Component, type ReactNode } from 'react';
import { ui } from './ui';

export class ErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <section role="alert" className="m-4 rounded-2xl border border-rose-300/20 bg-panel p-6">
          <h2 className="text-lg font-semibold">
            {this.props.label ?? 'This view'} could not be displayed
          </h2>
          <p className="my-3 text-sm text-muted">Try again. If this continues, reload the page.</p>
          <div className="flex gap-3">
            <button className={ui.secondary} onClick={() => this.setState({ failed: false })}>
              Try again
            </button>
            <button className={ui.secondary} onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </section>
      );
    return this.props.children;
  }
}
