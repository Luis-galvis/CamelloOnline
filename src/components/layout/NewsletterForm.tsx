'use client';

import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Honeypot anti-bots
    if (new FormData(e.currentTarget).get('_hp')) { setStatus('ok'); return; }
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setStatus(data.success ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <input type="text" name="_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        required
        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-60"
      >
        {status === 'loading' ? 'Suscribiendo…' : 'Suscribirme'}
      </button>
      {status === 'ok' && <p className="text-emerald-600 text-xs font-semibold">✅ ¡Listo! Te avisaremos cada semana.</p>}
      {status === 'error' && <p className="text-red-500 text-xs font-semibold">Hubo un error, intenta de nuevo.</p>}
    </form>
  );
}
