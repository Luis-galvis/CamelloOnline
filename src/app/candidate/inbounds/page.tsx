'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  MessageSquare, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatUsd, formatModality, getRemainingDays } from '@/lib/utils';

export default function CandidateInboundsPage() {
  const { inbounds, currentCandidate, acceptInboundRequest, declineInboundRequest } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');

  const candidateInbounds = inbounds.filter(i => i.candidateId === currentCandidate?.id);

  const filteredInbounds = candidateInbounds.filter(i => {
    if (filterStatus === 'all') return true;
    return i.status === filterStatus;
  });

  const handleDeclineSubmit = (inboundId: string) => {
    declineInboundRequest(inboundId, declineReason);
    setDecliningId(null);
    setDeclineReason('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen">
      
      {/* Header Banner */}
      <div className="card-clean rounded-3xl p-6 sm:p-8 border border-slate-200 bg-gradient-to-r from-white via-emerald-50/30 to-sky-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="badge-pastel-emerald inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Inbox className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bandeja de Ofertas Inbound</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Ofertas Directas de Empresas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Candidato activo: <strong className="text-slate-800">{currentCandidate?.firstName} {currentCandidate?.lastName}</strong> (Piso Salarial: <strong className="text-emerald-600 font-extrabold">{formatUsd(currentCandidate?.minimumExpectedSalaryUsd || 0)} USD</strong>)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/talent"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
            >
              Ver Reverse Board
            </Link>
            <Link
              href="/candidate/profile"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              Editar Mi Perfil
            </Link>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 pt-6 border-t border-slate-100 mt-6">
          {['all', 'pending', 'accepted', 'declined'].map(status => {
            const count = status === 'all' 
              ? candidateInbounds.length 
              : candidateInbounds.filter(i => i.status === status).length;

            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  filterStatus === status
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status === 'all' && `Todas (${count})`}
                {status === 'pending' && `Pendientes (${count})`}
                {status === 'accepted' && `Aceptadas (${count})`}
                {status === 'declined' && `Declinadas (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inbound Cards List */}
      <div className="space-y-4">
        {filteredInbounds.length === 0 ? (
          <div className="card-clean rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No hay solicitudes en esta categoría</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cuando una empresa certificada revise tus proyectos en el Reverse Board y envíe una propuesta, aparecerá aquí.
            </p>
          </div>
        ) : (
          filteredInbounds.map(inbound => {
            const remainingDays = getRemainingDays(inbound.expiresAt);
            const isPending = inbound.status === 'pending';
            const isAccepted = inbound.status === 'accepted';
            const isDeclined = inbound.status === 'declined';
            const isDecliningThis = decliningId === inbound.id;

            return (
              <div
                key={inbound.id}
                className={`card-clean card-clean-hover rounded-2xl p-6 border transition-all ${
                  isPending 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  
                  {/* Left info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {inbound.jobTitleOffered}
                      </h3>

                      {isPending && (
                        <span className="badge-pastel-amber text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          Pendiente de Respuesta
                        </span>
                      )}

                      {isAccepted && (
                        <span className="badge-pastel-emerald text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Oferta Aceptada · Contacto Desbloqueado</span>
                        </span>
                      )}

                      {isDeclined && (
                        <span className="badge-pastel-rose text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Declinada
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      Empresa: <strong className="text-slate-800 font-semibold">{inbound.companyName}</strong> · 
                      Reclutador: <strong className="text-slate-700">{inbound.recruiterName}</strong> · 
                      Modalidad: <span className="font-medium text-slate-700">{formatModality(inbound.workModality)}</span>
                    </p>

                    {/* Recruiter Pitch Message */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Mensaje de la empresa:</span>
                      <p className="text-xs text-slate-700 leading-relaxed italic">
                        &quot;{inbound.initialPitchMessage}&quot;
                      </p>
                    </div>

                    {/* Stack tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {inbound.stackOffered.map(tech => (
                        <span
                          key={tech}
                          className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white text-slate-700 border border-slate-200 font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right side: Offered Salary & Actions */}
                  <div className="md:w-64 shrink-0 flex flex-col md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    <div className="md:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Oferta Salarial Vinculante</span>
                      <div className="text-xl font-extrabold text-emerald-600">
                        {formatUsd(inbound.offeredSalaryUsd)} <span className="text-xs text-slate-500 font-normal">USD/mes</span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center md:justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Caduca en {remainingDays} días</span>
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                      {isPending && !isDecliningThis && (
                        <>
                          <button
                            onClick={() => acceptInboundRequest(inbound.id)}
                            className="w-full flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aceptar Oferta</span>
                          </button>

                          <button
                            onClick={() => setDecliningId(inbound.id)}
                            className="w-full flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <span>Declinar</span>
                          </button>
                        </>
                      )}

                      {isAccepted && (
                        <Link
                          href="/messages"
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Abrir Chat con Empresa</span>
                        </Link>
                      )}
                    </div>

                    {/* Decline explanation box if active */}
                    {isDecliningThis && (
                      <div className="w-full space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-150">
                        <label className="text-[11px] font-bold text-slate-700 block">Motivo (opcional):</label>
                        <input
                          type="text"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder="Ej: Busco un stack diferente..."
                          className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeclineSubmit(inbound.id)}
                            className="flex-1 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDecliningId(null)}
                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
