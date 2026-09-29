import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vacantes de Empleo y Tecnología en Colombia',
  description: 'Explora ofertas de trabajo en tecnología, software, datos, inteligencia artificial y soporte en Colombia. Filtrado por salario, modalidad y ciudad.',
  alternates: {
    canonical: 'https://www.camelloonline.com/jobs',
  },
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
