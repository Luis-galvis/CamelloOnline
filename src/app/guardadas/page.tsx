'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function GuardadasPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ids: string[] = JSON.parse(localStorage.getItem('camelloonline_saved_jobs') || '[]');
        if (!Array.isArray(ids) || ids.length === 0) {
          setLoading(false);
          return;
        }
        const { data } = await supabase
          .from('job_posts')
          .select('id, title, slug, work_modality, location_city, is_zero_experience, salary_min_usd, currency, companies(name)')
          .in('id', ids)
          .eq('status', 'active');
        setJobs(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">🔖 Mis vacantes guardadas</h1>
      </header>

      {loading ? (
        <p className="text-slate-500 text-sm">Cargando…</p>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-slate-500">Aún no has guardado ninguna vacante.</p>
          <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm">Explorar vacantes</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map(j => {
            const comp = Array.isArray(j.companies) ? j.companies[0] : j.companies;
            return (
              <Link key={j.id} href={`/jobs/${j.slug}`} className="block bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-amber-200 transition-all">
                <h2 className="font-bold text-slate-900 text-base leading-snug">{j.title}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{comp?.name || 'Empresa'} · {j.location_city || 'Colombia'}</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                    {j.work_modality === 'remote_country' ? '🏠 Remoto' : j.work_modality === 'remote_worldwide' ? '🌎 Remoto mundial' : j.work_modality === 'hybrid' ? 'Híbrido' : 'Presencial'}
                  </span>
                  {j.is_zero_experience && <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">🌱 Sin experiencia</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
