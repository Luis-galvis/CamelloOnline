import type { Metadata } from 'next';
import Link from 'next/link';
import { getMarketStats } from '@/lib/services/market-stats';

export const metadata: Metadata = {
  title: 'Mejores Empresas para Junior en Colombia | Camello Online',
  description: 'Ranking de las mejores empresas para perfiles junior en Colombia: quién contrata sin experiencia, quién ofrece trabajo remoto y quién paga en dólares.',
  alternates: { canonical: 'https://www.camelloonline.com/empresas' },
};

export const revalidate = 3600;

export default async function EmpresasPage() {
  const s = await getMarketStats();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          🏆 Mejores empresas para <span className="text-amber-600">talento junior</span>
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Ranking calculado con las vacantes activas de Camello Online: empresas que contratan sin experiencia,
          ofrecen trabajo remoto y pagan en dólares.
        </p>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">🌱 Contratan sin experiencia</h2>
        <CompanyTable rows={s.topCompaniesJunior} highlight="sinExperiencia" />
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">🌎 Más vacantes remotas</h2>
        <CompanyTable rows={s.topCompaniesRemote} highlight="remotas" />
      </section>

      <section className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white space-y-3">
        <h2 className="text-lg font-bold">¿Buscas trabajo? Empieza aquí</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/sin-experiencia" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-sm">🌱 Sin experiencia</Link>
          <Link href="/primer-empleo" className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-sm">🎓 Primer empleo / SENA</Link>
          <Link href="/remoto-usd" className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 font-bold text-sm">💵 Remoto en USD</Link>
          <Link href="/termometro" className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-sm">📈 Termómetro</Link>
        </div>
      </section>
    </main>
  );
}

function CompanyTable({ rows, highlight }: {
  rows: { name: string; slug: string; total: number; sinExperiencia: number; remotas: number; usd: number; conSalario: number }[];
  highlight: 'sinExperiencia' | 'remotas';
}) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">Sin datos.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
            <th className="py-2 pr-2 font-semibold">#</th>
            <th className="py-2 pr-2 font-semibold">Empresa</th>
            <th className="py-2 px-2 font-semibold text-right">Total</th>
            <th className="py-2 px-2 font-semibold text-right">Sin exp</th>
            <th className="py-2 px-2 font-semibold text-right">Remotas</th>
            <th className="py-2 px-2 font-semibold text-right">USD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.slug} className="border-b border-slate-50">
              <td className="py-2 pr-2 text-slate-400 font-bold">{i + 1}</td>
              <td className="py-2 pr-2 font-semibold text-slate-800">{r.name}</td>
              <td className="py-2 px-2 text-right text-slate-600">{r.total}</td>
              <td className={`py-2 px-2 text-right font-semibold ${highlight === 'sinExperiencia' ? 'text-emerald-600' : 'text-slate-600'}`}>{r.sinExperiencia}</td>
              <td className={`py-2 px-2 text-right font-semibold ${highlight === 'remotas' ? 'text-amber-600' : 'text-slate-600'}`}>{r.remotas}</td>
              <td className="py-2 px-2 text-right text-indigo-600 font-semibold">{r.usd}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
