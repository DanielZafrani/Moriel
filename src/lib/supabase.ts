import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let _admin: any = null;
export function supabaseAdmin(): any {
  if (!_admin) {
    _admin = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'wedding' as any },
    });
  }
  return _admin;
}

export function supabaseAnon(): any {
  return createClient(url, anon, {
    auth: { persistSession: false },
    db: { schema: 'wedding' as any },
  });
}
