import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JAMIDO — Изделия из льна в наличии',
    short_name: 'JAMIDO',
    description: 'Авторские платья из льна, столовое белье, платки и шторы от мастерской Анастасии Яминской',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F5',
    theme_color: '#3E4A3F',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
