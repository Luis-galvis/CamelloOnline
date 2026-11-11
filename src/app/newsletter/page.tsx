import type { Metadata } from 'next';
import Link from 'next/link';
import { NewsletterForm } from '@/components/layout/NewsletterForm';

export const metadata: Metadata = {
  title: 'Newsletter semanal — Los Mejores Camellos | Camello Online',
  description: 'Recibe cada semana en tu correo las mejores vacantes de Colombia: sin experiencia, remotas en USD y con salario publicado.',
  alternates: { canonical: 'https://www.camelloonline.com/newsletter' },
};

export default function NewsletterPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        📬 Los mejores <span className="text-amber-600">camellos</span>, en tu correo
      </h1>
      <p className="text-slate-600 text-sm sm:text-base">
        Cada semana te enviamos un ranking de las mejores vacantes de Colombia, clasificadas automáticamente:
        sin experiencia, remotas, con salario real y recién publicadas.
      </p>
      <div className="flex justify-center">
        <NewsletterForm />
      </div>
      <Link href="/mejores-de-la-semana" className="text-xs font-bold text-indigo-700 hover:underline">Ver el ranking de esta semana →</Link>
    </main>
  );
}
