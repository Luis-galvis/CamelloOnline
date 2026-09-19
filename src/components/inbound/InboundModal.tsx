'use client';

import { useState } from 'react';
import { 
  X, 
  Send, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  Briefcase 
} from 'lucide-react';
import { CandidateProfile } from '@/types';
import { useAppStore } from '@/lib/store';
import { formatUsd } from '@/lib/utils';

interface InboundModalProps {
  candidate: CandidateProfile;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_STACKS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Go', 'Python', 
  'PostgreSQL', 'Docker', 'Tailwind CSS', 'AWS', 'FastAPI', 'Express'
];

export function InboundModal({ candidate, isOpen = true, onClose, onSuccess }: InboundModalProps) {
  const { createInboundRequest, companies } = useAppStore();
  const verifiedCompany = companies.find(c => c.isVerified) || companies[0];

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [offeredSalary, setOfferedSalary] = useState<number>(candidate.minimumExpectedSalaryUsd + 200);
  const [workModality, setWorkModality] = useState<'remote_worldwide' | 'remote_country' | 'hybrid' | 'on_site'>('remote_worldwide');
  const [selectedStack, setSelectedStack] = useState<string[]>(
    candidate.skills.slice(0, 3).map(s => s.name)
  );
  const [pitchMessage, setPitchMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const candidateDisplayName = candidate.isAnonymous
    ? `Candidato #${candidate.id.slice(0, 5).toUpperCase()}`
    : `${candidate.firstName} ${candidate.lastName}`;

  const isSalaryValid = offeredSalary >= candidate.minimumExpectedSalaryUsd;

  const toggleStack = (tech: string) => {
    if (selectedStack.includes(tech)) {
      setSelectedStack(selectedStack.filter(t => t !== tech));
    } else {
      setSelectedStack([...selectedStack, tech]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!jobTitle.trim()) {
      setError('Por favor indica el título exacto del rol ofertado.');
      return;
    }

    if (!isSalaryValid) {
      setError(`La oferta salarial debe ser igual o mayor a la pretensión mínima del candidato (${formatUsd(candidate.minimumExpectedSalaryUsd)} USD).`);
      return;
    }

    if (!pitchMessage.trim() || pitchMessage.length < 15) {
      setError('El mensaje de pitch debe tener al menos 15 caracteres para explicar por qué su perfil encaja.');
      return;
    }

    if (selectedStack.length === 0) {
      setError('Por favor selecciona al menos una tecnología del stack.');
      return;
    }

    try {
      createInboundRequest({
        candidateId: candidate.id,
        companyId: verifiedCompany.id,
        companyName: verifiedCompany.name,
        companyLogo: verifiedCompany.logoUrl,
        companyDomain: verifiedCompany.domainEmail,
        isCompanyVerified: verifiedCompany.isVerified,
        recruiterId: 'recruiter-current-id',
        recruiterName: 'Talent Acquisition Team',
        jobTitleOffered: jobTitle.trim(),
        jobDescription: jobDescription.trim() || `Oportunidad técnica en ${verifiedCompany.name} para perfil ${jobTitle}.`,
        stackOffered: selectedStack,
        offeredSalaryUsd: Number(offeredSalary),
        currency: 'USD',
        workModality: workModality,
        initialPitchMessage: pitchMessage.trim()
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al enviar la solicitud Inbound.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="badge-pastel-indigo inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Oferta Salarial Vinculante</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Contactar a {candidateDisplayName}
            </h3>
            <p className="text-xs text-slate-500">
              Para desbloquear datos de contacto debes formular una propuesta laboral concreta.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">¡Oferta Inbound Enviada!</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              El candidato ha recibido tu propuesta con la oferta salarial. En cuanto la acepte, se abrirá el canal de mensajería y se desbloquearán sus datos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Candidate salary reference */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="text-xs text-emerald-900 font-semibold">Piso salarial mínimo del candidato:</span>
              <span className="text-sm font-black text-emerald-700">{formatUsd(candidate.minimumExpectedSalaryUsd)} USD/mes</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título de la Vacante Ofertada</label>
              <input
                type="text"
                placeholder="Ej: Junior Backend Developer (Go / Microservices)"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Salario Ofertado (USD Mensual)</label>
                <input
                  type="number"
                  min={candidate.minimumExpectedSalaryUsd}
                  step={50}
                  value={offeredSalary}
                  onChange={(e) => setOfferedSalary(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad de Trabajo</label>
                <select
                  value={workModality}
                  onChange={(e) => setWorkModality(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
                >
                  <option value="remote_worldwide">Remoto Global</option>
                  <option value="remote_country">Remoto País</option>
                  <option value="hybrid">Híbrido</option>
                  <option value="on_site">Presencial</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tecnologías Principales del Rol</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_STACKS.map(tech => {
                  const isSel = selectedStack.includes(tech);
                  return (
                    <button
                      type="button"
                      key={tech}
                      onClick={() => toggleStack(tech)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium border transition-all ${
                        isSel
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tech}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mensaje de Pitch / ¿Por qué su perfil?</label>
              <textarea
                rows={3}
                placeholder="Ej: Nos llamó la atención tu proyecto en GitHub con Next.js y SSE. Tenemos una vacante con mentoría 1 a 1..."
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Oferta Vinculante</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
