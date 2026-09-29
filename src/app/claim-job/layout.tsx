import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Publicar Oferta de Empleo en Colombia | Reclamar Vacante',
  description: 'Publica o reclama la vacante de tu empresa en CamelloOnline. Llega a miles de talentos calificados en Colombia en desarrollo, ventas y operaciones.',
  alternates: {
    canonical: 'https://www.camelloonline.com/claim-job',
  },
};

export default function ClaimJobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
