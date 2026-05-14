'use client';
import { useState, useMemo } from 'react';

const BASE = typeof window !== 'undefined' ? window.location.origin : '';

export default function GuestsPanel({
  event, guests, responses,
}: { event: any; guests: any[]; responses: any[] }) {
  const respMap = useMemo(() => new Map(responses.map((r) => [r.guest_id, r])), [responses]);
  const [filter, setFilter] = useState<'all' | 'attending' | 'declined' | 'maybe' | 'none'>('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const r = respMap.get(g.id);
      const status = r?.status || 'none';
      if (filter !== 'all' && filter !== status) return false;
      if (search && !g.full_name.includes(search) && !g.phone.includes(search)) return false;
      return true;
    });
  }, [guests, respMap, filter, search]);

  async function addGuest(form: any) {
    const res = await fetch('/api/admin/guests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'add', event_id: event.id, ...form }),
    });
    if (res.ok) location.reload();
    else alert('שגיאה');
  }

  async function delGuest(id: string) {
    if (!confirm('למחוק את המוזמן?')) return;
    const res = await fetch('/api/admin/guests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    if (res.ok) location.reload();
  }

  async function bulkAdd(text: string) {
    const rows = text.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
      const [full_name, phone, language, max_guests] = line.split(',').map((s) => s.trim());
      return { full_name, phone, language, max_guests };
    });
    if (!rows.length) return;
    const res = await fetch('/api/admin/guests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'bulk', event_id: event.id, rows }),
    });
    const body = await res.json();
    if (res.ok) {
      alert(`נוספו ${body.count} מוזמנים`);
      location.reload();
    } else alert(`שגיאה: ${body.error}`);
  }

  const counts = useMemo(() => ({
    all: guests.length,
    attending: guests.filter((g) => respMap.get(g.id)?.status === 'attending').length,
    declined: guests.filter((g) => respMap.get(g.id)?.status === 'declined').length,
    maybe: guests.filter((g) => respMap.get(g.id)?.status === 'maybe').length,
    none: guests.filter((g) => !respMap.get(g.id)).length,
  }), [guests, respMap]);

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setAdding(true)}
          className="flex-1 md:flex-initial bg-gold text-white px-5 py-3 rounded-xl font-medium shadow-sm hover:bg-gold/90 active:scale-[0.98] transition"
        >
          + הוסף מוזמן
        </button>
        <button
          onClick={() => setBulkOpen(true)}
          className="px-4 py-3 rounded-xl bg-white border border-ink/15 hover:border-gold/40 text-sm"
        >
          הדבקה מרובה
        </button>
        <a
          href={`/api/admin/export?event_id=${event.id}`}
          className="px-4 py-3 rounded-xl bg-white border border-ink/15 hover:border-gold/40 text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Excel
        </a>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          placeholder="🔍 חיפוש שם או טלפון..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-ink/15 px-4 py-3 bg-white"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {([
          ['all', 'הכל', counts.all, ''],
          ['attending', 'אישרו', counts.attending, 'text-emerald-700'],
          ['none', 'לא הגיבו', counts.none, 'text-ink/60'],
          ['maybe', 'אולי', counts.maybe, 'text-amber-700'],
          ['declined', 'לא מגיעים', counts.declined, 'text-red-700'],
        ] as const).map(([k, label, n, color]) => (
          <button
            key={k}
            onClick={() => setFilter(k as any)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
              filter === k ? 'bg-ink text-white' : `bg-white border border-ink/15 ${color}`
            }`}
          >
            {label} <span className="opacity-60">{n}</span>
          </button>
        ))}
      </div>

      {/* Guest cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-ink/50">
          <div className="text-5xl mb-3">🔍</div>
          <p>לא נמצאו מוזמנים</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((g) => {
            const r = respMap.get(g.id);
            return (
              <GuestCard
                key={g.id}
                guest={g}
                response={r}
                onDelete={() => delGuest(g.id)}
                rsvpUrl={`${BASE}/r/${g.token}`}
              />
            );
          })}
        </ul>
      )}

      {adding && <AddGuestModal onAdd={addGuest} onClose={() => setAdding(false)} />}
      {bulkOpen && <BulkAddModal onAdd={bulkAdd} onClose={() => setBulkOpen(false)} />}
    </div>
  );
}

function GuestCard({ guest, response, onDelete, rsvpUrl }: { guest: any; response: any; onDelete: () => void; rsvpUrl: string }) {
  const [open, setOpen] = useState(false);
  const status = response?.status;

  return (
    <li className="bg-white rounded-2xl shadow-sm border border-gold/10 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <StatusDot status={status} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-ink truncate">{guest.full_name}</div>
          <div className="text-xs text-ink/50 mt-0.5" dir="ltr">{guest.phone} · {guest.language} · max {guest.max_guests}</div>
        </div>
        {response && (
          <div className="text-end">
            <StatusBadge status={response.status} />
            {response.party_size > 0 && (
              <div className="text-xs text-ink/50 mt-0.5">{response.party_size} אורחים</div>
            )}
          </div>
        )}
        <button onClick={() => setOpen(!open)} aria-label="פעולות" className="text-ink/40 hover:text-ink p-1">
          <svg className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-ink/5 px-4 py-3 bg-cream/20 flex flex-wrap gap-2 text-sm">
          <a href={rsvpUrl} target="_blank" className="text-gold underline">פתח דף RSVP</a>
          <span className="text-ink/30">·</span>
          <button onClick={() => { navigator.clipboard.writeText(rsvpUrl); }} className="text-gold underline">העתק קישור</button>
          <span className="text-ink/30">·</span>
          <a href={`https://wa.me/${guest.phone}`} target="_blank" className="text-gold underline">פתח בוואטסאפ</a>
          {response?.dietary && (
            <div className="basis-full text-xs text-ink/60 pt-2">📝 {response.dietary}</div>
          )}
          <button onClick={onDelete} className="ms-auto text-red-600 underline text-xs">מחק</button>
        </div>
      )}
    </li>
  );
}

function StatusDot({ status }: { status?: string }) {
  const color =
    status === 'attending' ? 'bg-emerald-500' :
    status === 'declined' ? 'bg-red-400' :
    status === 'maybe' ? 'bg-amber-400' :
    'bg-ink/15';
  return <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${color}`} />;
}

function StatusBadge({ status }: { status?: string }) {
  const map: any = {
    attending: ['bg-emerald-100 text-emerald-800', 'אישר'],
    declined: ['bg-red-100 text-red-800', 'לא מגיע'],
    maybe: ['bg-amber-100 text-amber-800', 'אולי'],
  };
  if (!status) return null;
  const [cls, label] = map[status] || ['', status];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
}

function AddGuestModal({ onAdd, onClose }: { onAdd: (f: any) => void; onClose: () => void }) {
  const [f, setF] = useState({ full_name: '', phone: '', language: 'he', max_guests: 2 });
  return (
    <Modal onClose={onClose} title="הוספת מוזמן">
      <input
        placeholder="שם מלא"
        value={f.full_name}
        onChange={(e) => setF({ ...f, full_name: e.target.value })}
        autoFocus
        className="w-full rounded-lg border border-ink/15 px-4 py-3"
      />
      <input
        placeholder="טלפון (05X-XXXXXXX)"
        type="tel"
        value={f.phone}
        onChange={(e) => setF({ ...f, phone: e.target.value })}
        className="w-full rounded-lg border border-ink/15 px-4 py-3"
        dir="ltr"
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          value={f.language}
          onChange={(e) => setF({ ...f, language: e.target.value })}
          className="rounded-lg border border-ink/15 px-4 py-3"
        >
          <option value="he">עברית</option>
          <option value="ru">רוסית</option>
          <option value="en">אנגלית</option>
        </select>
        <div>
          <label className="block text-xs text-ink/60 mb-1">מקס׳ אורחים</label>
          <input
            type="number"
            min={1}
            value={f.max_guests}
            onChange={(e) => setF({ ...f, max_guests: +e.target.value || 1 })}
            className="w-full rounded-lg border border-ink/15 px-4 py-2"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-ink/15 hover:bg-cream">ביטול</button>
        <button
          onClick={() => { if (f.full_name && f.phone) onAdd(f); }}
          disabled={!f.full_name || !f.phone}
          className="flex-1 py-3 rounded-lg bg-gold text-white disabled:opacity-40 hover:bg-gold/90"
        >
          הוספה
        </button>
      </div>
    </Modal>
  );
}

function BulkAddModal({ onAdd, onClose }: { onAdd: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  return (
    <Modal onClose={onClose} title="הוספה מרובה">
      <p className="text-sm text-ink/60">פורמט (שורה אחת לכל מוזמן):</p>
      <pre className="text-xs bg-cream/50 p-2 rounded text-ink/70" dir="ltr">שם, טלפון, שפה(he/ru/en), מקס׳-אורחים</pre>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="יוסי כהן, 0501234567, he, 4&#10;Ivan Ivanov, 0521111111, ru, 2"
        rows={8}
        className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-mono"
        dir="ltr"
      />
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-ink/15 hover:bg-cream">ביטול</button>
        <button
          onClick={() => onAdd(text)}
          disabled={!text.trim()}
          className="flex-1 py-3 rounded-lg bg-gold text-white disabled:opacity-40 hover:bg-gold/90"
        >
          הוספה
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-gold">{title}</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
