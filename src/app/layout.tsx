import './globals.css';
import type { Metadata } from 'next';
import { Heebo, Cormorant_Garamond } from 'next/font/google';

const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-sans', display: 'swap' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wedding RSVP',
  description: 'Wedding invitation & RSVP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${heebo.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
