import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-cream via-cream/40 to-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4">💍</div>
        <h1 className="font-serif text-5xl text-gold mb-3">חתונה</h1>
        <p className="text-ink/60 mb-8 leading-relaxed">
          מערכת לניהול אישורי הגעה, משימות תכנון ושליחת הזמנות בוואטסאפ
        </p>
        <Link
          href="/admin"
          className="inline-block bg-gold text-white px-8 py-3 rounded-full font-medium shadow-md hover:bg-gold/90 transition active:scale-95"
        >
          כניסה לדשבורד ←
        </Link>
      </div>
    </main>
  );
}
