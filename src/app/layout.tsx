import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReviewGhost - Ghost the fake reviews',
  description: 'Before you buy it, ghost the fake reviews. Get a trust verdict for any product.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ghost-50 text-ghost-900 antialiased">
        {children}
      </body>
    </html>
  );
}
