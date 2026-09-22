'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  ExternalLink, 
  X, 
  ArrowUpDown,
  Database,
  CheckCircle2,
  Cpu,
  Layers,
  Lock,
  Sparkles,
  ArrowRight,
  Mail,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';
import { JobPost } from '@/types';
import { detectTechCategory } from '@/lib/services/scrapers/category-detector';

export function ColombiaJobBoard() {
  const { jobs } = useAppStore();
  const { user, openAuthModal, signInWithGoogle } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'software_dev' | 'data_ai' | 'qa_testing' | 'it_support' | 'ui_ux_product'
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedEnglish, setSelectedEnglish] = useState('all');
  const [selectedModality, setSelectedModality] = useState('all');
  const [selectedContract, setSelectedContract] = useState('all');
  const [selectedSalary, setSelectedSalary] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [selectedApplicantTier, setSelectedApplicantTier] = useState('all'); // 'all' | 'low' | 'medium' | 'high'
  const [selectedFreshness, setSelectedFreshness] = useState('all');
  const [selectedPostType, setSelectedPostType] = useState('all'); // 'all' | 'posts_only' | 'boards_only'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'salary_desc' | 'salary_asc' | 'zero_exp_first'
  
  const [selectedJobModal, setSelectedJobModal] = useState<JobPost | null>(null);
  const [displayCount, setDisplayCount] = useState(20);

  // Helper functions for classification
  const isJobRemote = (job: JobPost): boolean => {
    if (job.isRemote) return true;
    if (job.workModality === 'remote_country' || job.workModality === 'remote_worldwide') return true;
    const disp = (job.displayLocation || '').toLowerCase();
    const city = (job.locationCity || '').toLowerCase();
    return disp.includes('remoto') || city.includes('remoto');
  };

  const isJobZeroExp = (job: JobPost): boolean => {
    if (job.isZeroExperience) return true;
    if (job.contractType === 'aprendizaje') return true;
    if (job.seniorityRequired === 'trainee' || job.seniorityRequired === 'intern') return true;
    if (Number(job.maxYearsExperienceRequired) === 0) return true;
    const title = (job.title || '').toLowerCase();
    return (
      title.includes('practicante') ||
      title.includes('aprendiz') ||
      title.includes('trainee') ||
      title.includes('semillero') ||
      title.includes('sin experiencia') ||
      title.includes('pasante') ||
      title.includes('pasantia') ||
      title.includes('intern')
    );
  };

  const getJobCategory = (job: JobPost): string => {
    if (job.category) return job.category;
    return detectTechCategory(job.title, job.description || '').category;
  };

  const getJobExperienceTier = (job: JobPost): string => {
    if (job.experienceTier) return job.experienceTier;
    if (isJobZeroExp(job)) return 'zero_exp';
    const yoe = Number(job.maxYearsExperienceRequired) || 1;
    if (yoe <= 0.7) return 'six_months';
    if (yoe <= 1.5) return 'one_year';
    if (yoe <= 3.0) return 'two_to_three';
    if (yoe <= 4.5) return 'three_to_four';
    return 'more_than_five';
  };

  const getJobExperienceLabel = (job: JobPost): string => {
    if (job.experienceLabel) return job.experienceLabel;
    const tier = getJobExperienceTier(job);
    switch (tier) {
      case 'zero_exp': return 'Sin experiencia previa';
      case 'six_months': return '6 meses de exp';
      case 'one_year': return '1 año de exp';
      case 'two_to_three': return '2 a 3 años de exp';
      case 'three_to_four': return '3 a 4 años de exp';
      case 'more_than_five': return '5+ años de exp';
      default: return '1 año de exp';
    }
  };

  const getResilientJobUrl = (job: JobPost): string => {
    const url = (job.sourceUrl || '').trim();
    if (!url || url.includes('{{') || url.includes('undefined')) {
      return `https://www.google.com/search?q=${encodeURIComponent((job.companyName || '') + ' ' + (job.title || '') + ' empleo Colombia')}`;
    }
    // If it's a LinkedIn job without numeric ID, redirect to verified search
    if (url.includes('linkedin.com/jobs/view/')) {
      const hasNumericId = /\d{7,}/.test(url);
      if (!hasNumericId) {
        return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent((job.companyName || '') + ' ' + (job.title || ''))}&location=Colombia`;
      }
    }
    return url;
  };

  const getJobAgeHours = (job: JobPost): number => {
    const pText = (job.postedDateText || '').toLowerCase();
    const numMatch = pText.match(/\d+/);
    const n = numMatch ? parseInt(numMatch[0], 10) : 1;

    if (pText.includes('min')) return n / 60;
    if (pText.includes('hora') || pText.includes('hour')) return n;
    if (pText.includes('hoy') || pText.includes('today') || pText.includes('just now')) return 2;
    if (pText.includes('ayer') || pText.includes('yesterday')) return 24;
    if (pText.includes('d[ií]a') || pText.includes('dia') || pText.includes('day')) return n * 24;
    if (pText.includes('semana') || pText.includes('week')) return n * 7 * 24;
    if (pText.includes('mes') || pText.includes('month')) return n * 30 * 24;

    const dt = new Date(job.createdAt).getTime();
    if (!isNaN(dt) && dt > 0) {
      const diff = (Date.now() - dt) / 3600000;
      return diff >= 0 ? diff : 24;
    }
    return 48;
  };

  // 1. Filtrar vacantes
  const filteredJobs = useMemo(() => {
    const now = Date.now();

    return jobs.filter(job => {
      const isRemote = isJobRemote(job);
      const isZero = isJobZeroExp(job);
      const yoe = Number(job.maxYearsExperienceRequired) || 0;
      const cat = getJobCategory(job);

      // 1. Filtro de Categoría / Especialidad Tech (Data, AI, QA, Dev, etc.)
      const TECH_CATEGORIES = new Set(['data_ai', 'software_dev', 'qa_testing', 'it_support', 'ui_ux_product']);
      if (selectedCategory === 'all') {
        // En este portal Tech, por defecto mostramos estrictamente vacantes del sector Tech
        if (!TECH_CATEGORIES.has(cat)) return false;
      } else if (selectedCategory === 'all_inclusive') {
        // Opción explícita para explorar todas las vacantes de Colombia (Tech + Ventas + Remoto)
      } else {
        if (cat !== selectedCategory) return false;
      }

      // 2. Filtro de Modalidad
      if (selectedModality === 'remote' && !isRemote) return false;
      if (selectedModality === 'hybrid' && (isRemote || job.workModality !== 'hybrid')) return false;
      if (selectedModality === 'on_site' && (isRemote || job.workModality === 'hybrid')) return false;

      // 3. Filtro de Ubicación
      if (selectedLocation !== 'all') {
        if (selectedLocation === 'remoto_colombia') {
          if (!isRemote) return false;
        } else {
          const key = (job.locationFilterKey || '').toLowerCase();
          const city = (job.locationCity || '').toLowerCase();
          const display = (job.displayLocation || '').toLowerCase();

          if (selectedLocation === 'bogota' && !key.includes('bogota') && !city.includes('bogot') && !display.includes('bogot')) return false;
          if (selectedLocation === 'medellin' && !key.includes('medellin') && !city.includes('medell') && !display.includes('medell')) return false;
          if (selectedLocation === 'cali' && !key.includes('cali') && !city.includes('cali') && !display.includes('cali')) return false;
          if (selectedLocation === 'barranquilla' && !key.includes('barranquilla') && !city.includes('barranquilla') && !display.includes('barranquilla')) return false;
          if (selectedLocation === 'bucaramanga' && !key.includes('bucaramanga') && !city.includes('bucaramanga') && !display.includes('bucaramanga')) return false;
          if (selectedLocation === 'ibague' && !key.includes('ibague') && !city.includes('ibag') && !display.includes('ibag') && !city.includes('tolima')) return false;
          if (selectedLocation === 'eje_cafetero' && !key.includes('eje_cafetero') && !city.includes('pereira') && !city.includes('manizales') && !city.includes('armenia')) return false;
        }
      }

      // 4. Filtro de Experiencia Granular (0 exp, 6 meses, 1 año, 2-3 años, 3-4 años, 5+ años)
      if (selectedExperience !== 'all') {
        const tier = getJobExperienceTier(job);
        if (selectedExperience !== tier) return false;
      }

      // 5. Filtro de Tipo de Contrato
      if (selectedContract !== 'all') {
        const cType = job.contractType || 'indefinido';
        if (selectedContract !== cType) return false;
      }

      // 6. Filtro de Salario
      if (selectedSalary === 'disclosed_only' && !job.salaryDisclosed) {
        return false;
      }

      // 7. Filtro de Idioma
      if (selectedEnglish === 'no_english' && job.requiresEnglish) return false;
      if (selectedEnglish === 'requires_english' && !job.requiresEnglish) return false;

      // 8. Filtro de Postulaciones / Demanda
      if (selectedApplicantTier !== 'all') {
        const tier = job.applicantTier || 'low';
        if (selectedApplicantTier !== tier) return false;
      }

      // 9. Filtro de Fecha de publicación (máximo 21 días / 3 semanas)
      if (job.postedDateText) {
        const pL = job.postedDateText.toLowerCase();
        if (pL.includes('mes') || pL.includes('month') || pL.includes('año') || pL.includes('year')) {
          return false;
        }
      }
      const ageHours = getJobAgeHours(job);
      if (ageHours > 21 * 24) return false;

      if (selectedFreshness === 'today' && ageHours > 24) return false;
      if (selectedFreshness === '3days' && ageHours > 72) return false;
      if (selectedFreshness === '7days' && ageHours > 168) return false;

      // 10. Filtro de Tipo de Publicación (Posts de Reclutadores / LinkedIn vs Tableros Tradicionales)
      if (selectedPostType === 'posts_only') {
        const isPost = job.isLinkedInPost || (job.sourceUrl || '').includes('/posts/') || (job.sourceUrl || '').includes('/feed/update/') || (job.applicantCountText || '').includes('Post');
        if (!isPost) return false;
      } else if (selectedPostType === 'boards_only') {
        const isPost = job.isLinkedInPost || (job.sourceUrl || '').includes('/posts/') || (job.sourceUrl || '').includes('/feed/update/');
        if (isPost) return false;
      }

      // 11. Búsqueda por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (job.title || '').toLowerCase().includes(q);
        const matchComp = (job.companyName || '').toLowerCase().includes(q);
        const matchLoc = ((job.displayLocation || '') + ' ' + (job.locationCity || '')).toLowerCase().includes(q);
        const matchDesc = (job.description || '').toLowerCase().includes(q);
        const matchAuthor = (job.postAuthor || '').toLowerCase().includes(q);
        const matchSkill = job.requiredSkills?.some(s => s.toLowerCase().includes(q));
        if (!matchTitle && !matchComp && !matchLoc && !matchDesc && !matchSkill && !matchAuthor) return false;
      }

      return true;
    });
  }, [
    jobs, 
    selectedCategory, 
    selectedLocation, 
    selectedEnglish, 
    selectedModality, 
    selectedContract, 
    selectedSalary, 
    selectedExperience, 
    selectedApplicantTier,
    selectedFreshness, 
    selectedPostType,
    searchQuery
  ]);

  // 2. Ordenamiento riguroso por frescura relativa y fecha exacta
  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      if (sortOrder === 'newest') {
        const ageA = getJobAgeHours(a);
        const ageB = getJobAgeHours(b);
        if (Math.abs(ageA - ageB) > 0.1) {
          return ageA - ageB; // Menor edad en horas = más reciente primero
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOrder === 'oldest') {
        const ageA = getJobAgeHours(a);
        const ageB = getJobAgeHours(b);
        if (Math.abs(ageA - ageB) > 0.1) {
          return ageB - ageA; // Mayor edad = más antigua primero
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOrder === 'salary_desc') {
        const salA = a.salaryDisclosed ? (a.salaryMaxUsd || 0) : -1;
        const salB = b.salaryDisclosed ? (b.salaryMaxUsd || 0) : -1;
        return salB - salA;
      }
      if (sortOrder === 'salary_asc') {
        const salA = a.salaryDisclosed ? (a.salaryMinUsd || 0) : 999999;
        const salB = b.salaryDisclosed ? (b.salaryMinUsd || 0) : 999999;
        return salA - salB;
      }
      if (sortOrder === 'zero_exp_first') {
        const zeroA = isJobZeroExp(a);
        const zeroB = isJobZeroExp(b);
        if (zeroA && !zeroB) return -1;
        if (!zeroA && zeroB) return 1;
        return getJobAgeHours(a) - getJobAgeHours(b);
      }
      return getJobAgeHours(a) - getJobAgeHours(b);
    });
  }, [filteredJobs, sortOrder]);

  const visibleJobs = sortedJobs.slice(0, displayCount);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedEnglish('all');
    setSelectedModality('all');
    setSelectedContract('all');
    setSelectedSalary('all');
    setSelectedExperience('all');
    setSelectedApplicantTier('all');
    setSelectedFreshness('all');
    setSortOrder('newest');
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedCategory !== 'all' ||
    selectedLocation !== 'all' || 
    selectedEnglish !== 'all' || 
    selectedModality !== 'all' || 
    selectedContract !== 'all' ||
    selectedSalary !== 'all' || 
    selectedExperience !== 'all' || 
    selectedApplicantTier !== 'all' ||
    selectedFreshness !== 'all';

  const TECH_CATEGORIES = useMemo(() => new Set(['data_ai', 'software_dev', 'qa_testing', 'it_support', 'ui_ux_product']), []);

  const techJobs = useMemo(() => {
    return jobs.filter(j => TECH_CATEGORIES.has(getJobCategory(j)));
  }, [jobs, TECH_CATEGORIES]);

  const totalTechCount = techJobs.length;
  const totalRemoteCount = useMemo(() => techJobs.filter(isJobRemote).length, [techJobs]);
  const totalZeroExpCount = useMemo(() => techJobs.filter(j => getJobExperienceTier(j) === 'zero_exp').length, [techJobs]);
  const totalSixMonthsCount = useMemo(() => techJobs.filter(j => getJobExperienceTier(j) === 'six_months').length, [techJobs]);
  const totalOneYearCount = useMemo(() => techJobs.filter(j => getJobExperienceTier(j) === 'one_year').length, [techJobs]);
  const totalTwoToThreeCount = useMemo(() => techJobs.filter(j => getJobExperienceTier(j) === 'two_to_three').length, [techJobs]);
  const totalSalaryDisclosedCount = useMemo(() => techJobs.filter(j => j.salaryDisclosed).length, [techJobs]);
  const totalDataAiCount = useMemo(() => techJobs.filter(j => getJobCategory(j) === 'data_ai').length, [techJobs]);
  const totalQaCount = useMemo(() => techJobs.filter(j => getJobCategory(j) === 'qa_testing').length, [techJobs]);
  const totalSoftwareDevCount = useMemo(() => techJobs.filter(j => getJobCategory(j) === 'software_dev').length, [techJobs]);
  const totalLinkedInPostsCount = useMemo(() => techJobs.filter(j => j.isLinkedInPost || (j.sourceUrl || '').includes('/posts/') || (j.sourceUrl || '').includes('/feed/update/')).length, [techJobs]);

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      
      {/* Header Banner - Clean, Professional & Sober */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Colombia · {totalTechCount} ofertas Tech activas (+{totalLinkedInPostsCount} posts directos de reclutadores)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ofertas de Empleo en Tecnología, Datos & Software
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Explora vacantes verificadas en Desarrollo, Analítica de Datos, Inteligencia Artificial, QA y Cloud — incluyendo publicaciones directas de reclutadores en LinkedIn con correos de contacto directo.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 shrink-0">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-500 block font-medium">💬 Posts Reclutadores</span>
              <span className="text-base sm:text-lg font-bold text-indigo-700">{totalLinkedInPostsCount}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-500 block font-medium">Datos & IA</span>
              <span className="text-base sm:text-lg font-bold text-sky-700">{totalDataAiCount}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-500 block font-medium">QA & Testing</span>
              <span className="text-base sm:text-lg font-bold text-amber-700">{totalQaCount}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-500 block font-medium">Sin Experiencia</span>
              <span className="text-base sm:text-lg font-bold text-emerald-700">{totalZeroExpCount}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-500 block font-medium">Remoto</span>
              <span className="text-base sm:text-lg font-bold text-slate-900">{totalRemoteCount}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Comprehensive Filters */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        
        {/* Search Bar + Sort Order Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por cargo (Analista de Datos, QA, React, Python, Machine Learning), tecnología o empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="sm:w-64">
            <div className="relative">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer truncate"
              >
                <option value="newest">Más recientes primero</option>
                <option value="oldest">Más antiguas primero</option>
                <option value="salary_desc">Mayor salario primero</option>
                <option value="salary_asc">Menor salario primero</option>
                <option value="zero_exp_first">0 Años / Trainee primero</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          
          {/* Especialidad / Área Tech */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Área Tech
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer truncate ${
                selectedCategory !== 'all' 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">Todas las áreas Tech ({totalTechCount})</option>
              <option value="data_ai">📊 Datos & IA ({totalDataAiCount})</option>
              <option value="software_dev">💻 Desarrollo Software ({totalSoftwareDevCount})</option>
              <option value="qa_testing">🧪 QA & Testing ({totalQaCount})</option>
              <option value="it_support">☁️ Soporte & Cloud</option>
              <option value="ui_ux_product">🎨 UI/UX & Producto</option>
              <option value="all_inclusive">🌐 Ver Todas (Tech + Ventas + Remoto: {jobs.length})</option>
            </select>
          </div>

          {/* Experiencia */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Experiencia
            </label>
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer truncate ${
                selectedExperience !== 'all' 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
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

          {/* Modalidad */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Modalidad
            </label>
            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer truncate ${
                selectedModality !== 'all' 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">Todas</option>
              <option value="remote">Remoto 100%</option>
              <option value="hybrid">Híbrido</option>
              <option value="on_site">Presencial</option>
            </select>
          </div>

          {/* Tipo de Contrato */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tipo de Contrato
            </label>
            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer truncate ${
                selectedContract !== 'all' 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">Todos los contratos</option>
              <option value="indefinido">Término Indefinido</option>
              <option value="fijo">Término Fijo</option>
              <option value="aprendizaje">Aprendizaje / Prácticas</option>
              <option value="prestacion_servicios">Prestación de Servicios</option>
              <option value="obra_labor">Obra o Labor</option>
            </select>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Ubicación
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer truncate ${
                selectedLocation !== 'all' 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">Toda Colombia</option>
              <option value="remoto_colombia">Remoto (Colombia)</option>
              <option value="bogota">Bogotá, D.C.</option>
              <option value="medellin">Medellín, Antioquia</option>
              <option value="cali">Cali, Valle</option>
              <option value="barranquilla">Barranquilla, Atlántico</option>
              <option value="bucaramanga">Bucaramanga, Santander</option>
              <option value="ibague">Ibagué, Tolima</option>
              <option value="eje_cafetero">Eje Cafetero</option>
            </select>
          </div>

          {/* Postulaciones / Demanda */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Postulaciones
            </label>
            <select
              value={selectedApplicantTier}
              onChange={(e) => setSelectedApplicantTier(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer truncate ${
                selectedApplicantTier !== 'all' 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">Todas</option>
              <option value="low">⚡ &lt; 25 postulaciones</option>
              <option value="medium">👥 25 a 100</option>
              <option value="high">🔥 &gt; 100 postulaciones</option>
            </select>
          </div>

          {/* Salario */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Salario
            </label>
            <select
              value={selectedSalary}
              onChange={(e) => setSelectedSalary(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer truncate ${
                selectedSalary !== 'all' 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">Todos los salarios</option>
              <option value="disclosed_only">Solo con salario visible</option>
            </select>
          </div>

          {/* Idioma */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Idioma
            </label>
            <select
              value={selectedEnglish}
              onChange={(e) => setSelectedEnglish(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer truncate ${
                selectedEnglish !== 'all' 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">Todos los idiomas</option>
              <option value="no_english">Español (Sin inglés)</option>
              <option value="requires_english">Requiere inglés</option>
            </select>
          </div>

        </div>

        {/* Quick Filter Buttons & Active Count */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100 text-xs">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 text-[11px]">Accesos directos:</span>

            {/* Quick Filter: Posts de Reclutadores */}
            <button
              onClick={() => setSelectedPostType(selectedPostType === 'posts_only' ? 'all' : 'posts_only')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedPostType === 'posts_only' 
                  ? 'bg-indigo-700 text-white shadow-sm' 
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Posts de Reclutadores ({totalLinkedInPostsCount})</span>
            </button>

            {/* Datos & IA */}
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'data_ai' ? 'all' : 'data_ai')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'data_ai' 
                  ? 'bg-sky-700 text-white' 
                  : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              Datos & IA ({totalDataAiCount})
            </button>

            {/* QA & Testing */}
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'qa_testing' ? 'all' : 'qa_testing')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'qa_testing' 
                  ? 'bg-amber-700 text-white' 
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              QA & Testing ({totalQaCount})
            </button>

            {/* Remoto */}
            <button
              onClick={() => setSelectedModality(selectedModality === 'remote' ? 'all' : 'remote')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedModality === 'remote' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Remoto ({totalRemoteCount})
            </button>

            {/* Sin experiencia */}
            <button
              onClick={() => setSelectedExperience(selectedExperience === 'zero_exp' ? 'all' : 'zero_exp')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedExperience === 'zero_exp' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sin exp ({totalZeroExpCount})
            </button>

            {/* 6 Meses */}
            <button
              onClick={() => setSelectedExperience(selectedExperience === 'six_months' ? 'all' : 'six_months')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedExperience === 'six_months' 
                  ? 'bg-orange-700 text-white' 
                  : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
              }`}
            >
              6 Meses ({totalSixMonthsCount})
            </button>

            {/* 1 Año */}
            <button
              onClick={() => setSelectedExperience(selectedExperience === 'one_year' ? 'all' : 'one_year')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedExperience === 'one_year' 
                  ? 'bg-emerald-700 text-white' 
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              1 Año ({totalOneYearCount})
            </button>

            {/* 2 a 3 Años */}
            <button
              onClick={() => setSelectedExperience(selectedExperience === 'two_to_three' ? 'all' : 'two_to_three')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedExperience === 'two_to_three' 
                  ? 'bg-indigo-700 text-white' 
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              2 a 3 Años ({totalTwoToThreeCount})
            </button>

            {/* Con salario */}
            <button
              onClick={() => setSelectedSalary(selectedSalary === 'disclosed_only' ? 'all' : 'disclosed_only')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedSalary === 'disclosed_only' 
                  ? 'bg-emerald-800 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Con salario ({totalSalaryDisclosedCount})
            </button>

            {/* Prácticas / Aprendiz */}
            <button
              onClick={() => setSelectedContract(selectedContract === 'aprendizaje' ? 'all' : 'aprendizaje')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedContract === 'aprendizaje' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Prácticas / Aprendiz
            </button>
          </div>

          {/* Active Results Summary & Reset */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium text-xs">
              {filteredJobs.length} ofertas encontradas
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>

        </div>

      </section>

      {/* Main Jobs Listing */}
      <section className="space-y-4">
        
        {visibleJobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No encontramos ofertas con los filtros seleccionados
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Intenta ampliando la ubicación, ajustando la experiencia requerida o limpiando la búsqueda.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleJobs.map((job) => {
              const isRem = isJobRemote(job);
              const isZero = isJobZeroExp(job);
              const cat = getJobCategory(job);
              const isLiPost = job.isLinkedInPost || (job.sourceUrl || '').includes('/posts/') || (job.sourceUrl || '').includes('/feed/update/');

              return (
                <div
                  key={job.id}
                  className={`bg-white rounded-xl p-5 border transition-all duration-150 flex flex-col justify-between gap-4 ${
                    isLiPost 
                      ? 'border-indigo-200/80 bg-gradient-to-r from-white via-indigo-50/20 to-white hover:border-indigo-300 hover:shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    
                    {/* Header Row: Company, Location, Date & Badges */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 shadow-xs ${
                          isLiPost ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                        }`}>
                          {job.companyName ? job.companyName.charAt(0).toUpperCase() : 'E'}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-slate-800">
                              {job.companyName}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>
                                {isRem 
                                  ? (job.locationCity && !job.locationCity.toLowerCase().includes('remoto') && job.locationCity !== 'Colombia' 
                                      ? `Remoto · ${job.locationCity}` 
                                      : (job.displayLocation && job.displayLocation.toLowerCase().includes('remoto') ? job.displayLocation : 'Remoto · Colombia'))
                                  : (job.displayLocation || job.locationCity || 'Colombia')
                                }
                              </span>
                            </span>
                          </div>
                          {isLiPost && job.postAuthor && (
                            <div className="flex items-center gap-1 text-[11px] text-indigo-700 font-medium mt-0.5">
                              <UserCheck className="w-3 h-3 text-indigo-600" />
                              <span>Post de: <strong>{job.postAuthor}</strong> {job.postAuthorHeadline ? `(${job.postAuthorHeadline.slice(0, 45)}...)` : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tag Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        
                        {/* LinkedIn Post Distinct Badge */}
                        {isLiPost && (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1 shadow-2xs">
                            <MessageSquare className="w-3 h-3 text-indigo-700" />
                            <span>Post de LinkedIn</span>
                          </span>
                        )}

                        {/* Category Tag */}
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                          cat === 'data_ai'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : cat === 'qa_testing'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : cat === 'it_support'
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {cat === 'data_ai' ? 'Datos & IA' : cat === 'qa_testing' ? 'QA & Testing' : cat === 'it_support' ? 'Soporte & Cloud' : 'Desarrollo'}
                        </span>

                        {/* Contract Type Badge */}
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {job.contractTypeLabel || 'Término Indefinido'}
                        </span>

                        {/* Modality Badge */}
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                          isRem 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {isRem ? 'Remoto' : (job.workModality === 'hybrid' ? 'Híbrido' : 'Presencial')}
                        </span>

                        {/* Experience Badge */}
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                          getJobExperienceTier(job) === 'zero_exp' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : getJobExperienceTier(job) === 'six_months'
                            ? 'bg-orange-50 text-orange-800 border-orange-200'
                            : getJobExperienceTier(job) === 'one_year'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : getJobExperienceTier(job) === 'two_to_three'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {getJobExperienceLabel(job)}
                        </span>

                        {/* English Requirement */}
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                          job.requiresEnglish 
                            ? 'bg-blue-50 text-blue-800 border-blue-200' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {job.requiresEnglish ? 'Requiere inglés' : 'Español'}
                        </span>

                        {/* Applicant Count / Demanda Badge - ONLY IF PRESENT */}
                        {job.applicantCountText && (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {job.applicantCountText}
                          </span>
                        )}

                        {/* Date indicator */}
                        <span className="text-[11px] text-slate-400 font-medium ml-1">
                          {job.postedDateText || 'Reciente'}
                        </span>

                      </div>

                    </div>

                    {/* Job Title */}
                    <div>
                      <h2 
                        onClick={() => setSelectedJobModal(job)}
                        className="text-base sm:text-lg font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {job.title}
                      </h2>
                    </div>

                    {/* Salary Information */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium">Salario:</span>
                      {job.salaryDisclosed ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {job.salaryDisplayText}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          No especificado en la oferta
                        </span>
                      )}
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {job.description}
                    </p>

                    {/* Skills Tags */}
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {job.requiredSkills.slice(0, 6).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      {isLiPost ? (
                        <span className="text-indigo-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Post verificado de reclutador
                        </span>
                      ) : (
                        'Oferta verificada para Colombia'
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedJobModal(job)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        Ver detalle
                      </button>

                      {/* Direct Mail Application for Posts */}
                      {job.contactEmail && (
                        <a
                          href={`mailto:${job.contactEmail}?subject=${encodeURIComponent(`[Postulación RealJobs] ${job.title} - Hoja de Vida`)}`}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Enviar CV</span>
                        </a>
                      )}

                      {job.sourceUrl && (
                        <a
                          href={getResilientJobUrl(job)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <span>{isLiPost ? 'Ver en LinkedIn' : 'Postularme'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Subtle Visibility Banner for Non-Logged In Users */}
        {!user && (
          <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-indigo-900/90 via-slate-900/95 to-indigo-950/90 text-white border border-indigo-500/30 shadow-lg flex flex-col md:flex-row items-center justify-between gap-5 my-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-left">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-400/20">
                    Impulsa tu carrera
                  </span>
                  <span className="text-xs text-slate-400 font-medium">100% Opcional & Gratuito</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  ¿Quieres que te ayudemos a tener más visibilidad con empresas contratantes?
                </h4>
                <p className="text-xs sm:text-sm text-slate-300">
                  Regístrate gratis para que reclutadores verificados puedan encontrar tu perfil, ver tu CV y contactarte directamente.
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
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
              >
                Crear Perfil Gratis
              </button>
            </div>
          </div>
        )}

        {/* Load More Pagination for all users */}
        {sortedJobs.length > displayCount && (
          <div className="text-center pt-4 pb-2">
            <button
              onClick={() => setDisplayCount(prev => prev + 25)}
              className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              Cargar más ofertas (+25) · Mostrando {visibleJobs.length} de {sortedJobs.length}
            </button>
          </div>
        )}

      </section>

      {/* Clean Detailed Job Modal */}
      {selectedJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800">{selectedJobModal.companyName}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">{selectedJobModal.displayLocation}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {selectedJobModal.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedJobModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LinkedIn Post Recruiter Direct Info Box */}
            {(selectedJobModal.isLinkedInPost || selectedJobModal.contactEmail) && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 border border-indigo-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-indigo-950">Publicación Directa en LinkedIn / Red de Reclutadores</h3>
                    {selectedJobModal.postAuthor && (
                      <p className="text-[11px] text-indigo-700 font-medium">
                        Publicado por: <strong>{selectedJobModal.postAuthor}</strong> {selectedJobModal.postAuthorHeadline ? `· ${selectedJobModal.postAuthorHeadline}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {selectedJobModal.contactEmail && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-indigo-200/60 text-xs">
                    <div className="flex items-center gap-1.5 text-indigo-900">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Correo de postulación: <strong>{selectedJobModal.contactEmail}</strong></span>
                    </div>
                    <a
                      href={`mailto:${selectedJobModal.contactEmail}?subject=${encodeURIComponent(`[Postulación RealJobs] ${selectedJobModal.title} - Hoja de Vida`)}`}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Redactar correo</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Badges Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Área Tech</span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {selectedJobModal.categoryLabel || 'Desarrollo'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo de Contrato</span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {selectedJobModal.contractTypeLabel || 'Término Indefinido'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Modalidad</span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {isJobRemote(selectedJobModal) ? 'Remoto' : (selectedJobModal.workModality === 'hybrid' ? 'Híbrido' : 'Presencial')}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Experiencia</span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {getJobExperienceLabel(selectedJobModal)}
                </span>
              </div>

            </div>

            {/* Job Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-600">Descripción de la vacante</h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                {selectedJobModal.description}
              </div>
            </div>

            {/* Skills */}
            {selectedJobModal.requiredSkills && selectedJobModal.requiredSkills.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-600">Habilidades y tecnologías</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJobModal.requiredSkills.map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedJobModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              {selectedJobModal.contactEmail && (
                <a
                  href={`mailto:${selectedJobModal.contactEmail}?subject=${encodeURIComponent(`[Postulación RealJobs] ${selectedJobModal.title} - Hoja de Vida`)}`}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Enviar CV por Correo</span>
                </a>
              )}

              {selectedJobModal.sourceUrl && (
                selectedJobModal.sourceUrl.startsWith('mailto:') || selectedJobModal.contactEmail ? (
                  <a
                    href={selectedJobModal.sourceUrl.startsWith('mailto:') ? selectedJobModal.sourceUrl : `mailto:${selectedJobModal.contactEmail}?subject=${encodeURIComponent(`Postulación: ${selectedJobModal.title} - ${selectedJobModal.companyName}`)}`}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <span>✉️ Enviar CV por Correo ({selectedJobModal.contactEmail || selectedJobModal.sourceUrl.replace('mailto:', '').split('?')[0]})</span>
                  </a>
                ) : (
                  <a
                    href={getResilientJobUrl(selectedJobModal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Postularme en la fuente oficial</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
