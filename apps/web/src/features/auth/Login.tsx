import { useState, type FormEvent } from 'react';
import { ArrowUpRight, ShieldCheck, Wallet } from 'lucide-react';
import type { SessionResponse, SessionUser } from '@loopr/contracts';
import { api } from '../../api';
import { Brand } from '../../components/Brand';
import { ui } from '../../components/ui';

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
    <main className="grid min-h-dvh md:grid-cols-2">
      <section className="flex min-h-[88px] flex-col justify-between gap-16 border-r border-white/10 bg-[radial-gradient(ellipse_at_20%_65%,#20382b_0%,transparent_55%)] bg-panel p-6 md:p-12 md:px-[14%]">
        <Brand />
        <div className="hidden md:block">
          <p className={ui.eyebrow}>YOUR FINANCIAL PICTURE, CLEARER</p>
          <h1 className="mt-6 text-[clamp(38px,5vw,60px)] leading-[1.08] tracking-[-2px]">
            Every transaction.
            <br />
            <span className="text-[#a7b3aa]">A better perspective.</span>
          </h1>
          <p className="max-w-[390px] text-[15px] leading-[1.9] text-[#a4aea7]">
            A focused workspace to explore your finances, follow the numbers, and turn information
            into insight.
          </p>
          <div className="mt-11 flex h-36 max-w-[390px] items-end gap-3.5 border-b border-[#3a5141] [&>span]:flex-1 [&>span]:rounded-t-lg [&>span]:bg-linear-to-t [&>span]:from-accent/20 [&>span]:to-accent">
            <span className="h-[35%]" />
            <span className="h-[52%]" />
            <span className="h-[42%]" />
            <span className="h-[70%]" />
            <span className="h-[60%]" />
            <span className="h-[82%]" />
            <span className="h-[74%]" />
            <span className="h-full from-expense/20 to-expense" />
          </div>
        </div>
        <p className="hidden text-xs text-[#858d89] md:block">
          Financial analytics, thoughtfully organized.
        </p>
      </section>
      <section className="grid min-h-[calc(100dvh-88px)] place-items-center bg-[#22252c] px-6 py-12 md:min-h-dvh md:px-8">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Wallet size={26} />
          </div>
          <p className={ui.eyebrow}>WELCOME TO PENTA</p>
          <h2 className="my-3 text-[28px] font-semibold tracking-tight">
            Sign in to your workspace
          </h2>
          <p className={ui.muted}>Your financial overview is one step away.</p>
          <form
            className="mt-9 flex flex-col"
            onSubmit={(event) => {
              void submit(event);
            }}
          >
            <label className="mb-2 text-[13px] font-medium" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              required
              autoFocus
              className="mb-6 w-full rounded-lg border border-[#393d47] bg-[#191c22] px-4 py-3.5 text-white placeholder:text-[#878d99]"
            />
            <label className="mb-2 text-[13px] font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              maxLength={256}
              className="mb-6 w-full rounded-lg border border-[#393d47] bg-[#191c22] px-4 py-3.5 text-white placeholder:text-[#878d99]"
            />
            {error && (
              <p
                className="mb-5 rounded-lg border border-[#79414c] bg-[#42292e] px-4 py-3 text-[13px] text-[#ffccd3]"
                role="alert"
              >
                {error}
              </p>
            )}
            <button className={`${ui.primary} justify-between`} disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="mt-7 flex items-center justify-center gap-2 text-[11px] text-muted">
            <ShieldCheck size={16} /> Secure access to your financial workspace
          </p>
        </div>
      </section>
    </main>
  );
}
