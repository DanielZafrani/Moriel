import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

async function guard() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return null;
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const sb = supabaseAdmin();

  if (body.id) {
    const { error } = await sb.from('events').update({
      couple_names: body.couple_names ?? '',
      event_date: body.event_date || null,
      venue_name: body.venue_name ?? '',
      venue_address: body.venue_address ?? '',
      reception_at: body.reception_at ?? '',
      ceremony_at: body.ceremony_at ?? '',
      hero_image_url: body.hero_image_url ?? '',
      custom_message_he: body.custom_message_he ?? '',
      custom_message_ru: body.custom_message_ru ?? '',
      custom_message_en: body.custom_message_en ?? '',
      botomati_instance_id: body.botomati_instance_id ?? null,
    }).eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: body.id });
  }

  const { data, error } = await sb.from('events').insert({
    owner_email: body.owner_email || 'gkobzafrani@gmail.com',
    couple_names: body.couple_names ?? '',
    event_date: body.event_date || null,
    venue_name: body.venue_name ?? '',
    venue_address: body.venue_address ?? '',
    reception_at: body.reception_at ?? '',
    ceremony_at: body.ceremony_at ?? '',
    hero_image_url: body.hero_image_url ?? '',
    custom_message_he: body.custom_message_he ?? '',
    custom_message_ru: body.custom_message_ru ?? '',
    custom_message_en: body.custom_message_en ?? '',
    botomati_instance_id: body.botomati_instance_id ?? null,
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
