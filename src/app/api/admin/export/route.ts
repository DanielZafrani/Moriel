import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const eventId = url.searchParams.get('event_id');
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: guests } = await sb
    .from('guests')
    .select('id, full_name, phone, language, max_guests, group_label, notes, token')
    .eq('event_id', eventId)
    .order('full_name');
  if (!guests) return NextResponse.json({ error: 'no data' }, { status: 404 });

  const { data: responses } = await sb
    .from('rsvp_responses')
    .select('guest_id, status, party_size, dietary, source, responded_at')
    .in('guest_id', guests.map((g) => g.id));

  const rmap = new Map((responses || []).map((r: any) => [r.guest_id, r]));
  const rows = guests.map((g: any) => {
    const r: any = rmap.get(g.id);
    return {
      'שם': g.full_name,
      'טלפון': g.phone,
      'שפה': g.language,
      'קבוצה': g.group_label,
      'מקס׳': g.max_guests,
      'סטטוס': r?.status ?? '',
      'מספר אורחים': r?.party_size ?? '',
      'הערות תזונה': r?.dietary ?? '',
      'מקור': r?.source ?? '',
      'תאריך תשובה': r?.responded_at ?? '',
      'הערות': g.notes,
      'לינק': `${process.env.PUBLIC_BASE_URL || ''}/r/${g.token}`,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guests');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="guests-${eventId}.xlsx"`,
    },
  });
}
