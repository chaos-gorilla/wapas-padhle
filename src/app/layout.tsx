import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Wapas Padhle • by Scale with Rai',
  description:
    'A clean, zero-friction full-stack spaced repetition web application for software engineers preparing for DSA and technical interviews using the SM-2 algorithm. Built by Abhishek Rai • Scale with Rai.',
  keywords: [
    'Spaced Repetition',
    'DSA',
    'LeetCode',
    'System Design',
    'Technical Interviews',
    'SM-2 Algorithm',
    'Scale with Rai',
    'Abhishek Rai',
  ],
  authors: [{ name: 'Abhishek Rai', url: 'https://www.linkedin.com/in/abhishek-rai-atlassian/' }],
  creator: 'Scale with Rai',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} h-full w-full overflow-x-hidden`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('wapas_theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full w-full flex flex-col bg-[#fbfbfd] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 antialiased font-sans transition-colors duration-150 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
