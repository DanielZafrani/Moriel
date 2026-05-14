'use client';
import { useState, useMemo, useEffect } from 'react';

type Task = any;

export default function TasksPanel({ event, initialTasks }: { event: any; initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<'all' | 'todo' | 'doing' | 'done'>('all');
  const [seeding, setSeeding] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  const grouped = useMemo(() => {
    const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
    const map = new Map<string, Task[]>();
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return Array.from(map.entries());
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  async function seed() {
    setSeeding(true);
    const r = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'seed', event_id: event.id }),
    });
    setSeeding(false);
    if (r.ok) location.reload();
    else alert('כבר יש משימות');
  }

  async function update(id: string, patch: any) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, ...patch }),
    });
  }

  async function del(id: string) {
    if (!confirm('למחוק את המשימה?')) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
  }

  async function addTask(form: any) {
    const r = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'add', event_id: event.id, ...form }),
    });
    if (r.ok) location.reload();
  }

  if (!tasks.length) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="font-serif text-2xl text-ink mb-2">עדיין אין משימות</h3>
        <p className="text-ink/60 mb-6">נתחיל ברשימה מוכנה של 16 משימות נפוצות לתכנון חתונה</p>
        <button
          onClick={seed}
          disabled={seeding}
          className="bg-gold text-white px-8 py-3 rounded-full font-medium hover:bg-gold/90 disabled:opacity-40 shadow-md transition"
        >
          {seeding ? '...' : '✨ צור רשימה מוכנה'}
        </button>
        <p className="text-xs text-ink/40 mt-4">או הוסף משימות בעצמך</p>
        <button onClick={() => setAdding(true)} className="text-gold underline mt-2 text-sm">+ הוספת משימה</button>
        {adding && <AddTaskModal onAdd={addTask} onClose={() => setAdding(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gold/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg text-ink">התקדמות</h3>
          <span className="text-gold font-medium text-lg">{stats.pct}%</span>
        </div>
        <div className="h-3 bg-cream rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold/70 transition-all"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
        <p className="text-sm text-ink/60 mt-2">
          {stats.done} מתוך {stats.total} משימות הושלמו
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          ['all', 'הכל', stats.total],
          ['todo', 'לעשות', tasks.filter((t) => t.status === 'todo').length],
          ['doing', 'בתהליך', tasks.filter((t) => t.status === 'doing').length],
          ['done', 'הושלם', stats.done],
        ].map(([k, label, n]) => (
          <button
            key={k as string}
            onClick={() => setFilter(k as any)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
              filter === k ? 'bg-ink text-white' : 'bg-white border border-ink/15 text-ink/70 hover:border-gold/50'
            }`}
          >
            {label} <span className="opacity-60">{n as number}</span>
          </button>
        ))}
        <button
          onClick={() => setAdding(true)}
          className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-gold text-white hover:bg-gold/90 transition"
        >
          + משימה
        </button>
      </div>

      {/* Tasks by category */}
      <div className="space-y-4">
        {grouped.map(([cat, items]) => (
          <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gold/10 overflow-hidden">
            <div className="px-5 py-3 bg-cream/40 border-b border-gold/10">
              <h4 className="font-serif text-gold">{cat}</h4>
            </div>
            <ul className="divide-y divide-ink/5">
              {items.map((t) => (
                <TaskRow key={t.id} task={t} onUpdate={update} onDelete={del} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {adding && <AddTaskModal onAdd={addTask} onClose={() => setAdding(false)} />}
    </div>
  );
}

function TaskRow({ task, onUpdate, onDelete }: { task: any; onUpdate: (id: string, patch: any) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const done = task.status === 'done';

  function toggle() {
    onUpdate(task.id, { status: done ? 'todo' : 'done' });
  }

  return (
    <li className="px-5 py-3 flex items-center gap-3 hover:bg-cream/30 transition group">
      <button
        onClick={toggle}
        aria-label="toggle"
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition flex items-center justify-center ${
          done ? 'bg-gold border-gold text-white' : 'border-ink/30 hover:border-gold'
        }`}
      >
        {done && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"/></svg>}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { onUpdate(task.id, { title }); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onUpdate(task.id, { title }); setEditing(false); } }}
            autoFocus
            className="w-full bg-transparent border-b border-gold focus:outline-none"
          />
        ) : (
          <div onClick={() => setEditing(true)} className={`cursor-text ${done ? 'line-through text-ink/40' : 'text-ink'}`}>
            {task.title}
          </div>
        )}
        {task.due_date && (
          <div className="text-xs text-ink/50 mt-0.5">📅 {new Date(task.due_date).toLocaleDateString('he-IL')}</div>
        )}
      </div>

      {task.priority === 'high' && !done && (
        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">דחוף</span>
      )}

      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 text-ink/30 hover:text-red-600 transition p-1"
        aria-label="מחק"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>
      </button>
    </li>
  );
}

function AddTaskModal({ onAdd, onClose }: { onAdd: (form: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ title: '', category: 'כללי', priority: 'normal', due_date: '' });
  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 space-y-4 shadow-2xl">
        <h3 className="font-serif text-xl text-gold">משימה חדשה</h3>
        <input
          placeholder="כותרת"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          autoFocus
          className="w-full rounded-lg border border-ink/15 px-4 py-3"
        />
        <input
          placeholder="קטגוריה"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full rounded-lg border border-ink/15 px-4 py-3"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="rounded-lg border border-ink/15 px-4 py-3"
          >
            <option value="low">עדיפות נמוכה</option>
            <option value="normal">עדיפות רגילה</option>
            <option value="high">דחוף</option>
          </select>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="rounded-lg border border-ink/15 px-4 py-3"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-ink/15 hover:bg-cream">ביטול</button>
          <button
            onClick={() => { if (form.title) onAdd(form); }}
            disabled={!form.title}
            className="flex-1 py-3 rounded-lg bg-gold text-white disabled:opacity-40 hover:bg-gold/90"
          >
            הוספה
          </button>
        </div>
      </div>
    </div>
  );
}
