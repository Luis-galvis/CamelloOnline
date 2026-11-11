import type { Metadata } from 'next';
import Link from 'next/link';
import { getWeeklyTopJobs } from '@/lib/services/ranking';

export const metadata: Metadata = {
  title: 'Los Mejores Camellos de la Semana | Camello Online',
  description: 'Las mejores vacantes de la semana en Colombia, clasificadas automáticamente: sin experiencia, remotas en USD y con salario publicado.',
  alternates: { canonical: 'https://www.camelloonline.com/mejores-de-la-semana' },
};

export const revalidate = 3600;

export default async function MejoresSemanaPage() {
  const ranked = await getWeeklyTopJobs(15);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          🏆 Los mejores <span className="text-amber-600">camellos</span> de la semana
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Ranking automático que cambia cada semana: prioriza vacantes sin experiencia, remotas, con salario real y recién publicadas.
        </p>
        <Link href="/newsletter" className="text-xs font-bold text-indigo-700 hover:underline">📬 Recibir esto por email cada semana →</Link>
      </header>

      <div className="grid gap-4">
        {ranked.map((r, i) => {
          const j = r.job;
          return (
            <Link key={j.id} href={`/jobs/${j.slug}`} className="block bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-amber-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-black text-lg flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-slate-900 text-base leading-snug">{j.title}</h2>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">{j.companyName} · {j.displayLocation || j.locationCity || 'Colombia'}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {j.isZeroExperience && <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">🌱 Sin experiencia</span>}
                    {j.isRemote && <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold">🏠 Remoto</span>}
                    {j.salaryDisplayText && j.salaryDisplayText !== 'Salario a convenir' && (
                      <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">{j.salaryDisplayText}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-slate-400 font-semibold">Score</div>
                  <div className="text-lg font-black text-amber-600">{r.score}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
