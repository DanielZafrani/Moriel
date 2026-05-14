'use client';
import { useState } from 'react';
import { t, type Lang } from '@/lib/i18n';

type Existing = { status: string; party_size: number; dietary: string; message: string } | null;

export default function RsvpForm({
  token, lang, maxGuests, initial,
}: { token: string; lang: Lang; maxGuests: number; initial: Existing }) {
  const T = t[lang];
  const [status, setStatus] = useState<string>(initial?.status || '');
  const [partySize, setPartySize] = useState<number>(initial?.party_size || 1);
  const [dietary, setDietary] = useState<string>(initial?.dietary || '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<boolean>(!!initial);
  const [error, setError] = useState<string>('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!status) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token, status,
          party_size: status === 'attending' ? partySize : 0,
          dietary,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'error');
      }
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-2 animate-fade-in">
        <div className="text-5xl mb-3">✨</div>
        <p className="text-emerald-700 font-serif text-2xl mb-1">{T.thanks}</p>
        <p className="text-ink/70 mb-5 text-sm">
          {status === 'attending' && `${T.attending} · ${partySize}`}
          {status === 'declined' && T.declined}
          {status === 'maybe' && T.maybe}
        </p>
        <button onClick={() => setDone(false)} className="text-gold underline text-sm">
          {T.update}
        </button>
      </div>
    );
  }

  const opts = [
    { v: 'attending', icon: '🥂', label: T.attending },
    { v: 'maybe', icon: '🤔', label: T.maybe },
    { v: 'declined', icon: '💔', label: T.declined },
  ] as const;

  return (
    <form onSubmit={submit} className="space-y-5 text-start">
      <div className="grid grid-cols-1 gap-2">
        {opts.map((s) => (
          <button
            key={s.v}
            type="button"
            onClick={() => setStatus(s.v)}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 transition active:scale-[0.98] ${
              status === s.v
                ? 'border-gold bg-gold/5 text-ink shadow-sm'
                : 'border-ink/10 bg-white hover:border-gold/40 text-ink/80'
            }`}
          >
            <span className="text-xl">{s.icon}</span>
            <span className="flex-1 text-start font-medium">{s.label}</span>
            <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
              status === s.v ? 'border-gold bg-gold' : 'border-ink/20'
            }`}>
              {status === s.v && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
          </button>
        ))}
      </div>

      {status === 'attending' && (
        <div className="bg-cream/40 rounded-xl p-4">
          <label className="block text-sm text-ink/80 mb-2 font-medium">{T.partySize}</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPartySize(Math.max(1, partySize - 1))}
              className="w-10 h-10 rounded-full bg-white border border-ink/15 hover:border-gold flex items-center justify-center text-lg"
              aria-label="-"
            >−</button>
            <input
              type="number"
              min={1}
              max={maxGuests}
              value={partySize}
              onChange={(e) => setPartySize(Math.min(maxGuests, Math.max(1, +e.target.value || 1)))}
              className="flex-1 rounded-xl border border-ink/15 px-3 py-2 text-center text-lg font-serif"
            />
            <button
              type="button"
              onClick={() => setPartySize(Math.min(maxGuests, partySize + 1))}
              className="w-10 h-10 rounded-full bg-white border border-ink/15 hover:border-gold flex items-center justify-center text-lg"
              aria-label="+"
            >+</button>
          </div>
          <p className="text-xs text-ink/50 mt-2 text-center">עד {maxGuests}</p>
        </div>
      )}

      {status && status !== 'declined' && (
        <div>
          <label className="block text-sm text-ink/70 mb-1.5">{T.dietary}</label>
          <textarea
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-ink/15 px-4 py-3 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition resize-none"
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={!status || submitting}
        className="w-full bg-gold text-white py-4 rounded-xl font-medium shadow-md hover:bg-gold/90 disabled:opacity-40 transition active:scale-[0.98] text-base"
      >
        {submitting ? '...' : T.submit}
      </button>
    </form>
  );
}
