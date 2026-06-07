'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';

export default function AuthCallbackClient({ token }) {
  const [message, setMessage] = useState('Completing sign in...');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No authentication token was returned by the backend.');
      setMessage('Redirecting back to the app.');
      window.setTimeout(() => {
        window.location.replace('/');
      }, 1600);
      return;
    }

    const target = `/?token=${encodeURIComponent(token)}`;

    setMessage('Authentication token received. Redirecting to the app...');
    window.setTimeout(() => {
      window.location.replace(target);
    }, 300);
  }, [token]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/70 bg-white/85 p-8 text-center shadow-[0_40px_120px_-48px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-[0_24px_48px_-28px_rgba(37,99,235,0.5)]">
            {error ? <TriangleAlert className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-gray-900">
            {error ? 'Authentication callback' : 'Signing you in'}
          </h1>

          <p className="mt-3 text-sm leading-7 text-gray-600">{message}</p>

          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Please keep this tab open
          </div>
        </section>
      </div>
    </main>
  );
}
