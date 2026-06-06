import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import TeacherLogin from '@/components/TeacherLogin';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: "IELTS Platform | O'quv Markazi",
  description: "IELTS tayyorgarlik platformasi — mock testlar, kunlik tracker, band 7+ metodologiya",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={geist.variable}>
      <body className="min-h-screen bg-background text-foreground flex flex-col antialiased">
        <Navbar />
        <TeacherLogin />
        <main className="flex-1 pt-[60px]">
          {children}
        </main>
      </body>
    </html>
  );
}
