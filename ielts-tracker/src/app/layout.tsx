import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { TeacherLogin } from '@/components/TeacherLogin';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IELTS 7+ | Practice Platform',
  description: 'Structured IELTS mock tests, daily skill tracker, and 14-day Band 7+ preparation system.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <TeacherLogin />
        <main className="flex-1 pt-16">{children}</main>
      </body>
    </html>
  );
}
