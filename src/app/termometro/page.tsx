import type { Metadata } from 'next';
import Link from 'next/link';
import { getMarketStats } from '@/lib/services/market-stats';

export const metadata: Metadata = {
  title: 'Termómetro del Empleo Junior en Colombia | Camello Online',
  description: 'Datos abiertos del mercado laboral junior en Colombia: roles más demandados, % de trabajo remoto, vacantes sin experiencia y mejores empresas. Actualizado a diario.',
  alternates: { canonical: 'https://www.camelloonline.com/termometro' },
};

export const revalidate = 3600;

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600">
        <span className="font-semibold">{label}</span>
        <span className="font-bold text-slate-800">{value}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function TermometroPage() {
  const s = await getMarketStats();
  const maxCat = Math.max(1, ...s.byCategory.map(c => c.count));
  const updated = new Date(s.lastUpdated).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          📈 Termómetro del Empleo <span className="text-amber-600">Junior</span> en Colombia
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Datos abiertos del mercado laboral, calculados en tiempo real con las vacantes activas de Camello Online.
          Actualizado: {updated}.
        </p>
      </header>

      {/* Métricas clave */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Vacantes activas', value: s.totalActive, accent: 'text-slate-900' },
          { label: '100% Remotas', value: s.remote, accent: 'text-amber-600' },
          { label: 'Sin experiencia', value: s.zeroExp, accent: 'text-emerald-600' },
          { label: 'Remoto + Sin exp', value: s.remoteZeroExp, accent: 'text-emerald-700' },
          { label: 'Requieren inglés', value: s.requiresEnglish, accent: 'text-indigo-600' },
          { label: 'Nuevas hoy', value: s.newToday, accent: 'text-orange-600' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className={`text-2xl sm:text-3xl font-black ${m.accent}`}>{m.value}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{m.label}</div>
          </div>
        ))}
      </section>

      {/* Nuevas hoy por perfil */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">🆕 Vacantes nuevas hoy, por perfil</h2>
        {s.newTodayByProfile.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay vacantes nuevas hoy. Vuelve más tarde.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {s.newTodayByProfile.map(p => (
              <span key={p.category} className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
                {p.label}: <strong>{p.count}</strong>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Roles más demandados */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">👩‍💻 Roles más demandados</h2>
        <div className="space-y-3">
          {s.byCategory.slice(0, 12).map(c => (
            <Bar key={c.category} label={c.label} value={c.count} max={maxCat} />
          ))}
        </div>
      </section>

      {/* Modalidad */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">🏠 Modalidad de trabajo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {s.byModality.map(m => (
            <div key={m.modality} className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-xl font-black text-slate-800">{m.count}</div>
              <div className="text-xs text-slate-500 capitalize">
                {m.modality === 'remote_country' ? 'Remoto' : m.modality === 'remote_worldwide' ? 'Remoto mundial' : m.modality === 'hybrid' ? 'Híbrido' : 'Presencial'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Salario */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-3">
        <h2 className="text-lg font-bold text-slate-900">💰 Salario mensual (vacantes con sueldo publicado)</h2>
        {s.salary.avgMonthlyUsd ? (
          <p className="text-sm text-slate-700">
            Promedio <strong className="text-emerald-700">${s.salary.avgMonthlyUsd} USD/mes</strong> · rango{' '}
            <strong>${s.salary.min} – ${s.salary.max} USD/mes</strong> · basado en {s.salary.disclosed} vacantes con salario real.
            <span className="text-slate-400"> (La mayoría de vacantes en COP no publica salario todavía.)</span>
          </p>
        ) : (
          <p className="text-sm text-slate-500">Aún no hay suficientes datos de salario publicados.</p>
        )}
      </section>

      {/* Ranking empresas */}
      <section className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">🏆 Empresas que más contratan sin experiencia</h2>
          <CompanyTable rows={s.topCompaniesJunior} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">🌎 Empresas con más vacantes remotas</h2>
          <CompanyTable rows={s.topCompaniesRemote} />
        </div>
      </section>

      {/* CTA a nichos */}
      <section className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white space-y-4">
        <h2 className="text-lg font-bold">Explora por tu situación</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/sin-experiencia" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-sm">🌱 Sin experiencia</Link>
          <Link href="/primer-empleo" className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-sm">🎓 Primer empleo / SENA</Link>
          <Link href="/remoto-usd" className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 font-bold text-sm">💵 Remoto en USD</Link>
        </div>
      </section>
    </main>
  );
}

function CompanyTable({ rows }: { rows: { name: string; slug: string; total: number; sinExperiencia: number; remotas: number; usd: number; conSalario: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">Sin datos.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
            <th className="py-2 pr-2 font-semibold">Empresa</th>
            <th className="py-2 px-2 font-semibold text-right">Total</th>
            <th className="py-2 px-2 font-semibold text-right">Sin exp</th>
            <th className="py-2 px-2 font-semibold text-right">Remotas</th>
            <th className="py-2 px-2 font-semibold text-right">USD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.slug} className="border-b border-slate-50">
              <td className="py-2 pr-2 font-semibold text-slate-800">{r.name}</td>
              <td className="py-2 px-2 text-right text-slate-600">{r.total}</td>
              <td className="py-2 px-2 text-right text-emerald-600 font-semibold">{r.sinExperiencia}</td>
              <td className="py-2 px-2 text-right text-amber-600 font-semibold">{r.remotas}</td>
              <td className="py-2 px-2 text-right text-indigo-600 font-semibold">{r.usd}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
