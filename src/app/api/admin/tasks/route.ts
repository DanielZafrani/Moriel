import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

const DEFAULT_TEMPLATE = [
  { category: 'אולם', title: 'סגירת אולם וחתימת חוזה', priority: 'high' },
  { category: 'אולם', title: 'תשלום מקדמה', priority: 'high' },
  { category: 'הזמנות', title: 'עיצוב והדפסת הזמנות', priority: 'normal' },
  { category: 'הזמנות', title: 'שליחת הזמנות וקבלת אישורי הגעה', priority: 'high' },
  { category: 'צילום', title: 'סגירת צלם / וידאו', priority: 'normal' },
  { category: 'מוזיקה', title: 'סגירת DJ או להקה', priority: 'normal' },
  { category: 'מוזיקה', title: 'רשימת שירים מועדפים / שירי הליכה לחופה', priority: 'low' },
  { category: 'אוכל', title: 'תפריט והתאמות תזונה', priority: 'normal' },
  { category: 'לבוש', title: 'שמלת כלה / חליפה', priority: 'normal' },
  { category: 'איפור ושיער', title: 'מאפרת / מעצבת שיער', priority: 'normal' },
  { category: 'חופה', title: 'רב / רבנות', priority: 'high' },
  { category: 'חופה', title: 'כתובה', priority: 'normal' },
  { category: 'חופה', title: 'טבעות', priority: 'normal' },
  { category: 'יום החתונה', title: 'לו״ז יום החתונה', priority: 'high' },
  { category: 'יום החתונה', title: 'הסעות', priority: 'low' },
  { category: 'ירח דבש', title: 'תכנון ירח דבש', priority: 'low' },
];

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const sb = supabaseAdmin();

  if (body.action === 'seed' && body.event_id) {
    const { data: existing } = await sb.from('tasks').select('id').eq('event_id', body.event_id).limit(1);
    if (existing?.length) return NextResponse.json({ error: 'tasks already exist' }, { status: 400 });
    const rows = DEFAULT_TEMPLATE.map((t, i) => ({ ...t, event_id: body.event_id, position: i }));
    const { error } = await sb.from('tasks').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, count: rows.length });
  }

  if (body.action === 'add' && body.event_id) {
    const { data, error } = await sb.from('tasks').insert({
      event_id: body.event_id,
      title: (body.title || '').slice(0, 300),
      notes: body.notes || '',
      category: body.category || 'כללי',
      due_date: body.due_date || null,
      priority: ['low', 'normal', 'high'].includes(body.priority) ? body.priority : 'normal',
    }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  }

  if (body.action === 'update' && body.id) {
    const patch: any = {};
    for (const k of ['title', 'notes', 'category', 'status', 'priority', 'due_date']) {
      if (k in body) patch[k] = body[k];
    }
    const { error } = await sb.from('tasks').update(patch).eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'delete' && body.id) {
    const { error } = await sb.from('tasks').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
