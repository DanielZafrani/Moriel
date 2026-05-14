import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const SECRET = process.env.BOTOMATI_WEBHOOK_SECRET || '';

function verify(rawBody: string, signature: string | null): boolean {
  if (!SECRET || !signature) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function parseIntent(text: string): { status: 'attending' | 'declined' | 'maybe' | null; party?: number } {
  const t = (text || '').toLowerCase().trim();
  if (!t) return { status: null };

  // explicit number → attending with party size
  const num = t.match(/\b([1-9]\d?)\b/);

  const yes = /\b(yes|yep|sure|coming|attend|כן|אגיע|אגיעה|אני בא|אנחנו באים|נגיע|מאשר|מאשרת|מגיע|מגיעה|מגיעים|да|приду|придём|придем|подтверждаю|конечно)\b/i;
  const no = /\b(no|cannot|can't|won't|לא|לא אגיע|לא נוכל|לא מגיע|לא מגיעה|לא מגיעים|нет|не смогу|не приду|не придём)\b/i;
  const maybe = /\b(maybe|perhaps|אולי|אני אנסה|אנסה|может|возможно|постараюсь)\b/i;

  if (no.test(t)) return { status: 'declined' };
  if (maybe.test(t)) return { status: 'maybe' };
  if (yes.test(t) || num) {
    return { status: 'attending', party: num ? Math.min(20, Math.max(1, +num[1])) : undefined };
  }
  return { status: null };
}

function normalizePhone(raw: string): string {
  return (raw || '').replace(/[^\d]/g, '');
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('x-botomati-signature');
  if (!verify(raw, sig)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }); }

  if (payload?.event !== 'message.inbound') return NextResponse.json({ ok: true, ignored: true });

  const data = payload.data || {};
  const fromPhone = normalizePhone(data.from || data.chat_jid?.split('@')[0] || '');
  const body = (data.body || '').toString();
  if (!fromPhone) return NextResponse.json({ ok: true, ignored: true });

  const sb = supabaseAdmin();
  const { data: guest } = await sb
    .from('guests')
    .select('id, event_id, max_guests, full_name')
    .eq('phone', fromPhone)
    .maybeSingle();

  if (!guest) return NextResponse.json({ ok: true, unknown_sender: true });

  await sb.from('messages_log').insert({
    event_id: guest.event_id,
    guest_id: guest.id,
    direction: 'inbound',
    kind: 'reply',
    body,
    botomati_message_id: data.message_id || null,
    status: 'received',
  });

  const parsed = parseIntent(body);
  if (!parsed.status) return NextResponse.json({ ok: true, parsed: false });

  const partySize =
    parsed.status === 'attending'
      ? Math.min(guest.max_guests, parsed.party ?? 1)
      : 0;

  await sb.from('rsvp_responses').upsert({
    guest_id: guest.id,
    status: parsed.status,
    party_size: partySize,
    source: 'whatsapp',
    responded_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, parsed: true, status: parsed.status });
}
