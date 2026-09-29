import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trabajo Remoto Colombia & Empleos en Dólares (USD)',
  description: 'Descubre ofertas de trabajo 100% remoto para colombianos: Asistentes virtuales, soporte al cliente, marketing, finanzas y operaciones con salarios en USD y COP.',
  keywords: [
    'trabajo remoto colombia',
    'empleo remoto dolares',
    'asistente virtual colombia remoto',
    'servicio al cliente remoto colombia',
    'trabajo desde casa colombia',
    'empleos bilingues remoto',
    'camello remoto colombia',
  ],
  alternates: {
    canonical: 'https://www.camelloonline.com/remoto-colombia',
  },
  openGraph: {
    title: 'Trabajo Remoto Colombia & Vacantes en Dólares | CamelloOnline',
    description: 'Vacantes 100% remotas para colombianos. Postúlate a empresas internacionales con pago en USD y contratos directos.',
    url: 'https://www.camelloonline.com/remoto-colombia',
  },
};

export default function RemotoColombiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
