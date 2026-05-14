import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  const status = body?.status;
  const partySize = Number(body?.party_size) || 0;
  const dietary = (body?.dietary || '').toString().slice(0, 500);

  if (!token || !['attending', 'declined', 'maybe'].includes(status)) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: guest } = await sb
    .from('guests')
    .select('id, max_guests')
    .eq('token', token)
    .maybeSingle();
  if (!guest) return NextResponse.json({ error: 'guest not found' }, { status: 404 });

  const finalParty =
    status === 'attending' ? Math.min(guest.max_guests, Math.max(1, partySize)) : 0;

  const { error } = await sb
    .from('rsvp_responses')
    .upsert({
      guest_id: guest.id,
      status,
      party_size: finalParty,
      dietary,
      source: 'web',
      responded_at: new Date().toISOString(),
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
