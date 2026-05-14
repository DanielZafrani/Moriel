import { cookies } from 'next/headers';

const COOKIE = 'wedding_admin';

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  const v = c.get(COOKIE)?.value;
  return !!v && v === process.env.ADMIN_PASSWORD;
}

export async function setAdminCookie(password: string): Promise<boolean> {
  if (!password || password !== process.env.ADMIN_PASSWORD) return false;
  const c = await cookies();
  c.set(COOKIE, password, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function clearAdminCookie() {
  const c = await cookies();
  c.delete(COOKIE);
}
