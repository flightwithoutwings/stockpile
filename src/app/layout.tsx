
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Comic/Book Library',
  description: 'Manage your comic and book collection with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased h-full`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
