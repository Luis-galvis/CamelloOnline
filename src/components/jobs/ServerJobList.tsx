import Link from 'next/link';
import { JobPost } from '@/types';

function timeAgo(iso?: string): string {
  if (!iso) return 'Reciente';
  const d = new Date(iso).getTime();
  if (isNaN(d)) return 'Reciente';
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} d`;
  return `hace ${Math.floor(days / 30)} mes`;
}

export function ServerJobList({ jobs, emptyMessage }: { jobs: JobPost[]; emptyMessage?: string }) {
  if (jobs.length === 0) {
    return <p className="text-slate-500 text-sm">{emptyMessage || 'No hay vacantes en este momento. Vuelve pronto.'}</p>;
  }
  return (
    <div className="grid gap-4">
      {jobs.map((j) => (
        <Link
          key={j.id}
          href={`/jobs/${j.slug}`}
          className="block bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-amber-200 transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-base leading-snug">{j.title}</h2>
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {j.companyName} · {j.displayLocation || j.locationCity || 'Colombia'}
              </p>
            </div>
            <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {j.isRemote ? '🏠 Remoto' : j.workModality === 'hybrid' ? 'Híbrido' : 'Presencial'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            {j.isZeroExperience && (
              <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                🌱 Sin experiencia
              </span>
            )}
            {j.salaryDisplayText && j.salaryDisplayText !== 'Salario a convenir' && (
              <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                {j.salaryDisplayText}
              </span>
            )}
            <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600">
              {j.requiresEnglish ? 'Requiere inglés' : 'Español'}
            </span>
            <span className="px-2 py-1 rounded-md bg-slate-100 text-emerald-700 font-semibold">
              ✅ Verificada · {timeAgo(j.createdAt)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
