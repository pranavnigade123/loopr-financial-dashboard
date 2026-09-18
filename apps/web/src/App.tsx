import { useCallback, useEffect, useState } from 'react';
import type { SessionResponse, SessionUser } from '@loopr/contracts';
import { api, RequestError } from './api';
import { Brand } from './components/Brand';
import { Login } from './features/auth/Login';
import { Workspace } from './features/dashboard/Workspace';

export function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const clearUser = useCallback(() => setUser(null), []);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    api<SessionResponse>('/auth/me', { signal: controller.signal })
      .then((result) => setUser(result.user))
      .catch((cause: unknown) => {
        if (!controller.signal.aborted && !(cause instanceof RequestError && cause.status === 401))
          setError('The server is unavailable. Please try signing in again shortly.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, []);
  if (checking)
    return (
      <main className="boot" role="status">
        <Brand />
        <p>Opening your workspace…</p>
      </main>
    );
  return user ? (
    <Workspace user={user} onLogout={clearUser} />
  ) : (
    <>
      {error && (
        <div className="connection-alert" role="status">
          {error}
        </div>
      )}
      <Login
        onLogin={(value) => {
          setError('');
          setUser(value);
        }}
      />
    </>
  );
}
