'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Globe, 
  ArrowUpDown, 
  Layers, 
  Headphones, 
  BadgePercent, 
  Megaphone, 
  FileText, 
  Users2, 
  Calculator, 
  PenTool, 
  RotateCcw,
  Lock
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import rawGeneralRemoteJobs from '@/lib/scraped-colombia-remote-general.json';
import { detectContractType } from '@/lib/services/scrapers/contract-detector';
import { detectNonTechCategory } from '@/lib/services/scrapers/non-tech-remote-colombia';
import { detectExperience } from '@/lib/services/scrapers/experience-detector';
import { detectEnglishRequirement } from '@/lib/services/scrapers/english-detector';
import { extractApplicantCount } from '@/lib/services/scrapers/applicant-extractor';

type SortOption = 'newest' | 'oldest' | 'highest_salary' | 'lowest_salary' | 'zero_exp_first';
type NonTechCategoryFilter = 'all' | 'customer_service' | 'sales_commercial' | 'marketing_digital' | 'virtual_assistant_ops' | 'hr_recruiting' | 'finance_accounting' | 'writing_content';
type ExperienceFilter = 'all' | 'zero_exp' | 'six_months' | 'one_year' | 'two_to_three' | 'three_to_four' | 'more_than_five';
type ContractFilter = 'all' | 'indefinido' | 'fijo' | 'aprendizaje' | 'prestacion_servicios' | 'obra_labor';
type LanguageFilter = 'all' | 'spanish_only' | 'requires_english';
type SalaryFilter = 'all' | 'disclosed_only';
type ApplicantTierFilter = 'all' | 'low' | 'medium' | 'high';

const NON_TECH_CATEGORIES = [
  { id: 'all', label: 'Todas las áreas', icon: Layers },
  { id: 'customer_service', label: '🎧 Atención al Cliente', icon: Headphones },
  { id: 'sales_commercial', label: '📈 Ventas & Comercial', icon: BadgePercent },
  { id: 'marketing_digital', label: '📢 Marketing Digital', icon: Megaphone },
  { id: 'virtual_assistant_ops', label: '💼 Asistentes & Operaciones', icon: FileText },
  { id: 'hr_recruiting', label: '👥 Recursos Humanos', icon: Users2 },
  { id: 'finance_accounting', label: '💰 Finanzas & Contabilidad', icon: Calculator },
  { id: 'writing_content', label: '✍️ Redacción & Contenido', icon: PenTool },
];

export function ColombiaGeneralRemoteBoard() {
  const { user, openAuthModal, signInWithGoogle } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NonTechCategoryFilter>('all');
  const [selectedExp, setSelectedExp] = useState<ExperienceFilter>('all');
  const [selectedContract, setSelectedContract] = useState<ContractFilter>('all');
  const [selectedLang, setSelectedLang] = useState<LanguageFilter>('all');
  const [selectedSalary, setSelectedSalary] = useState<SalaryFilter>('all');
  const [selectedApplicantTier, setSelectedApplicantTier] = useState<ApplicantTierFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [displayCount, setDisplayCount] = useState<number>(24);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  // Parse raw JSON into rich job entities
  const allRemoteJobs = useMemo(() => {
    return (rawGeneralRemoteJobs as any[])
      .filter((job) => {
        if (job.postedDateText) {
          const pL = job.postedDateText.toLowerCase();
          if (pL.includes('mes') || pL.includes('month') || pL.includes('año') || pL.includes('year')) {
            return false;
          }
        }
        const dateStr = job.scrapedAt || job.postedAt;
        if (dateStr) {
          const jobTime = new Date(dateStr).getTime();
          const ageDays = (Date.now() - jobTime) / (1000 * 60 * 60 * 24);
          if (ageDays > 21) return false;
        }
        return true;
      })
      .map((job, idx) => {
        const contractRes = detectContractType(job.title, job.description || '', '');
        const nonTechCat = detectNonTechCategory(job.title, job.description || '');
        const expRes = detectExperience(job.title, job.description || '');
        const engRes = detectEnglishRequirement(job.title, `${job.description || ''} ${job.companyName || ''}`);
        const appRes = extractApplicantCount(job.description || '', `${job.title} ${job.companyName}`);

        return {
          ...job,
          id: job.id || `remote-nt-${idx}`,
          contractType: contractRes.contractType,
          contractTypeLabel: contractRes.contractTypeLabel,
          category: nonTechCat.category,
          categoryLabel: nonTechCat.categoryLabel,
          isZeroExperience: expRes.isZeroExperience,
          maxYearsExperience: expRes.isZeroExperience ? 0 : expRes.maxYearsExperience,
          experienceTier: job.experienceTier || expRes.experienceTier,
          experienceLabel: job.experienceLabel || expRes.experienceLabel,
          seniority: expRes.seniority,
          requiresEnglish: engRes.requiresEnglish,
          englishBadgeText: engRes.badgeText,
          applicantCountText: job.applicantCountText || appRes.applicantCountText,
          applicantTier: job.applicantTier || appRes.applicantTier
        };
      });
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allRemoteJobs.length };
    for (const j of allRemoteJobs) {
      counts[j.category] = (counts[j.category] || 0) + 1;
    }
    return counts;
  }, [allRemoteJobs]);

  const zeroExpTotal = allRemoteJobs.filter(j => j.isZeroExperience).length;
  const spanishTotal = allRemoteJobs.filter(j => !j.requiresEnglish).length;
  const withSalaryTotal = allRemoteJobs.filter(j => j.salaryDisclosed).length;

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return allRemoteJobs.filter((job) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (job.title || '').toLowerCase().includes(q);
        const matchesComp = (job.companyName || '').toLowerCase().includes(q);
        const matchesDesc = (job.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesComp && !matchesDesc) return false;
      }

      // Category
      if (selectedCategory !== 'all' && job.category !== selectedCategory) {
        return false;
      }

      // Experience Granular
      if (selectedExp !== 'all') {
        const tier = job.experienceTier || (job.isZeroExperience ? 'zero_exp' : job.maxYearsExperience <= 0.7 ? 'six_months' : job.maxYearsExperience <= 1.5 ? 'one_year' : job.maxYearsExperience <= 3.0 ? 'two_to_three' : job.maxYearsExperience <= 4.5 ? 'three_to_four' : 'more_than_five');
        if (tier !== selectedExp) return false;
      }

      // Contract
      if (selectedContract !== 'all' && job.contractType !== selectedContract) return false;

      // Language
      if (selectedLang === 'spanish_only' && job.requiresEnglish) return false;
      if (selectedLang === 'requires_english' && !job.requiresEnglish) return false;

      // Salary
      if (selectedSalary === 'disclosed_only' && !job.salaryDisclosed) return false;

      // Applicant tier
      if (selectedApplicantTier !== 'all') {
        const tier = job.applicantTier || 'low';
        if (selectedApplicantTier !== tier) return false;
      }

      return true;
    }).sort((a, b) => {
      const getAgeHours = (j: any): number => {
        const pText = (j.postedDateText || '').toLowerCase();
        const numMatch = pText.match(/\d+/);
        const n = numMatch ? parseInt(numMatch[0], 10) : 1;

        if (pText.includes('min')) return n / 60;
        if (pText.includes('hora') || pText.includes('hour')) return n;
        if (pText.includes('hoy') || pText.includes('today') || pText.includes('just now')) return 2;
        if (pText.includes('ayer') || pText.includes('yesterday')) return 24;
        if (pText.includes('d[ií]a') || pText.includes('dia') || pText.includes('day')) return n * 24;
        if (pText.includes('semana') || pText.includes('week')) return n * 7 * 24;
        if (pText.includes('mes') || pText.includes('month')) return n * 30 * 24;

        const dt = new Date(j.createdAt || j.scrapedAt).getTime();
        if (!isNaN(dt) && dt > 0) {
          const diff = (Date.now() - dt) / 3600000;
          return diff >= 0 ? diff : 24;
        }
        return 48;
      };

      if (sortBy === 'zero_exp_first') {
        if (a.isZeroExperience && !b.isZeroExperience) return -1;
        if (!a.isZeroExperience && b.isZeroExperience) return 1;
        return getAgeHours(a) - getAgeHours(b);
      }
      if (sortBy === 'highest_salary') {
        return (b.salaryMaxUsdEquivalent || 0) - (a.salaryMaxUsdEquivalent || 0);
      }
      if (sortBy === 'lowest_salary') {
        return (a.salaryMinUsdEquivalent || 99999) - (b.salaryMinUsdEquivalent || 99999);
      }
      if (sortBy === 'oldest') {
        const ageA = getAgeHours(a);
        const ageB = getAgeHours(b);
        if (Math.abs(ageA - ageB) > 0.1) return ageB - ageA;
        return new Date(a.createdAt || a.scrapedAt || 0).getTime() - new Date(b.createdAt || b.scrapedAt || 0).getTime();
      }
      // newest
      const ageA = getAgeHours(a);
      const ageB = getAgeHours(b);
      if (Math.abs(ageA - ageB) > 0.1) return ageA - ageB;
      return new Date(b.createdAt || b.scrapedAt || 0).getTime() - new Date(a.createdAt || a.scrapedAt || 0).getTime();
    });
  }, [allRemoteJobs, searchQuery, selectedCategory, selectedExp, selectedContract, selectedLang, selectedSalary, selectedApplicantTier, sortBy]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedExp('all');
    setSelectedContract('all');
    setSelectedLang('all');
    setSelectedSalary('all');
    setSelectedApplicantTier('all');
    setSortBy('newest');
  };

  const hasActiveFilters = 
    searchQuery || selectedCategory !== 'all' || selectedExp !== 'all' || 
    selectedContract !== 'all' || selectedLang !== 'all' || selectedSalary !== 'all' || 
    selectedApplicantTier !== 'all' || sortBy !== 'newest';

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Globe className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4 border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            100% Remoto en Colombia · Sin Código / No-Tech
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Empleos Remotos en Colombia (No-Tech)
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-300 leading-relaxed">
            Vacantes 100% remotas verificadas para trabajar desde cualquier ciudad de Colombia en 
            <strong className="text-white"> Atención al Cliente, Ventas, Marketing Digital, Asistentes Virtuales, Recursos Humanos y Finanzas</strong>.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{allRemoteJobs.length} ofertas remotas</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>{zeroExpTotal} sin experiencia previa</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 font-medium">
              <span>🇨🇴 {spanishTotal} en Español</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Search & Category Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        
        {/* Search Bar & Sorter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar cargo no-tech (ej. Asesor Comercial, Customer Support, Asistente Virtual, Community Manager)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-8 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="newest">Más recientes primero</option>
                <option value="oldest">Más antiguas primero</option>
                <option value="highest_salary">Mayor salario primero</option>
                <option value="lowest_salary">Menor salario primero</option>
                <option value="zero_exp_first">0 Años / Sin Experiencia primero</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Restablecer todos los filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Carousel / Quick Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {NON_TECH_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as NonTechCategoryFilter)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detailed Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          
          {/* Experience Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Experiencia</label>
            <select
              value={selectedExp}
              onChange={(e) => setSelectedExp(e.target.value as ExperienceFilter)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Cualquier experiencia</option>
              <option value="zero_exp">0 Años (Sin experiencia / Trainee)</option>
              <option value="six_months">6 Meses de experiencia</option>
              <option value="one_year">1 Año de experiencia</option>
              <option value="two_to_three">2 a 3 Años de experiencia</option>
              <option value="three_to_four">3 a 4 Años de experiencia</option>
              <option value="more_than_five">Más de 5 Años de experiencia</option>
            </select>
          </div>

          {/* Contract Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tipo de Contrato</label>
            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value as ContractFilter)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Todos los contratos</option>
              <option value="indefinido">Término Indefinido</option>
              <option value="fijo">Término Fijo</option>
              <option value="aprendizaje">Aprendizaje / Prácticas</option>
              <option value="prestacion_servicios">Prestación de Servicios</option>
              <option value="obra_labor">Obra o Labor</option>
            </select>
          </div>

          {/* Postulaciones / Demanda */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Postulaciones</label>
            <select
              value={selectedApplicantTier}
              onChange={(e) => setSelectedApplicantTier(e.target.value as ApplicantTierFilter)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Todas las solicitudes</option>
              <option value="low">⚡ &lt; 25 solicitudes (Poca comp.)</option>
              <option value="medium">👥 25 a 100 postulaciones</option>
              <option value="high">🔥 &gt; 100 postulaciones</option>
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Idioma</label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as LanguageFilter)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Todos los idiomas</option>
              <option value="spanish_only">Español (Sin inglés)</option>
              <option value="requires_english">Requiere inglés</option>
            </select>
          </div>

          {/* Salary Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Salario</label>
            <select
              value={selectedSalary}
              onChange={(e) => setSelectedSalary(e.target.value as SalaryFilter)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Todos los salarios</option>
              <option value="disclosed_only">Solo con salario visible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Meta Header */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <span className="font-semibold text-slate-800">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'oferta remota encontrada' : 'ofertas remotas encontradas'}
        </span>
        <span className="text-slate-400">
          Mostrando ofertas publicadas hace menos de 3 semanas
        </span>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">No se encontraron ofertas con estos filtros</h3>
            <p className="text-slate-500 text-xs mt-1">Prueba restableciendo los filtros o buscando con otros términos.</p>
          </div>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.slice(0, displayCount).map((job) => (
              <div 
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Header: Company & Location */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                        {job.companyName?.slice(0, 2).toUpperCase() || 'EM'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {job.companyName}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>100% Remoto (Colombia)</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      {job.categoryLabel || 'Remoto'}
                    </span>
                  </div>

                  {/* Badges Strip */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-medium">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      {job.contractTypeLabel || 'Término Indefinido'}
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      100% Remoto
                    </span>

                    {/* Experience Badge */}
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {job.experienceLabel || (job.isZeroExperience ? 'Sin experiencia previa' : `${job.maxYearsExperience || 1} años de exp`)}
                    </span>

                    {/* English Badge */}
                    <span className={`px-2 py-0.5 rounded-md font-semibold ${
                      job.requiresEnglish 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {job.requiresEnglish ? '🇬🇧 Requiere inglés' : '🇨🇴 Español'}
                    </span>

                    {/* Verified Applicant Count Badge */}
                    {job.applicantCountText && (
                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                        job.applicantTier === 'low' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {job.applicantCountText}
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {job.postedDateText || 'Reciente'}
                    </span>
                  </div>

                  {/* Job Title */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-800 transition-colors">
                      {job.title}
                    </h3>
                  </div>

                  {/* Salary Snippet */}
                  <div className="text-xs">
                    {job.salaryDisclosed ? (
                      <div className="font-bold text-emerald-700 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{job.salaryDisplayText}</span>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[11px]">
                        Salario: No especificado en la oferta
                      </div>
                    )}
                  </div>

                  {/* Brief description */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer py-1 px-2"
                  >
                    Ver detalle
                  </button>

                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Postularme</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Subtle Candidate Visibility Banner */}
          {!user && (
            <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-teal-900/90 via-slate-900/95 to-emerald-950/90 text-white border border-emerald-500/30 shadow-lg flex flex-col md:flex-row items-center justify-between gap-5 my-6 backdrop-blur-sm">
              <div className="flex items-center gap-4 text-left">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/20">
                      Trabajo Remoto & Empresas
                    </span>
                    <span className="text-xs text-slate-400 font-medium">100% Opcional & Gratuito</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    ¿Quieres que te ayudemos a tener más visibilidad con empresas remotas?
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Regístrate gratis para que startups y empresas internacionales puedan ver tu CV y considerarte para vacantes sin intermediarios.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Destacar con Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Crear Perfil Gratis
                </button>
              </div>
            </div>
          )}

          {/* Load More Pagination */}
          {filteredJobs.length > displayCount && (
            <div className="text-center pt-4 pb-2">
              <button
                onClick={() => setDisplayCount(prev => prev + 24)}
                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700 font-semibold text-xs shadow-xs transition-all cursor-pointer"
              >
                Cargar más ofertas remotas (+24) · Mostrando {Math.min(displayCount, filteredJobs.length)} de {filteredJobs.length}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Detail View */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {selectedJob.categoryLabel || 'Remoto Colombia'}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1.5">
                  {selectedJob.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedJob.companyName} · 🏠 100% Remoto (Colombia)
                </p>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                100% Remoto
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                {selectedJob.contractTypeLabel || 'Término Indefinido'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                {selectedJob.experienceLabel || (selectedJob.isZeroExperience ? 'Sin experiencia previa' : `${selectedJob.maxYearsExperience || 1} años de experiencia`)}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                {selectedJob.requiresEnglish ? 'Requiere inglés' : 'Español (No requiere inglés)'}
              </span>
              {selectedJob.applicantCountText && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                  {selectedJob.applicantCountText}
                </span>
              )}
            </div>

            {/* Salary info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Compensación / Salario</div>
              <div className="text-sm font-extrabold text-emerald-700 mt-0.5">
                {selectedJob.salaryDisclosed ? selectedJob.salaryDisplayText : 'Salario acorde al mercado / no especificado en la oferta inicial'}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Descripción del Empleo</h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {selectedJob.description}
              </p>
            </div>

            {/* Footer action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cerrar
              </button>
              <a
                href={selectedJob.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <span>Ir a la postulación</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
