import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { t, dir, type Lang } from '@/lib/i18n';
import RsvpForm from './RsvpForm';

export const dynamic = 'force-dynamic';

type Params = Promise<{ token: string }>;

export default async function Page({ params }: { params: Params }) {
  const { token } = await params;
  const sb = supabaseAdmin();

  const { data: guest } = await sb
    .from('guests')
    .select('id, full_name, language, max_guests, event_id')
    .eq('token', token)
    .maybeSingle();

  if (!guest) notFound();

  const { data: event } = await sb
    .from('events')
    .select('*')
    .eq('id', guest.event_id)
    .single();

  const { data: existing } = await sb
    .from('rsvp_responses')
    .select('status, party_size, dietary, message')
    .eq('guest_id', guest.id)
    .maybeSingle();

  const lang = (guest.language as Lang) || 'he';
  const T = t[lang];
  const direction = dir(lang);

  const customMessage =
    lang === 'he' ? event.custom_message_he :
    lang === 'ru' ? event.custom_message_ru :
    event.custom_message_en;

  const dateLabel = event.event_date
    ? new Date(event.event_date).toLocaleDateString(
        lang === 'he' ? 'he-IL' : lang === 'ru' ? 'ru-RU' : 'en-US',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      )
    : '';

  return (
    <main
      dir={direction}
      className="min-h-screen bg-gradient-to-b from-cream via-cream/60 to-white px-4 py-8 md:py-14"
    >
      <article className="max-w-xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-gold/20">
        {event.hero_image_url ? (
          <div className="aspect-[3/2] bg-cream overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.hero_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-[3/2] bg-gradient-to-br from-cream via-white to-gold/10 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'radial-gradient(circle at 30% 20%, #b08a4f33 0%, transparent 50%), radial-gradient(circle at 70% 80%, #b08a4f22 0%, transparent 50%)',
            }} />
            <div className="font-serif text-8xl text-gold/30 relative">&</div>
          </div>
        )}

        <div className="px-6 md:px-10 py-10 text-center">
          <p className="uppercase tracking-[0.3em] text-xs text-gold mb-4">{T.youAreInvited}</p>
          <h1 className="font-serif text-4xl md:text-5xl text-ink mb-2 leading-tight">{event.couple_names}</h1>
          <div className="my-6 flex items-center justify-center gap-3 text-gold">
            <span className="h-px w-12 bg-gold/40" />
            <span className="text-2xl">♥</span>
            <span className="h-px w-12 bg-gold/40" />
          </div>

          <div className="space-y-2 text-ink/80 mb-8">
            {dateLabel && <p className="font-serif text-xl">{dateLabel}</p>}
            {event.venue_name && <p className="font-medium">{event.venue_name}</p>}
            {event.venue_address && <p className="text-sm text-ink/60">{event.venue_address}</p>}
            <div className="flex justify-center gap-6 pt-3 text-sm">
              {event.reception_at && <span><span className="text-gold">{T.reception}:</span> {event.reception_at}</span>}
              {event.ceremony_at && <span><span className="text-gold">{T.ceremony}:</span> {event.ceremony_at}</span>}
            </div>
          </div>

          {customMessage && (
            <p className="font-serif italic text-lg text-ink/70 mb-8 leading-relaxed px-2">
              "{customMessage}"
            </p>
          )}

          <hr className="border-gold/20 my-6" />

          <p className="text-sm text-ink/50 mb-1">{T.youAreInvited === 'אנחנו שמחים להזמין אתכם לחתונתנו' ? 'אורח/ת' : ''}</p>
          <p className="font-serif text-2xl text-ink mb-1">{guest.full_name}</p>
          <h2 className="font-serif text-xl text-gold mb-6 mt-4">{T.rsvpTitle}</h2>

          <RsvpForm
            token={token}
            lang={lang}
            maxGuests={guest.max_guests}
            initial={existing || null}
          />
        </div>
      </article>
      <p className="text-center text-xs text-ink/30 mt-6 mb-4">♥</p>
    </main>
  );
}
