'use client';
import { useState } from 'react';

export default function EventForm({ event }: { event: any | null }) {
  const [form, setForm] = useState({
    id: event?.id || '',
    couple_names: event?.couple_names || '',
    event_date: event?.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
    venue_name: event?.venue_name || '',
    venue_address: event?.venue_address || '',
    reception_at: event?.reception_at || '',
    ceremony_at: event?.ceremony_at || '',
    hero_image_url: event?.hero_image_url || '',
    custom_message_he: event?.custom_message_he || '',
    custom_message_ru: event?.custom_message_ru || '',
    custom_message_en: event?.custom_message_en || '',
    botomati_instance_id: event?.botomati_instance_id || '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm({ ...form, [k]: v });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg('נשמר ✓');
      setTimeout(() => location.reload(), 600);
    } else {
      const body = await res.json().catch(() => ({}));
      setMsg(`שגיאה: ${body.error || res.status}`);
    }
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-4">
      {!event && (
        <div className="bg-gold/5 rounded-2xl p-5 border border-gold/20 text-center mb-2">
          <div className="text-3xl mb-2">💍</div>
          <h2 className="font-serif text-2xl text-gold">בואו ניצור את החתונה שלכם</h2>
          <p className="text-sm text-ink/60 mt-1">מלאו את הפרטים הבסיסיים — אפשר לעדכן אחר כך</p>
        </div>
      )}

      <Section title="פרטי האירוע">
        <Field label="שמות הזוג" value={form.couple_names} onChange={(v) => update('couple_names', v)} placeholder="גילי & דניאל" required />
        <Field label="תאריך ושעת התחלה" type="datetime-local" value={form.event_date} onChange={(v) => update('event_date', v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="שעת קבלת פנים" value={form.reception_at} onChange={(v) => update('reception_at', v)} placeholder="18:30" />
          <Field label="שעת חופה" value={form.ceremony_at} onChange={(v) => update('ceremony_at', v)} placeholder="20:00" />
        </div>
      </Section>

      <Section title="מקום">
        <Field label="שם האולם" value={form.venue_name} onChange={(v) => update('venue_name', v)} />
        <Field label="כתובת" value={form.venue_address} onChange={(v) => update('venue_address', v)} />
      </Section>

      <Section title="עיצוב ההזמנה" collapsible defaultOpen={!!event}>
        <Field label="קישור לתמונת רקע" value={form.hero_image_url} onChange={(v) => update('hero_image_url', v)} placeholder="https://..." />
        <TextArea label="הודעה אישית (עברית)" value={form.custom_message_he} onChange={(v) => update('custom_message_he', v)} placeholder="נשמח לחגוג איתכם..." />
        <TextArea label="הודעה אישית (רוסית)" value={form.custom_message_ru} onChange={(v) => update('custom_message_ru', v)} />
        <TextArea label="הודעה אישית (אנגלית)" value={form.custom_message_en} onChange={(v) => update('custom_message_en', v)} />
      </Section>

      <div className="sticky bottom-20 md:bottom-4 z-10 bg-white/95 backdrop-blur p-3 rounded-2xl shadow-lg border border-gold/15 flex items-center gap-3">
        <button
          disabled={busy || !form.couple_names}
          className="flex-1 bg-gold text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-gold/90 disabled:opacity-40 transition active:scale-[0.98]"
        >
          {busy ? '...' : event ? 'שמירת שינויים' : 'יצירת חתונה'}
        </button>
        {msg && <span className="text-sm text-emerald-700 font-medium">{msg}</span>}
      </div>
    </form>
  );
}

function Section({ title, children, collapsible, defaultOpen = true }: { title: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gold/10 overflow-hidden">
      <button
        type="button"
        onClick={collapsible ? () => setOpen(!open) : undefined}
        className={`w-full px-5 py-3 bg-cream/30 border-b border-gold/10 flex items-center justify-between ${collapsible ? 'cursor-pointer' : ''}`}
      >
        <h3 className="font-serif text-gold">{title}</h3>
        {collapsible && (
          <svg className={`w-5 h-5 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
        )}
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm text-ink/70 mb-1.5">{label}{required && <span className="text-gold ms-1">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-ink/15 px-4 py-3 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm text-ink/70 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full rounded-xl border border-ink/15 px-4 py-3 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition resize-none"
      />
    </div>
  );
}
