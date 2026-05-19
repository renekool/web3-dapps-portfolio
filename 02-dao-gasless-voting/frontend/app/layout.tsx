import type {Metadata} from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'DAO Gasless',
  description: 'Decentralized governance made simple and gasless.',
  icons: '/brand-icon.svg?v=1',
};

import { Providers } from './providers';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-body antialiased min-w-[1100px] overflow-x-auto bg-[#F5F6F4]" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
