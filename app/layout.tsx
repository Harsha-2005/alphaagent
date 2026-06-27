import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AlphaAgent — AI Investment Research',
  description:
    'AI-powered investment research agent. Enter any company name and get a comprehensive Invest / Pass / Watch verdict backed by real data and deep analysis.',
  keywords: ['investment research', 'AI', 'stock analysis', 'LangGraph', 'LLM'],
  authors: [{ name: 'AlphaAgent' }],
  openGraph: {
    title: 'AlphaAgent — AI Investment Research',
    description: 'AI-powered investment research in seconds',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
