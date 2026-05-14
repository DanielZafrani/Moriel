'use client';
import { useState } from 'react';

export default function LoginForm() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (res.ok) location.reload();
    else setErr('סיסמה שגויה');
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-br from-cream via-cream/50 to-white flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gold/20">
        <div className="text-center mb-7">
          <div className="text-5xl mb-2">💍</div>
          <h1 className="font-serif text-3xl text-gold">ניהול חתונה</h1>
          <p className="text-sm text-ink/60 mt-1">היכנס כדי לנהל את האירוע</p>
        </div>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="סיסמה"
          autoFocus
          className="w-full rounded-xl border border-ink/15 px-4 py-3 mb-3 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
        />
        {err && <p className="text-red-600 text-sm mb-3 text-center">{err}</p>}
        <button
          disabled={busy}
          className="w-full bg-gold text-white py-3 rounded-xl font-medium shadow-sm hover:bg-gold/90 disabled:opacity-50 transition active:scale-[0.98]"
        >
          {busy ? '...' : 'כניסה'}
        </button>
      </form>
    </main>
  );
}
