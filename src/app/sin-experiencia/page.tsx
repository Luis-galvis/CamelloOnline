import type { Metadata } from 'next';
import Link from 'next/link';
import { getJobsByFilter } from '@/lib/services/market-stats';
import { ServerJobList } from '@/components/jobs/ServerJobList';

export const metadata: Metadata = {
  title: 'Vacantes Sin Experiencia en Colombia | Camello Online',
  description: 'Encuentra trabajo sin experiencia previa en Colombia: primer empleo, prácticas, SENA y roles trainee. Vacantes verificadas y 100% gratis.',
  keywords: ['trabajo sin experiencia colombia', 'vacantes sin experiencia', 'primer empleo', 'trainee colombia', 'practicante colombia'],
  alternates: { canonical: 'https://www.camelloonline.com/sin-experiencia' },
};

export const revalidate = 3600;

export default async function SinExperienciaPage() {
  const jobs = await getJobsByFilter('sin-experiencia', 40);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          🌱 Vacantes <span className="text-emerald-600">sin experiencia</span> en Colombia
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Tu primer camello está aquí. Vacantes que no piden experiencia previa: trainee, auxiliar, prácticas y roles de entrada.
          Todas verificadas y 100% gratis.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/primer-empleo" className="text-xs font-bold text-amber-700 hover:underline">🎓 Ver primer empleo / SENA →</Link>
          <Link href="/remoto-usd" className="text-xs font-bold text-indigo-700 hover:underline">💵 Ver remoto en USD →</Link>
          <Link href="/termometro" className="text-xs font-bold text-slate-600 hover:underline">📈 Ver termómetro →</Link>
        </div>
      </header>

      <p className="text-xs text-slate-400 font-semibold">{jobs.length} vacantes destacadas</p>
      <ServerJobList jobs={jobs} />
    </main>
  );
}
