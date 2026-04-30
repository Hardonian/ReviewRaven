import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReviewRaven - Watch the patterns, detect the deception',
  description: 'Before you buy it, see the truth. Get a trust verdict for any product with ReviewRaven.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-raven-50 text-raven-900 antialiased">
        {children}
      </body>
    </html>
  );
}
