import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CamelloOnline | Bolsa de Empleo Colombia & Trabajo Remoto',
    short_name: 'CamelloOnline',
    description: 'Encuentra camello verificado en Colombia: Tech, Ventas, IA y Trabajo Remoto en Dólares.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#d97706',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
