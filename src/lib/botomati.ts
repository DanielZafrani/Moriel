const BASE = process.env.BOTOMATI_BASE_URL!;
const INSTANCE = process.env.BOTOMATI_INSTANCE_ID!;
const API_KEY = process.env.BOTOMATI_API_KEY || '';

export async function sendWhatsAppText(to: string, text: string) {
  const url = `${BASE}/instances/${encodeURIComponent(INSTANCE)}/messages/text`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify({ to, text }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `botomati ${res.status}`);
  return body as { ok: true; messageId: string };
}
