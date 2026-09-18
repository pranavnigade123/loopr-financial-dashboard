import { useState, type FormEvent } from 'react';
import { ArrowUpRight, ShieldCheck, Wallet } from 'lucide-react';
import type { SessionResponse, SessionUser } from '@loopr/contracts';
import { api } from '../../api';
import { Brand } from '../../components/Brand';

export function Login({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const result = await api<SessionResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      onLogin(result.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-layout">
      <section className="login-story">
        <Brand />
        <div>
          <p className="eyebrow">YOUR FINANCIAL PICTURE, CLEARER</p>
          <h1>
            Every transaction.
            <br />
            <span>A better perspective.</span>
          </h1>
          <p className="story-copy">
            A focused workspace to explore your finances, follow the numbers, and turn information
            into insight.
          </p>
          <div className="story-graphic" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <p className="story-footer">Financial analytics, thoughtfully organized.</p>
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="login-icon">
            <Wallet size={26} />
          </div>
          <p className="eyebrow">WELCOME TO PENTA</p>
          <h2>Sign in to your workspace</h2>
          <p className="muted">Your financial overview is one step away.</p>
          <form
            onSubmit={(event) => {
              void submit(event);
            }}
          >
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              required
              autoFocus
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              maxLength={256}
            />
            {error && (
              <p className="alert" role="alert">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="login-note">
            <ShieldCheck size={16} /> Secure access to your financial workspace
          </p>
        </div>
      </section>
    </main>
  );
}
