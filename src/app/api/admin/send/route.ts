import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppText } from '@/lib/botomati';

const BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

function buildMessage(opts: {
  kind: 'invitation' | 'reminder';
  lang: 'he' | 'ru' | 'en';
  guestName: string;
  coupleNames: string;
  dateLabel: string;
  rsvpUrl: string;
  customTemplate?: string;
}): string {
  if (opts.customTemplate) {
    return opts.customTemplate
      .replace(/{name}/g, opts.guestName)
      .replace(/{couple}/g, opts.coupleNames)
      .replace(/{date}/g, opts.dateLabel)
      .replace(/{link}/g, opts.rsvpUrl);
  }

  const isReminder = opts.kind === 'reminder';

  if (opts.lang === 'ru') {
    return isReminder
      ? `${opts.guestName}, напоминаем — пожалуйста, подтвердите участие на свадьбе ${opts.coupleNames} (${opts.dateLabel}): ${opts.rsvpUrl}`
      : `${opts.guestName}, мы приглашаем вас на нашу свадьбу!\n${opts.coupleNames}\n${opts.dateLabel}\nПожалуйста, подтвердите участие: ${opts.rsvpUrl}`;
  }
  if (opts.lang === 'en') {
    return isReminder
      ? `Hi ${opts.guestName}, gentle reminder to RSVP for ${opts.coupleNames}'s wedding (${opts.dateLabel}): ${opts.rsvpUrl}`
      : `${opts.guestName}, we'd love to have you at our wedding!\n${opts.coupleNames}\n${opts.dateLabel}\nPlease RSVP: ${opts.rsvpUrl}`;
  }
  return isReminder
    ? `שלום ${opts.guestName}, תזכורת קטנה — נשמח לאישור הגעה לחתונה של ${opts.coupleNames} (${opts.dateLabel}): ${opts.rsvpUrl}`
    : `${opts.guestName}, נשמח לראותכם בחתונה שלנו! 💍\n${opts.coupleNames}\n${opts.dateLabel}\nאישור הגעה: ${opts.rsvpUrl}`;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const eventId = body.event_id;
  const kind: 'invitation' | 'reminder' = body.kind === 'reminder' ? 'reminder' : 'invitation';
  const onlyMissing: boolean = !!body.only_missing;
  const guestIds: string[] | undefined = Array.isArray(body.guest_ids) ? body.guest_ids : undefined;

  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 });
  if (!process.env.BOTOMATI_INSTANCE_ID) {
    return NextResponse.json({ error: 'BOTOMATI_INSTANCE_ID not configured' }, { status: 500 });
  }

  const sb = supabaseAdmin();
  const { data: event } = await sb.from('events').select('*').eq('id', eventId).single();
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  let q = sb.from('guests').select('id, full_name, phone, language, token').eq('event_id', eventId);
  if (guestIds?.length) q = q.in('id', guestIds);
  const { data: guests } = await q;
  if (!guests?.length) return NextResponse.json({ error: 'no guests' }, { status: 400 });

  let targets = guests;
  if (onlyMissing) {
    const { data: responded } = await sb
      .from('rsvp_responses')
      .select('guest_id')
      .in('guest_id', guests.map((g) => g.id));
    const respondedSet = new Set((responded || []).map((r) => r.guest_id));
    targets = guests.filter((g) => !respondedSet.has(g.id));
  }

  const customTemplates = body.templates || {};

  let sent = 0;
  let failed = 0;
  for (const g of targets) {
    const lang = (g.language as 'he' | 'ru' | 'en') || 'he';
    const dateLabel = event.event_date
      ? new Date(event.event_date).toLocaleDateString(
          lang === 'he' ? 'he-IL' : lang === 'ru' ? 'ru-RU' : 'en-US',
          { day: 'numeric', month: 'long', year: 'numeric' }
        )
      : '';
    const text = buildMessage({
      kind,
      lang,
      guestName: g.full_name,
      coupleNames: event.couple_names,
      dateLabel,
      rsvpUrl: `${BASE}/r/${g.token}`,
      customTemplate: customTemplates[lang],
    });

    try {
      const r = await sendWhatsAppText(g.phone, text);
      await sb.from('messages_log').insert({
        event_id: eventId,
        guest_id: g.id,
        direction: 'outbound',
        kind,
        body: text,
        botomati_message_id: r.messageId,
        status: 'sent',
      });
      sent++;
    } catch (e: any) {
      await sb.from('messages_log').insert({
        event_id: eventId,
        guest_id: g.id,
        direction: 'outbound',
        kind,
        body: text,
        status: 'failed',
        error: String(e?.message || e).slice(0, 500),
      });
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: targets.length });
}
