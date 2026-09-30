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
import { useAppStore } from '@/lib/store';
import rawColombiaJobs from '@/lib/scraped-colombia-jobs.json';
import { detectContractType, getContractTypeLabel } from '@/lib/services/scrapers/contract-detector';
import { detectNonTechCategory } from '@/lib/services/scrapers/non-tech-remote-colombia';
import { detectExperience } from '@/lib/services/scrapers/experience-detector';
import { detectEnglishRequirement } from '@/lib/services/scrapers/english-detector';
import { extractApplicantCount } from '@/lib/services/scrapers/applicant-extractor';
import { calculateJobAgeHours } from '@/lib/services/scrapers/date-extractor';
import { JobPostingJsonLd } from '@/components/seo/JsonLdSchemas';

type SortOption = 'newest' | 'oldest' | 'highest_salary' | 'lowest_salary' | 'zero_exp_first';
type NonTechCategoryFilter = 'all' | 'customer_service' | 'sales_commercial' | 'marketing_digital' | 'virtual_assistant_ops' | 'hr_recruiting' | 'finance_accounting' | 'writing_content';
type ExperienceFilter = 'all' | 'zero_exp' | 'six_months' | 'one_year' | 'two_to_three' | 'three_to_four' | 'more_than_five';
type ContractFilter = 'all' | 'indefinido' | 'fijo' | 'aprendizaje' | 'prestacion_servicios' | 'obra_labor' | 'no_especificado';
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

type LocationFilter = 'all' | 'remoto' | 'bogota' | 'medellin' | 'cali' | 'barranquilla' | 'bucaramanga' | 'ibague' | 'eje_cafetero';
type ModalityFilter = 'all' | 'remote' | 'hybrid' | 'on_site';

export function ColombiaGeneralRemoteBoard() {
  const { user, openAuthModal, signInWithGoogle } = useAuth();
  const { jobs: storeJobs, appliedJobIds, viewedJobIds, markJobAsViewed } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NonTechCategoryFilter>('all');
  const [selectedLocation, setSelectedLocation] = useState<LocationFilter>('all');
  const [selectedModality, setSelectedModality] = useState<ModalityFilter>('all');
  const [selectedExp, setSelectedExp] = useState<ExperienceFilter>('all');
  const [selectedContract, setSelectedContract] = useState<ContractFilter>('all');
  const [selectedLang, setSelectedLang] = useState<LanguageFilter>('all');
  const [selectedSalary, setSelectedSalary] = useState<SalaryFilter>('all');
  const [selectedApplicantTier, setSelectedApplicantTier] = useState<ApplicantTierFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [displayCount, setDisplayCount] = useState<number>(24);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  // Parse live jobs into rich job entities
  const allRemoteJobs = useMemo(() => {
    const sourceList = storeJobs && storeJobs.length > 0 ? storeJobs : (rawColombiaJobs as any[]);
    const TECH_CATEGORIES = new Set(['software_dev', 'data_ai', 'qa_testing', 'it_support', 'ui_ux_product']);

    return sourceList
      .filter((job) => {
        // Exclude purely software developer roles to keep non-tech remote clean
        const isTechDev = job.category && TECH_CATEGORIES.has(job.category) && 
          /developer|software|ingeniero|devops|fullstack|frontend|backend|programad/i.test(job.title || '');
        if (isTechDev) return false;

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
          contractType: job.contractType || contractRes.contractType,
          contractTypeLabel: job.contractTypeLabel || contractRes.contractTypeLabel,
          category: nonTechCat.category,
          categoryLabel: nonTechCat.categoryLabel,
          isZeroExperience: expRes.isZeroExperience,
          maxYearsExperience: expRes.maxYearsExperience,
          experienceTier: expRes.experienceTier,
          experienceLabel: expRes.experienceLabel,
          seniority: expRes.seniority,
          requiresEnglish: job.requiresEnglish ?? engRes.requiresEnglish,
          englishBadgeText: job.englishBadgeText || engRes.badgeText,
          applicantCountText: job.applicantCountText || appRes.applicantCountText,
          applicantTier: job.applicantTier || appRes.applicantTier
        };
      });
  }, [storeJobs]);

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
      const loc = ((job.displayLocation || '') + ' ' + (job.locationCity || '')).toLowerCase();
      const isRem = job.isRemote || (job.workModality === 'remote_country' || job.workModality === 'remote_worldwide') || loc.includes('remoto');

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

      // Location
      if (selectedLocation === 'remoto' && !isRem) return false;
      if (selectedLocation === 'bogota' && !loc.includes('bogot')) return false;
      if (selectedLocation === 'medellin' && !loc.includes('medell')) return false;
      if (selectedLocation === 'cali' && !loc.includes('cali')) return false;
      if (selectedLocation === 'barranquilla' && !loc.includes('barranquilla')) return false;
      if (selectedLocation === 'bucaramanga' && !loc.includes('bucaramanga')) return false;
      if (selectedLocation === 'ibague' && !loc.includes('ibag') && !loc.includes('tolima')) return false;
      if (selectedLocation === 'eje_cafetero' && !loc.includes('pereira') && !loc.includes('manizales') && !loc.includes('armenia')) return false;

      // Modality
      if (selectedModality === 'remote' && !isRem) return false;
      if (selectedModality === 'hybrid' && (isRem || job.workModality !== 'hybrid')) return false;
      if (selectedModality === 'on_site' && (isRem || job.workModality === 'hybrid')) return false;

      // Experience Granular
      if (selectedExp !== 'all') {
        if (selectedExp === 'zero_exp') {
          if (!job.isZeroExperience) return false;
        } else {
          const tier = job.experienceTier || detectExperience(job.title, job.description || '').experienceTier;
          if (tier !== selectedExp) return false;
        }
      }

      // Contract
      if (selectedContract !== 'all') {
        const cType = job.contractType || detectContractType(job.title, job.description || '').contractType;
        if (selectedContract === 'indefinido') {
          if (cType !== 'indefinido') return false;
        } else if (selectedContract === 'no_especificado') {
          if (cType !== 'no_especificado') return false;
        } else {
          if (selectedContract !== cType) return false;
        }
      }

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
      if (sortBy === 'zero_exp_first') {
        if (a.isZeroExperience && !b.isZeroExperience) return -1;
        if (!a.isZeroExperience && b.isZeroExperience) return 1;
        return calculateJobAgeHours(a.postedDateText, a.createdAt || a.scrapedAt) - calculateJobAgeHours(b.postedDateText, b.createdAt || b.scrapedAt);
      }
      if (sortBy === 'highest_salary') {
        return (b.salaryMaxUsdEquivalent || 0) - (a.salaryMaxUsdEquivalent || 0);
      }
      if (sortBy === 'lowest_salary') {
        return (a.salaryMinUsdEquivalent || 99999) - (b.salaryMinUsdEquivalent || 99999);
      }
      if (sortBy === 'oldest') {
        const ageA = calculateJobAgeHours(a.postedDateText, a.createdAt || a.scrapedAt);
        const ageB = calculateJobAgeHours(b.postedDateText, b.createdAt || b.scrapedAt);
        if (Math.abs(ageA - ageB) > 0.1) return ageB - ageA;
        return new Date(a.createdAt || a.scrapedAt || 0).getTime() - new Date(b.createdAt || b.scrapedAt || 0).getTime();
      }
      // newest
      const ageA = calculateJobAgeHours(a.postedDateText, a.createdAt || a.scrapedAt);
      const ageB = calculateJobAgeHours(b.postedDateText, b.createdAt || b.scrapedAt);
      if (Math.abs(ageA - ageB) > 0.1) return ageA - ageB;
      return new Date(b.createdAt || b.scrapedAt || 0).getTime() - new Date(a.createdAt || a.scrapedAt || 0).getTime();
    });
  }, [allRemoteJobs, searchQuery, selectedCategory, selectedLocation, selectedModality, selectedExp, selectedContract, selectedLang, selectedSalary, selectedApplicantTier, sortBy]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedModality('all');
    setSelectedExp('all');
    setSelectedContract('all');
    setSelectedLang('all');
    setSelectedSalary('all');
    setSelectedApplicantTier('all');
    setSortBy('newest');
  };

  const hasActiveFilters = 
    searchQuery || selectedCategory !== 'all' || selectedLocation !== 'all' || selectedModality !== 'all' || selectedExp !== 'all' || 
    selectedContract !== 'all' || selectedLang !== 'all' || selectedSalary !== 'all' || 
    selectedApplicantTier !== 'all' || sortBy !== 'newest';

  return (
    <div className="space-y-6 pt-2">
      <JobPostingJsonLd jobs={filteredJobs} />

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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          
          {/* Ubicación */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ubicación</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value as LocationFilter)}
              className={`w-full py-1.5 px-2.5 border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                selectedLocation !== 'all' ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="all">Toda Colombia</option>
              <option value="remoto">100% Remoto</option>
              <option value="bogota">Bogotá, D.C.</option>
              <option value="medellin">Medellín</option>
              <option value="cali">Cali</option>
              <option value="barranquilla">Barranquilla</option>
              <option value="bucaramanga">Bucaramanga</option>
              <option value="ibague">Ibagué / Tolima</option>
              <option value="eje_cafetero">Eje Cafetero</option>
            </select>
          </div>

          {/* Modalidad */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Modalidad</label>
            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value as ModalityFilter)}
              className={`w-full py-1.5 px-2.5 border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                selectedModality !== 'all' ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="all">Todas modalidades</option>
              <option value="remote">100% Remoto</option>
              <option value="hybrid">Híbrido</option>
              <option value="on_site">Presencial</option>
            </select>
          </div>

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
              className={`w-full py-1.5 px-2.5 border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                selectedContract !== 'all' ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="all">Todos los contratos</option>
              <option value="indefinido">Término Indefinido</option>
              <option value="fijo">Término Fijo</option>
              <option value="obra_labor">Obra o Labor</option>
              <option value="prestacion_servicios">Prestación de Servicios</option>
              <option value="aprendizaje">Aprendizaje / Prácticas</option>
              <option value="no_especificado">A convenir / No especificado</option>
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
            {filteredJobs.slice(0, displayCount).map((job) => {
              const isApplied = appliedJobIds?.includes(job.id);
              const isViewed = viewedJobIds?.includes(job.id);

              return (
                <div 
                  key={job.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between group ${
                    isApplied
                      ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400 hover:shadow-md'
                      : isViewed
                      ? 'border-emerald-200/90 bg-emerald-50/25 hover:border-emerald-300 hover:shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Company & Location */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 shadow-xs ${
                          isApplied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                        }`}>
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isApplied ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Postulado</span>
                          </span>
                        ) : isViewed ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Revisada</span>
                          </span>
                        ) : null}

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {job.categoryLabel || 'Remoto'}
                        </span>
                      </div>
                    </div>

                    {/* Badges Strip */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        {job.contractTypeLabel || 'A convenir / No especificado'}
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
                      <h3 
                        onClick={() => {
                          markJobAsViewed(job.id);
                          setSelectedJob(job);
                        }}
                        className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-800 transition-colors cursor-pointer"
                      >
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
                      onClick={() => {
                        markJobAsViewed(job.id);
                        setSelectedJob(job);
                      }}
                      className="text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer py-1 px-2"
                    >
                      Ver detalle
                    </button>

                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markJobAsViewed(job.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Postularme</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
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
