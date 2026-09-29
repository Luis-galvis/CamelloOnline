import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Empleos en Ventas, Comercial & SDR en Colombia',
  description: 'Portal de empleo especializado en ventas y área comercial en Colombia: Asesores comerciales, SDR, BDR, ejecutivos de cuenta B2B y directores de ventas con altas comisiones.',
  keywords: [
    'empleos ventas colombia',
    'vacantes asesor comercial bogota',
    'ejecutivo comercial medellin',
    'sdr remoto colombia',
    'ventas b2b colombia',
    'trabajo comercial cali',
    'camello comercial colombia',
  ],
  alternates: {
    canonical: 'https://www.camelloonline.com/ventas-comercial',
  },
  openGraph: {
    title: 'Empleos en Ventas y Comercial en Colombia | CamelloOnline',
    description: 'Encuentra las mejores oportunidades en el área comercial y ventas en Colombia con comisiones atractivas y trabajo remoto o presencial.',
    url: 'https://www.camelloonline.com/ventas-comercial',
  },
};

export default function VentasComercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
