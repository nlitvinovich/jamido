import type { Metadata, Viewport } from 'next';
import React from 'react';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#3E4A3F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'JAMIDO — В наличии',
  description: 'Авторский текстиль и одежда из натурального льна в Минске',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JAMIDO',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
