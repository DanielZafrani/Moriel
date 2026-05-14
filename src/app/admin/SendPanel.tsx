'use client';
import { useState } from 'react';

export default function SendPanel({ event, guests, responses }: { event: any; guests: any[]; responses: any[] }) {
  const [kind, setKind] = useState<'invitation' | 'reminder'>('invitation');
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const respondedSet = new Set(responses.map((r) => r.guest_id));
  const targets = onlyMissing ? guests.filter((g) => !respondedSet.has(g.id)) : guests;

  async function send() {
    if (!targets.length) return;
    if (!confirm(`לשלוח ${kind === 'invitation' ? 'הזמנה' : 'תזכורת'} ל-${targets.length} מוזמנים בוואטסאפ?`)) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, kind, only_missing: onlyMissing }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'send failed');
      setResult({ sent: body.sent, failed: body.failed, total: body.total });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold/10">
        <h2 className="font-serif text-xl text-gold mb-1">שליחת הודעות וואטסאפ</h2>
        <p className="text-sm text-ink/60 mb-6">ההודעה תשלח בשפה של כל מוזמן עם הלינק האישי שלו</p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">סוג הודעה</label>
            <div className="grid grid-cols-2 gap-2">
              {(['invitation', 'reminder'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`py-3 rounded-xl border-2 transition text-sm font-medium ${
                    kind === k ? 'border-gold bg-gold/5 text-gold' : 'border-ink/15 text-ink/60 hover:border-gold/40'
                  }`}
                >
                  {k === 'invitation' ? '🎉 הזמנה ראשונית' : '🔔 תזכורת'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-cream/40 cursor-pointer">
            <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="w-5 h-5 accent-gold" />
            <div className="flex-1">
              <div className="font-medium text-ink">רק למי שלא הגיב</div>
              <div className="text-xs text-ink/60">תשלח ל-{targets.length} מוזמנים</div>
            </div>
          </label>

          <button
            onClick={send}
            disabled={busy || !targets.length}
            className="w-full bg-gold text-white py-4 rounded-xl font-medium shadow-md hover:bg-gold/90 disabled:opacity-40 transition active:scale-[0.98]"
          >
            {busy ? 'שולח...' : `📤 שלח ל-${targets.length} מוזמנים`}
          </button>

          {result && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
              <div className="font-medium">השליחה הסתיימה</div>
              <div className="text-sm mt-1">
                ✅ נשלחו: {result.sent} · ❌ נכשלו: {result.failed} · סה״כ: {result.total}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="bg-cream/40 rounded-2xl p-4 text-xs text-ink/60 border border-ink/5">
        💡 וודאו שה-instance של בוטומטי מחובר ושב-<code>.env.local</code> הוגדרו <code>BOTOMATI_BASE_URL</code> ו-<code>BOTOMATI_INSTANCE_ID</code>.
      </div>
    </div>
  );
}
