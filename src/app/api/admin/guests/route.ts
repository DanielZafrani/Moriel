import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { newGuestToken } from '@/lib/token';

function normalizePhone(raw: string): string {
  const digits = (raw || '').replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('0')) return '972' + digits.slice(1);
  return digits;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const sb = supabaseAdmin();

  if (body.action === 'add') {
    const phone = normalizePhone(body.phone);
    if (!body.full_name || !phone || !body.event_id) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }
    const { data, error } = await sb.from('guests').insert({
      event_id: body.event_id,
      full_name: body.full_name,
      phone,
      language: ['he', 'ru', 'en'].includes(body.language) ? body.language : 'he',
      max_guests: Math.max(1, Number(body.max_guests) || 2),
      group_label: body.group_label || '',
      notes: body.notes || '',
      token: newGuestToken(),
    }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  }

  if (body.action === 'bulk') {
    if (!body.event_id || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }
    const rows = body.rows
      .map((r: any) => {
        const phone = normalizePhone(r.phone);
        if (!r.full_name || !phone) return null;
        return {
          event_id: body.event_id,
          full_name: String(r.full_name).slice(0, 200),
          phone,
          language: ['he', 'ru', 'en'].includes(r.language) ? r.language : 'he',
          max_guests: Math.max(1, Number(r.max_guests) || 2),
          group_label: r.group_label || '',
          notes: r.notes || '',
          token: newGuestToken(),
        };
      })
      .filter(Boolean);
    if (!rows.length) return NextResponse.json({ error: 'no valid rows' }, { status: 400 });
    const { error } = await sb.from('guests').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, count: rows.length });
  }

  if (body.action === 'update' && body.id) {
    const patch: any = {};
    for (const k of ['full_name', 'language', 'max_guests', 'group_label', 'notes']) {
      if (k in body) patch[k] = body[k];
    }
    if (body.phone) patch.phone = normalizePhone(body.phone);
    const { error } = await sb.from('guests').update(patch).eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'delete' && body.id) {
    const { error } = await sb.from('guests').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
