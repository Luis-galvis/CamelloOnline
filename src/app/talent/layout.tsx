import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Directorio de Talento Colombia | Contrata Profesionales Verificados',
  description: 'Explora y contrata el mejor talento colombiano en tecnología, desarrollo web, inteligencia artificial, ventas y soporte remoto. Perfiles verificados listos para trabajar.',
  keywords: [
    'talento colombiano',
    'contratar desarrolladores colombia',
    'programadores colombia contratar',
    'talento tech bogota medellin',
    'directorio talento remoto colombia',
  ],
  alternates: {
    canonical: 'https://www.camelloonline.com/talent',
  },
  openGraph: {
    title: 'Directorio de Talento Colombia | CamelloOnline',
    description: 'Encuentra perfiles verificados de ingenieros, diseñadores y profesionales comerciales en Colombia.',
    url: 'https://www.camelloonline.com/talent',
  },
};

export default function TalentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
