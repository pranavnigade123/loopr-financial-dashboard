import { useState, type FormEvent } from 'react';
import { ArrowUpRight, ShieldCheck, Wallet } from 'lucide-react';
import type { SessionResponse, SessionUser } from '@loopr/contracts';
import { registerSchema } from '@loopr/contracts';
import { api, errorMessage, RequestError } from '../../api';
import { Brand } from '../../components/Brand';
import { ui } from '../../components/ui';

export function Login({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const credentials = {
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    };
    setFields({});
    setSuccess('');
    setError('');
    const input = { ...credentials, name: String(form.get('name') ?? '') };
    if (registering) {
      const result = registerSchema.safeParse(input);
      const issues: Record<string, string> = {};
      if (!result.success)
        for (const issue of result.error.issues) issues[String(issue.path[0])] = issue.message;
      if (credentials.password !== form.get('confirmPassword'))
        issues.confirmPassword = 'Passwords do not match.';
      if (Object.keys(issues).length) {
        setFields(issues);
        return;
      }
    }
    setBusy(true);
    try {
      if (registering) {
        await api<SessionResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        element.reset();
        setRegistering(false);
        setSuccess('Account created. Sign in with your new email and password.');
        return;
      }
      const result = await api<SessionResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      onLogin(result.user);
    } catch (cause) {
      if (cause instanceof RequestError && cause.fields) setFields(cause.fields);
      setError(
        cause instanceof RequestError && cause.status === 401
          ? 'Email or password is incorrect.'
          : errorMessage(cause),
      );
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
            {registering ? 'Create your account' : 'Sign in to your workspace'}
          </h2>
          <p className={ui.muted}>
            {registering
              ? 'Join the demo workspace to explore the shared sample transactions.'
              : 'Your financial overview is one step away.'}
          </p>
          {success && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-green-200"
            >
              {success}
            </p>
          )}
          <form
            className="mt-9 flex flex-col"
            onSubmit={(event) => {
              void submit(event);
            }}
          >
            {registering && (
              <>
                <label className="mb-2 text-[13px] font-medium" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  aria-invalid={!!fields.name}
                  aria-describedby={fields.name ? 'name-error' : undefined}
                  className={`${ui.input} mb-2`}
                />
                {fields.name && (
                  <p id="name-error" className="mb-3 text-xs text-rose-300">
                    {fields.name}
                  </p>
                )}
              </>
            )}
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
              aria-invalid={!!fields.email}
              aria-describedby={fields.email ? 'email-error' : undefined}
              className="mb-6 w-full rounded-lg border border-[#393d47] bg-[#191c22] px-4 py-3.5 text-white placeholder:text-[#878d99]"
            />
            {fields.email && (
              <p id="email-error" className="mb-3 text-xs text-rose-300">
                {fields.email}
              </p>
            )}
            <label className="mb-2 text-[13px] font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={registering ? 'new-password' : 'current-password'}
              placeholder="Enter your password"
              required
              maxLength={256}
              minLength={registering ? 12 : 1}
              aria-invalid={!!fields.password}
              aria-describedby={registering ? 'password-help' : undefined}
              className="mb-6 w-full rounded-lg border border-[#393d47] bg-[#191c22] px-4 py-3.5 text-white placeholder:text-[#878d99]"
            />
            {registering && (
              <>
                <p id="password-help" className="mb-4 text-xs text-muted">
                  {fields.password ?? 'Use 12–256 characters. A memorable passphrase works well.'}
                </p>
                <label className="mb-2 text-[13px] font-medium" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={256}
                  aria-invalid={!!fields.confirmPassword}
                  aria-describedby={fields.confirmPassword ? 'confirmation-error' : undefined}
                  className={`${ui.input} mb-4`}
                />
                {fields.confirmPassword && (
                  <p role="alert" id="confirmation-error" className="mb-3 text-xs text-rose-300">
                    {fields.confirmPassword}
                  </p>
                )}
              </>
            )}
            {error && (
              <p
                className="mb-5 rounded-lg border border-[#79414c] bg-[#42292e] px-4 py-3 text-[13px] text-[#ffccd3]"
                role="alert"
              >
                {error}
              </p>
            )}
            <button className={`${ui.primary} justify-between`} disabled={busy}>
              {busy
                ? registering
                  ? 'Creating account…'
                  : 'Signing in…'
                : registering
                  ? 'Create account'
                  : 'Sign in'}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            {registering ? 'Already have an account?' : 'New to Penta?'}{' '}
            <button
              type="button"
              disabled={busy}
              className="font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent"
              onClick={() => {
                setRegistering(!registering);
                setError('');
                setFields({});
                setSuccess('');
              }}
            >
              {registering ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="mt-7 flex items-center justify-center gap-2 text-[11px] text-muted">
            <ShieldCheck size={16} /> Secure access to your financial workspace
          </p>
        </div>
      </section>
    </main>
  );
}
