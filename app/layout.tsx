import type { Metadata, Viewport } from 'next';

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
  icons: {
    apple: '/apple-touch-icon.png',
  },
};
