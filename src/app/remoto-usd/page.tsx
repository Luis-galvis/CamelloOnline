import type { Metadata } from 'next';
import Link from 'next/link';
import { getJobsByFilter } from '@/lib/services/market-stats';
import { ServerJobList } from '@/components/jobs/ServerJobList';

export const metadata: Metadata = {
  title: 'Trabajo Remoto en Dólares (USD) desde Colombia | Camello Online',
  description: 'Vacantes 100% remotas que pagan en dólares (USD) para talento en Colombia y Latinoamérica. Tech, ventas, soporte y más. Verificadas y gratis.',
  keywords: ['trabajo remoto en dolares', 'remoto usd colombia', 'trabajo remoto latam', 'ganar en dolares desde colombia', 'vacantes remotas usd'],
  alternates: { canonical: 'https://www.camelloonline.com/remoto-usd' },
};

export const revalidate = 3600;

export default async function RemotoUsdPage() {
  const jobs = await getJobsByFilter('remoto-usd', 40);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          💵 Trabajo <span className="text-indigo-600">remoto en dólares</span> desde Colombia
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Cobra en USD trabajando remoto desde Colombia o Latinoamérica. Empresas globales que contratan talento de la región.
          Verificadas y 100% gratis.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/sin-experiencia" className="text-xs font-bold text-emerald-700 hover:underline">🌱 Ver sin experiencia →</Link>
          <Link href="/primer-empleo" className="text-xs font-bold text-amber-700 hover:underline">🎓 Ver primer empleo →</Link>
        </div>
      </header>

      <p className="text-xs text-slate-400 font-semibold">{jobs.length} vacantes destacadas</p>
      <ServerJobList jobs={jobs} />
    </main>
  );
}
