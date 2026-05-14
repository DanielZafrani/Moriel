import { NextResponse } from 'next/server';
import { setAdminCookie } from '@/lib/admin-auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const ok = await setAdminCookie(body?.password || '');
  if (!ok) return NextResponse.json({ error: 'invalid password' }, { status: 401 });
  return NextResponse.json({ ok: true });
}
