# Wedding RSVP

מערכת הזמנות לחתונה: דשבורד אדמין, עמוד RSVP אישי לכל מוזמן, שליחה דרך וואטסאפ (בוטומטי), קליטת אישורים אוטומטית מתגובות בוואטסאפ.

## הרצה

```bash
npm install
npm run dev
```

פתח `http://localhost:3000/admin` (סיסמה לפי `.env.local`).

## חיבור לבוטומטי

1. ודא שה-instance של בוטומטי מחובר (לא בסטטוס `qr_required`).
2. עדכן ב-`.env.local`:
   - `BOTOMATI_BASE_URL` — כתובת השרת של בוטומטי
   - `BOTOMATI_INSTANCE_ID` — מזהה ה-instance
   - `BOTOMATI_WEBHOOK_SECRET` — לקליטת תגובות; אותו ערך שמגדירים ב-Webhook של בוטומטי
3. ב-Botomati צור Webhook שמופנה ל-`PUBLIC_BASE_URL/api/webhooks/botomati` עם event `message.inbound`.

## מבנה

- `src/app/page.tsx` — דף בית
- `src/app/r/[token]` — עמוד RSVP אישי
- `src/app/admin` — דשבורד
- `src/app/api/rsvp` — קליטת RSVP מהאתר
- `src/app/api/admin/*` — endpoints מוגנים בסיסמה
- `src/app/api/webhooks/botomati` — קליטת תגובות וואטסאפ
- DB: schema `wedding` ב-Supabase של בוטומטי
