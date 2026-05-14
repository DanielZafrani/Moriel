import { isAdmin } from '@/lib/admin-auth';
import LoginForm from './LoginForm';
import { supabaseAdmin } from '@/lib/supabase';
import Dashboard from './Dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!(await isAdmin())) return <LoginForm />;

  const sb = supabaseAdmin();
  const { data: events } = await sb.from('events').select('*').order('created_at', { ascending: false });
  const currentEvent = events?.[0] || null;

  let guests: any[] = [];
  let responses: any[] = [];
  let tasks: any[] = [];
  if (currentEvent) {
    const g = await sb.from('guests').select('*').eq('event_id', currentEvent.id).order('full_name');
    guests = g.data || [];
    const r = await sb.from('rsvp_responses').select('*').in('guest_id', guests.map((x) => x.id));
    responses = r.data || [];
    const tk = await sb.from('tasks').select('*').eq('event_id', currentEvent.id).order('position');
    tasks = tk.data || [];
  }

  return <Dashboard event={currentEvent} guests={guests} responses={responses} tasks={tasks} />;
}
