import type { Metadata } from 'next';
import Link from 'next/link';
import { PublishJobForm } from '@/components/jobs/PublishJobForm';

export const metadata: Metadata = {
  title: 'Para Empresas — Publica tus Vacantes Gratis | Camello Online',
  description: 'Publica tus vacantes en Camello Online y llega a talento junior, sin experiencia y remoto en Colombia. 100% gratis y sin intermediarios.',
  alternates: { canonical: 'https://www.camelloonline.com/para-empresas' },
};

export default function ParaEmpresasPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Contrata talento <span className="text-amber-600">junior y remoto</span> en Colombia
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Publica tus vacantes gratis y llega a miles de candidatos que buscan primer empleo, trabajo remoto en USD y roles tech. Sin comisiones, sin intermediarios.
        </p>
        <Link href="/claim-job" className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800">
          ¿Tu empresa ya aparece? Reclama tu perfil →
        </Link>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: '🎯', title: 'Foco junior y sin experiencia', text: 'El único portal colombiano especializado en talento de entrada.' },
          { icon: '🌎', title: 'Vacantes remotas', text: 'Llega a candidatos que buscan remoto en COP y USD.' },
          { icon: '✅', title: 'Verificado', text: 'Vacantes verificadas para evitar postulaciones basura.' },
        ].map(b => (
          <div key={b.title} className="bg-white rounded-2xl border border-slate-200 p-5 text-center space-y-2">
            <div className="text-3xl">{b.icon}</div>
            <h3 className="font-bold text-slate-900">{b.title}</h3>
            <p className="text-xs text-slate-500">{b.text}</p>
          </div>
        ))}
      </section>

      <div className="max-w-2xl mx-auto space-y-3">
        <h2 className="text-xl font-black text-slate-900 text-center">Publica tu vacante ahora</h2>
        <PublishJobForm />
      </div>
    </main>
  );
}
