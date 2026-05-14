'use client';
import { useState, useMemo } from 'react';
import EventForm from './EventForm';
import GuestsPanel from './GuestsPanel';
import TasksPanel from './TasksPanel';
import SendPanel from './SendPanel';

type Tab = 'overview' | 'event' | 'guests' | 'tasks' | 'send';

export default function Dashboard({
  event, guests, responses, tasks,
}: { event: any | null; guests: any[]; responses: any[]; tasks: any[] }) {
  const [tab, setTab] = useState<Tab>(event ? 'overview' : 'event');

  const stats = useMemo(() => {
    const byStatus = { attending: 0, declined: 0, maybe: 0, none: 0 };
    let totalAttending = 0;
    const respMap = new Map(responses.map((r) => [r.guest_id, r]));
    for (const g of guests) {
      const r = respMap.get(g.id);
      if (!r) byStatus.none++;
      else {
        (byStatus as any)[r.status]++;
        if (r.status === 'attending') totalAttending += r.party_size || 0;
      }
    }
    const taskTotal = tasks.length;
    const taskDone = tasks.filter((t) => t.status === 'done').length;
    return { ...byStatus, totalAttending, totalGuests: guests.length, taskTotal, taskDone };
  }, [guests, responses, tasks]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    location.reload();
  }

  const daysLeft = useMemo(() => {
    if (!event?.event_date) return null;
    const diff = new Date(event.event_date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [event?.event_date]);

  return (
    <div dir="rtl" className="min-h-screen bg-cream/30 pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gold/15">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl md:text-2xl text-gold leading-tight">
              {event?.couple_names || 'ניהול חתונה'}
            </h1>
            {daysLeft !== null && (
              <p className="text-xs text-ink/60 mt-0.5">
                {daysLeft === 0 ? 'היום!' : `עוד ${daysLeft} ימים`}
              </p>
            )}
          </div>
          <button onClick={logout} aria-label="יציאה" className="text-ink/40 hover:text-ink p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </header>

      {/* Desktop tabs */}
      {event && (
        <div className="max-w-5xl mx-auto px-6 hidden md:block">
          <nav className="flex gap-1 border-b border-gold/10 mt-4">
            {[
              ['overview', 'סקירה'],
              ['guests', `מוזמנים (${stats.totalGuests})`],
              ['tasks', `משימות (${stats.taskDone}/${stats.taskTotal})`],
              ['send', 'שליחה'],
              ['event', 'פרטי החתונה'],
            ].map(([k, label]) => (
              <button
                key={k as string}
                onClick={() => setTab(k as Tab)}
                className={`px-4 py-2 -mb-px border-b-2 transition ${
                  tab === k ? 'border-gold text-gold' : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {!event && tab === 'event' && <EventForm event={null} />}
        {event && tab === 'overview' && <Overview event={event} stats={stats} setTab={setTab} />}
        {event && tab === 'event' && <EventForm event={event} />}
        {event && tab === 'guests' && <GuestsPanel event={event} guests={guests} responses={responses} />}
        {event && tab === 'tasks' && <TasksPanel event={event} initialTasks={tasks} />}
        {event && tab === 'send' && <SendPanel event={event} guests={guests} responses={responses} />}
      </main>

      {/* Bottom nav (mobile) + side nav (desktop, top after header) */}
      {event && <BottomNav tab={tab} setTab={setTab} stats={stats} />}
    </div>
  );
}

function Overview({ event, stats, setTab }: { event: any; stats: any; setTab: (t: Tab) => void }) {
  const dateLabel = event.event_date
    ? new Date(event.event_date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const taskPct = stats.taskTotal ? Math.round((stats.taskDone / stats.taskTotal) * 100) : 0;
  const responseRate = stats.totalGuests
    ? Math.round(((stats.totalGuests - stats.none) / stats.totalGuests) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="bg-gradient-to-br from-white to-cream/50 rounded-2xl p-6 md:p-8 shadow-sm border border-gold/15 text-center">
        <div className="text-gold text-3xl mb-2">♥</div>
        <h2 className="font-serif text-3xl md:text-4xl text-ink mb-2">{event.couple_names}</h2>
        <p className="text-ink/70">{dateLabel}</p>
        {event.venue_name && <p className="text-sm text-ink/50 mt-1">{event.venue_name}</p>}
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="👥" label="מוזמנים" value={stats.totalGuests} sub={`${stats.attending} אישרו`} onClick={() => setTab('guests')} />
        <StatCard icon="🍷" label="אורחים צפויים" value={stats.totalAttending} sub={`${responseRate}% הגיבו`} onClick={() => setTab('guests')} />
        <StatCard icon="✅" label="משימות" value={`${stats.taskDone}/${stats.taskTotal}`} sub={`${taskPct}% הושלם`} onClick={() => setTab('tasks')} />
        <StatCard icon="💬" label="שליחה" value="WhatsApp" sub="שלח הזמנות" onClick={() => setTab('send')} accent />
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gold/10">
        <h3 className="font-serif text-lg text-ink mb-4">פילוח אישורים</h3>
        <div className="space-y-3">
          <Bar label="אישרו" value={stats.attending} total={stats.totalGuests} color="bg-emerald-500" />
          <Bar label="לא מגיעים" value={stats.declined} total={stats.totalGuests} color="bg-red-400" />
          <Bar label="אולי" value={stats.maybe} total={stats.totalGuests} color="bg-amber-400" />
          <Bar label="לא הגיבו" value={stats.none} total={stats.totalGuests} color="bg-ink/20" />
        </div>
      </div>

      <button onClick={() => setTab('event')} className="w-full text-center py-3 text-gold underline text-sm">
        עריכת פרטי החתונה
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, sub, onClick, accent }: { icon: string; label: string; value: React.ReactNode; sub: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-start rounded-2xl p-4 shadow-sm border transition active:scale-[0.98] ${
        accent ? 'bg-gold text-white border-gold' : 'bg-white border-gold/10 hover:border-gold/40'
      }`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-xs uppercase tracking-wider ${accent ? 'text-white/80' : 'text-ink/50'}`}>{label}</div>
      <div className={`font-serif text-2xl mt-1 ${accent ? 'text-white' : 'text-ink'}`}>{value}</div>
      <div className={`text-xs mt-0.5 ${accent ? 'text-white/70' : 'text-ink/50'}`}>{sub}</div>
    </button>
  );
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ink/70">{label}</span>
        <span className="text-ink/50">{value}</span>
      </div>
      <div className="h-2 bg-cream/50 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab, stats }: { tab: Tab; setTab: (t: Tab) => void; stats: any }) {
  const items = [
    { id: 'overview', label: 'בית', icon: '🏠' },
    { id: 'guests', label: 'מוזמנים', icon: '👥', badge: stats.none > 0 ? stats.none : null },
    { id: 'tasks', label: 'משימות', icon: '📋', badge: stats.taskTotal - stats.taskDone > 0 ? stats.taskTotal - stats.taskDone : null },
    { id: 'send', label: 'שליחה', icon: '✉️' },
    { id: 'event', label: 'פרטים', icon: '⚙️' },
  ] as const;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gold/15 md:hidden">
      <div className="grid grid-cols-5">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => setTab(it.id as Tab)}
            className={`flex flex-col items-center justify-center py-2.5 relative transition ${
              tab === it.id ? 'text-gold' : 'text-ink/60'
            }`}
          >
            <span className="text-xl">{it.icon}</span>
            <span className="text-[10px] mt-0.5">{it.label}</span>
            {(it as any).badge && (
              <span className="absolute top-1 left-1/2 ms-1 bg-red-500 text-white text-[10px] min-w-[16px] h-4 rounded-full px-1 flex items-center justify-center">
                {(it as any).badge}
              </span>
            )}
            {tab === it.id && <span className="absolute top-0 inset-x-6 h-0.5 bg-gold rounded-full" />}
          </button>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

// Add desktop tabs above content
export function DesktopTabs({ tab, setTab, stats }: { tab: Tab; setTab: (t: Tab) => void; stats: any }) {
  return (
    <nav className="hidden md:flex gap-1 border-b border-gold/10 mb-6">
      {[
        ['overview', 'סקירה'],
        ['guests', `מוזמנים (${stats.totalGuests})`],
        ['tasks', `משימות (${stats.taskDone}/${stats.taskTotal})`],
        ['send', 'שליחה'],
        ['event', 'פרטי החתונה'],
      ].map(([k, label]) => (
        <button
          key={k}
          onClick={() => setTab(k as Tab)}
          className={`px-4 py-2 -mb-px border-b-2 transition ${
            tab === k ? 'border-gold text-gold' : 'border-transparent text-ink/60 hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
