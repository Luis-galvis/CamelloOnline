'use client';

import { useState } from 'react';
import Link from 'next/link';

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
const labelCls = 'block text-xs font-bold text-slate-600 mb-1';

export default function MatchPage() {
  const [matches, setMatches] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const skills = String(fd.get('skills') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skills,
        expectedSalaryUsd: Number(fd.get('expectedSalaryUsd')) || 0,
        preferredModality: fd.get('preferredModality') || 'remote_country',
        yearsExperience: Number(fd.get('yearsExperience')) || 0,
      }),
    });
    const data = await res.json();
    setMatches(data.matches || []);
    setLoading(false);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">🎯 Encuentra tu <span className="text-amber-600">match</span></h1>
        <p className="text-sm text-slate-600">Pon tus skills, salario esperado y modalidad. Te mostramos las vacantes que mejor encajan.</p>
      </header>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Skills (separadas por coma)</label>
          <input name="skills" className={inputCls} placeholder="React, Node.js, TypeScript" />
        </div>
        <div>
          <label className={labelCls}>Salario mínimo esperado (USD/mes)</label>
          <input name="expectedSalaryUsd" type="number" min="0" className={inputCls} placeholder="1000" />
        </div>
        <div>
          <label className={labelCls}>Años de experiencia</label>
          <input name="yearsExperience" type="number" min="0" step="0.5" className={inputCls} placeholder="0" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Modalidad preferida</label>
          <select name="preferredModality" className={inputCls} defaultValue="remote_country">
            <option value="remote_country">Remoto (Colombia)</option>
            <option value="remote_worldwide">Remoto (Mundial)</option>
            <option value="hybrid">Híbrido</option>
            <option value="on_site">Presencial</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="sm:col-span-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-60">
          {loading ? 'Buscando…' : 'Buscar matches'}
        </button>
      </form>

      {matches && (
        <div className="grid gap-4">
          {matches.length === 0 ? (
            <p className="text-slate-500 text-sm text-center">No encontramos matches. Ajusta tus filtros.</p>
          ) : matches.map((m: any) => {
            const j = m.job;
            return (
              <Link key={j.id} href={`/jobs/${j.slug}`} className="block bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-amber-200 transition-all">
                <div className="flex items-start gap-4">
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
                    <div className="text-xs text-slate-400 font-semibold">Match</div>
                    <div className="text-lg font-black text-emerald-600">{m.score}%</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
