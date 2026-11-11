import type { Metadata } from 'next';
import Link from 'next/link';
import { getJobsByFilter } from '@/lib/services/market-stats';
import { ServerJobList } from '@/components/jobs/ServerJobList';

export const metadata: Metadata = {
  title: 'Primer Empleo, Prácticas y SENA en Colombia | Camello Online',
  description: 'Prácticas, aprendices SENA, pasantías y tu primer empleo en Colombia. Vacantes verificadas para estudiantes, recién egresados y talento sin experiencia.',
  keywords: ['primer empleo colombia', 'practicas sena', 'aprendiz sena', 'pasantias colombia', 'trabajo para estudiantes colombia'],
  alternates: { canonical: 'https://www.camelloonline.com/primer-empleo' },
};

export const revalidate = 3600;

export default async function PrimerEmpleoPage() {
  const jobs = await getJobsByFilter('primer-empleo', 40);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          🎓 <span className="text-amber-600">Primer empleo</span>, prácticas y SENA
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Contratos de aprendizaje, prácticas universitarias, aprendices SENA y pasantías para estudiantes y recién egresados.
          Empieza tu carrera hoy.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/sin-experiencia" className="text-xs font-bold text-emerald-700 hover:underline">🌱 Ver sin experiencia →</Link>
          <Link href="/remoto-usd" className="text-xs font-bold text-indigo-700 hover:underline">💵 Ver remoto en USD →</Link>
        </div>
      </header>

      <p className="text-xs text-slate-400 font-semibold">{jobs.length} vacantes destacadas</p>
      <ServerJobList jobs={jobs} />
    </main>
  );
}
