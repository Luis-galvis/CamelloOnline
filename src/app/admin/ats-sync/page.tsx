'use client';

import { useState } from 'react';
import { 
  Globe, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Mail, 
  ExternalLink, 
  Sparkles,
  RefreshCw,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { 
  evaluateJobEligibility, 
  isEligibleJuniorTechJob, 
  detectSeniority, 
  detectModality, 
  extractSkills, 
  RawAtsJob 
} from '@/lib/services/ats-ingestion';
import { sendRecruiterOutreach, buildOutreachEmailHtml } from '@/lib/services/outreach';

const DEMO_ATS_TARGETS = [
  {
    companyName: 'Brex',
    ats: 'greenhouse',
    domain: 'brex.com',
    mockJobs: [
      { id: '1', title: 'Associate Software Engineer (Early Career)', content: 'We are seeking an associate software engineer with 0-2 years of experience or bootcamp graduates. You will write Go & TypeScript.' },
      { id: '2', title: 'Senior Staff Infrastructure Architect', content: 'Minimum 10+ years of experience in distributed systems. Lead our global architecture.' },
      { id: '3', title: 'Junior Frontend Developer - Intern 2026', content: 'Summer internship for computer science students. React, Next.js and Tailwind.' }
    ]
  },
  {
    companyName: 'Vercel',
    ats: 'lever',
    domain: 'vercel.com',
    mockJobs: [
      { id: '101', title: 'Junior Web Developer (Design Systems)', content: 'Build accessible UI components in React and Next.js. 1 year experience required.' },
      { id: '102', title: 'Engineering Director - Platform', content: 'Lead our platform organization of 40+ engineers. 8+ years leadership experience.' }
    ]
  }
];

export default function AtsSyncAdminPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [ingestedJobs, setIngestedJobs] = useState<RawAtsJob[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [previewEmailJob, setPreviewEmailJob] = useState<RawAtsJob | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleRunPipeline = () => {
    setIsRunning(true);
    setLogs([]);
    setIngestedJobs([]);
    addLog('Iniciando Pipeline de Ingesta ATS & Filtrado Semántico...');

    setTimeout(() => {
      const results: RawAtsJob[] = [];

      DEMO_ATS_TARGETS.forEach(target => {
        addLog(`Analizando tablero público de ${target.companyName} (${target.ats.toUpperCase()})...`);
        
        target.mockJobs.forEach(raw => {
          const evalResult = evaluateJobEligibility(raw.title, raw.content);
          if (evalResult.isEligible) {
            addLog(`✅ VACANTE DETECTADA (Nicho Junior Tech - ${evalResult.maxYearsExperienceRequired} YoE máx, 0-YoE: ${evalResult.isZeroExperience}): "${raw.title}"`);
            results.push({
              sourceAts: target.ats as any,
              sourceJobId: raw.id,
              sourceUrl: `https://boards.${target.ats}.io/${target.companyName.toLowerCase()}/jobs/${raw.id}`,
              companyName: target.companyName,
              companyDomain: target.domain,
              title: raw.title,
              descriptionHtml: raw.content,
              location: 'Remote',
              workModality: 'remote_worldwide',
              seniority: evalResult.seniority,
              maxYearsExperienceRequired: evalResult.maxYearsExperienceRequired,
              isZeroExperience: evalResult.isZeroExperience,
              salaryMinUsd: 1400,
              salaryMaxUsd: 2200,
              detectedSkills: extractSkills(`${raw.title} ${raw.content}`)
            });
          } else {
            addLog(`⛔ DESCARTADA (${evalResult.rejectionReason || 'Fuera de nicho'}): "${raw.title}"`);
          }
        });
      });

      setIngestedJobs(results);
      addLog(`Pipeline finalizado. ${results.length} vacantes junior ingresadas.`);
      setIsRunning(false);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-bold uppercase tracking-wider mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Automatización & Ingesta</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Pipeline de Ingesta ATS & Outreach Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Prueba en vivo el motor de scraping, filtrado semántico regex (0-2 años) y generación de Magic Links de reclamo.
          </p>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={isRunning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-accent-cyan to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-dark-950 shadow-glow transition-all"
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isRunning ? 'Ejecutando Pipeline...' : 'Ejecutar Ingesta ATS'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Terminal Logs */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Terminal className="w-4 h-4 text-accent-cyan" />
              Consola del Pipeline
            </span>
            <span className="text-[10px] text-slate-500">Live Execution</span>
          </div>

          <div className="flex-1 overflow-y-auto bg-dark-950/80 rounded-xl p-3 font-mono text-xs text-slate-300 space-y-1">
            {logs.length === 0 ? (
              <p className="text-slate-600">Presiona &quot;Ejecutar Ingesta ATS&quot; para iniciar la simulación...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className={log.includes('✅') ? 'text-accent-emerald' : log.includes('⛔') ? 'text-accent-rose' : 'text-slate-300'}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Filtered Jobs Preview */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Filter className="w-4 h-4 text-accent-emerald" />
              Vacantes Junior Capturadas ({ingestedJobs.length})
            </span>
            <span className="text-[10px] text-accent-emerald font-bold">100% Junior Tech</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {ingestedJobs.length === 0 ? (
              <div className="text-center p-8 text-xs text-slate-500">
                Ninguna vacante capturada aún.
              </div>
            ) : (
              ingestedJobs.map(job => (
                <div key={job.sourceJobId} className="p-3.5 rounded-xl bg-dark-850 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{job.title}</span>
                    <span className="text-[10px] uppercase font-bold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded">
                      {job.sourceAts}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px]">
                    Empresa: <strong className="text-slate-200">{job.companyName}</strong> · Seniority: <strong className="text-accent-cyan">{job.seniority}</strong>
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {job.detectedSkills.map((s: string) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-900 text-slate-300 border border-white/5">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-accent-emerald font-bold">${job.salaryMinUsd} - ${job.salaryMaxUsd} USD</span>
                    <button
                      onClick={() => setPreviewEmailJob(job)}
                      className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Ver Email de Outreach</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Email Preview Modal */}
      {previewEmailJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-dark-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent-cyan" />
                Simulación de Email de Outreach a {previewEmailJob.companyName}
              </h3>
              <button onClick={() => setPreviewEmailJob(null)} className="text-slate-400 hover:text-white text-xs">
                Cerrar
              </button>
            </div>

            <div className="p-4 rounded-xl bg-dark-950 text-xs text-slate-300 space-y-2">
              <p><strong>Para:</strong> recruiting@{previewEmailJob.companyDomain}</p>
              <p><strong>Asunto:</strong> Publicamos su vacante de {previewEmailJob.title} en CamelloOnline (Bolsa de Empleo Colombia)</p>
              <p className="border-t border-white/10 pt-2 text-slate-400">
                Hola equipo de {previewEmailJob.companyName}, destacamos su búsqueda sin costo para talento evaluado en Colombia.
              </p>
              <p className="text-accent-cyan font-semibold">
                Enlace directo: https://camelloonline.com
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
