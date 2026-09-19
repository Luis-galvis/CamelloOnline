'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Globe, 
  Lock, 
  Unlock, 
  Github, 
  Send, 
  CheckCircle2, 
  FolderGit2,
  X,
  ShieldCheck
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { CandidateProfile } from '@/types';
import { formatUsd, formatSeniority, formatModality, formatEnglish } from '@/lib/utils';
import { InboundModal } from '@/components/inbound/InboundModal';

export default function TalentDirectoryPage() {
  const { candidates } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeniority, setSelectedSeniority] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [maxSalaryFilter, setMaxSalaryFilter] = useState<number>(3500);
  const [selectedSkill, setSelectedSkill] = useState<string>('all');

  const [selectedCandidateForInbound, setSelectedCandidateForInbound] = useState<CandidateProfile | null>(null);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<CandidateProfile | null>(null);

  const filteredCandidates = candidates.filter(c => {
    if (!c.isOpenToWork) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchHeadline = c.headline.toLowerCase().includes(q);
      const matchBio = c.bio?.toLowerCase().includes(q) || false;
      const matchSkill = c.skills.some(s => s.name.toLowerCase().includes(q));
      if (!matchHeadline && !matchBio && !matchSkill) return false;
    }

    if (selectedSeniority !== 'all' && c.seniority !== selectedSeniority) {
      return false;
    }

    if (selectedModality !== 'all' && c.preferredModality !== selectedModality) {
      return false;
    }

    if (c.minimumExpectedSalaryUsd > maxSalaryFilter) {
      return false;
    }

    if (selectedSkill !== 'all') {
      const hasSkill = c.skills.some(s => s.name.toLowerCase() === selectedSkill.toLowerCase());
      if (!hasSkill) return false;
    }

    return true;
  });

  const popularSkills = ['TypeScript', 'React', 'Next.js', 'Go', 'Python', 'PostgreSQL', 'Docker'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen">
      
      {/* Hero Banner for Reverse Board */}
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 border border-slate-200 bg-gradient-to-br from-white via-amber-50/30 to-indigo-50/30 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="badge-pastel-amber inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Reverse Job Board Tech (0 - 2 Años)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Las empresas envían ofertas salariales <span className="text-indigo-600">directas y vinculantes</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Explora talento autodidacta, universitario y graduado de bootcamp con proyectos reales. Para contactar a un candidato debes enviar una propuesta económica estructurada que cumpla o supere su pretensión salarial.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-clean rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por rol, bio o tecnología (ej. React, Go, Docker)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <select
              value={selectedSeniority}
              onChange={(e) => setSelectedSeniority(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="all">Todo el Seniority</option>
              <option value="trainee">Trainee / 0 YoE</option>
              <option value="intern">Internship / Pasantía</option>
              <option value="junior">Junior (0 - 1 año)</option>
              <option value="entry_level">Entry Level (1 - 2 años)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="all">Todas las Modalidades</option>
              <option value="remote_worldwide">Remoto Global</option>
              <option value="remote_country">Remoto País</option>
              <option value="hybrid">Híbrido</option>
              <option value="on_site">Presencial</option>
            </select>
          </div>

        </div>

        {/* Skill Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium mr-1">Skills populares:</span>
          <button
            onClick={() => setSelectedSkill('all')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedSkill === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          {popularSkills.map(skill => (
            <button
              key={skill}
              onClick={() => setSelectedSkill(selectedSkill === skill ? 'all' : skill)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedSkill === skill
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>{filteredCandidates.length} candidatos junior disponibles en el Reverse Board</span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pretensiones salariales públicas y garantizadas</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map(candidate => {
            const displayName = candidate.isAnonymous 
              ? `${candidate.headline.split('|')[0].trim()} · ID #${candidate.id.slice(-4)}`
              : `${candidate.firstName} ${candidate.lastName}`;

            return (
              <div
                key={candidate.id}
                className="card-clean card-clean-hover rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-5"
              >
                {/* Top Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {candidate.firstName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {displayName}
                        </h3>
                        <p className="text-[11px] text-indigo-600 font-semibold">
                          {formatSeniority(candidate.seniority)} · {candidate.yearsOfExperience} YoE
                        </p>
                      </div>
                    </div>

                    {candidate.isAnonymous ? (
                      <span className="badge-pastel-indigo text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" title="Datos de contacto protegidos">
                        <Lock className="w-3 h-3" />
                        <span>Anónimo</span>
                      </span>
                    ) : (
                      <span className="badge-pastel-emerald text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Unlock className="w-3 h-3" />
                        <span>Público</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-800 leading-snug">
                    {candidate.headline}
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {candidate.bio}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {candidate.skills.slice(0, 5).map(skill => (
                      <span
                        key={skill.id}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                          skill.isPrimary 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom: Minimum salary & Inbound button */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Piso Salarial Mínimo</span>
                      <span className="text-base font-extrabold text-emerald-600">
                        {formatUsd(candidate.minimumExpectedSalaryUsd)} <span className="text-xs text-slate-500 font-normal">USD/mes</span>
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{formatModality(candidate.preferredModality)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCandidateDetail(candidate)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Ver Proyectos ({candidate.projects.length})
                    </button>

                    <button
                      onClick={() => setSelectedCandidateForInbound(candidate)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Oferta</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Projects Detail Modal */}
      {selectedCandidateDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedCandidateDetail.isAnonymous 
                    ? `Proyectos del Candidato · ID #${selectedCandidateDetail.id.slice(-4)}`
                    : `${selectedCandidateDetail.firstName} ${selectedCandidateDetail.lastName}`}
                </h3>
                <p className="text-xs text-slate-500">{selectedCandidateDetail.headline}</p>
              </div>
              <button
                onClick={() => setSelectedCandidateDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Repositorios & Proyectos Destacados</h4>
              
              {selectedCandidateDetail.projects.map(proj => (
                <div key={proj.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-indigo-600" />
                      <span>{proj.title}</span>
                    </h5>
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Ver Código</span>
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.technologiesUsed.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedCandidateDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const cand = selectedCandidateDetail;
                  setSelectedCandidateDetail(null);
                  setSelectedCandidateForInbound(cand);
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Oferta Salarial</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Inbound Offer Modal */}
      {selectedCandidateForInbound && (
        <InboundModal
          candidate={selectedCandidateForInbound}
          onClose={() => setSelectedCandidateForInbound(null)}
        />
      )}

    </div>
  );
}
