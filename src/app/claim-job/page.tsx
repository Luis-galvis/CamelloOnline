'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatUsd } from '@/lib/utils';

function ClaimJobContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const { jobs, claimJobPost, setActiveRole } = useAppStore();
  const [claimTokenInput, setClaimTokenInput] = useState(token);
  const [companyName, setCompanyName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetJob = jobs.find(j => j.claimToken === (claimTokenInput || token));

  useEffect(() => {
    if (token) {
      setClaimTokenInput(token);
      const found = jobs.find(j => j.claimToken === token);
      if (found) {
        setCompanyName(found.companyName);
      }
    }
  }, [token, jobs]);

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetJob) {
      setError('Token de reclamo no válido o vacante ya reclamada.');
      return;
    }

    if (!recruiterEmail.includes('@')) {
      setError('Por favor ingresa un correo corporativo válido.');
      return;
    }

    const claimed = claimJobPost(targetJob.claimToken || '', companyName || targetJob.companyName, recruiterEmail);
    if (claimed) {
      setIsSuccess(true);
      setActiveRole('recruiter');
    } else {
      setError('No se pudo reclamar la vacante.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card-clean rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Reclamar Vacante y Activar Cuenta Empresa
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Verifica tu vacante importada desde ATS, accede al Reverse Job Board y envía ofertas directas a candidatos junior pre-evaluados.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">¡Vacante Reclamada con Éxito!</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Tu empresa ha sido verificada y ahora tienes acceso prioritario al Reverse Job Board para buscar talento tech junior y enviar propuestas vinculantes.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/talent"
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <span>Explorar Reverse Job Board</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleClaim} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {targetJob && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Vacante Identificada en ATS</span>
                <h3 className="font-bold text-slate-900 text-sm">{targetJob.title}</h3>
                <p className="text-xs text-slate-600">Empresa detectada: <strong className="text-slate-800">{targetJob.companyName}</strong> · Salario: <strong className="text-emerald-600">{formatUsd(targetJob.salaryMinUsd)} - {formatUsd(targetJob.salaryMaxUsd)} USD</strong></p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Token de Reclamo (ATS Claim Token)</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={claimTokenInput}
                  onChange={(e) => setClaimTokenInput(e.target.value)}
                  placeholder="ej. claim_vercel_123 o pega el token del correo"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Empresa</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nombre oficial de tu empresa"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico Corporativo</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  placeholder="tu.nombre@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verificar y Reclamar Vacante</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

export default function ClaimJobPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Cargando formulario...</div>}>
      <ClaimJobContent />
    </Suspense>
  );
}
