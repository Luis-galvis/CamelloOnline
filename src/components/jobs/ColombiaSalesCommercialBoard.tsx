'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Store, 
  Building2, 
  Calculator, 
  Compass, 
  TrendingUp, 
  RotateCcw,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import rawSalesJobs from '@/lib/scraped-colombia-sales-commercial.json';

type SortOption = 'newest' | 'highest_salary' | 'lowest_salary' | 'ibague_first';
type SalesSubCategory = 'all' | 'tat_mixto' | 'punto_venta' | 'contabilidad_finanzas' | 'gerencia_proyectos' | 'b2b_empresarial';
type LocationFilter = 'all' | 'ibague' | 'remoto' | 'bogota' | 'medellin' | 'cali';
type ModalityFilter = 'all' | 'on_site' | 'hybrid' | 'remote';
type ContractFilter = 'all' | 'indefinido' | 'fijo' | 'prestacion_servicios' | 'obra_labor';

const SALES_CATEGORIES = [
  { id: 'all', label: 'Todos los Cargos', icon: Layers },
  { id: 'tat_mixto', label: '🛒 Canal TAT & Mixto', icon: Store },
  { id: 'punto_venta', label: '🏬 Supervisión PDV & Autoservicios', icon: Building2 },
  { id: 'contabilidad_finanzas', label: '💰 Contabilidad, Costos & Finanzas', icon: Calculator },
  { id: 'gerencia_proyectos', label: '📊 Gerencia de Proyectos & Gestión', icon: Compass },
  { id: 'b2b_empresarial', label: '🤝 Ventas B2B & Corporativo', icon: TrendingUp },
];

export function ColombiaSalesCommercialBoard() {
  const { user, signInWithGoogle, openAuthModal } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SalesSubCategory>('all');
  const [selectedLocation, setSelectedLocation] = useState<LocationFilter>('all');
  const [selectedModality, setSelectedModality] = useState<ModalityFilter>('all');
  const [selectedContract, setSelectedContract] = useState<ContractFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('ibague_first');
  const [displayCount, setDisplayCount] = useState<number>(24);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  // Clasificador de subcategoría
  const getSubCategory = (job: any): SalesSubCategory => {
    const text = `${job.title} ${job.description} ${job.categoryLabel} ${job.category}`.toLowerCase();
    
    // Contabilidad & Finanzas
    if (text.includes('contad') || text.includes('costo') || text.includes('presupuesto') || text.includes('auditor') || text.includes('niif') || text.includes('financier') || text.includes('tesorer') || text.includes('cartera') || text.includes('factura') || text.includes('tributari')) {
      return 'contabilidad_finanzas';
    }
    // Canal TAT & Mixto
    if (text.includes('tat') || text.includes('tienda a tienda') || text.includes('mixto') || text.includes('distributivo') || text.includes('distribuid') || text.includes('mayorista') || text.includes('preventa') || text.includes('autoventa') || text.includes('rutero') || text.includes('ruteo') || text.includes('colocación de portafolio')) {
      return 'tat_mixto';
    }
    // Supervisión PDV & Autoservicios
    if (text.includes('supervisor') || text.includes('supervisión') || text.includes('punto de venta') || text.includes('pdv') || text.includes('autoservicio') || text.includes('supermercado') || text.includes('mercaderista') || text.includes('impulso') || text.includes('retail') || text.includes('tienda') || text.includes('cadenas') || text.includes('almacén') || text.includes('trade marketing')) {
      return 'punto_venta';
    }
    // Gerencia de Proyectos & Gestión
    if (text.includes('director') || text.includes('gerente') || text.includes('gerencia') || text.includes('project') || text.includes('proyecto') || text.includes('gestion empresarial') || text.includes('estrategia') || text.includes('coordinador regional') || text.includes('jefe de')) {
      return 'gerencia_proyectos';
    }
    // Ventas B2B & Corporativo
    return 'b2b_empresarial';
  };

  // Filtrado reactivo
  const filteredJobs = useMemo(() => {
    return (rawSalesJobs as any[]).filter((job) => {
      const subCat = getSubCategory(job);
      const loc = ((job.displayLocation || '') + ' ' + (job.locationCity || '')).toLowerCase();
      const isRem = job.isRemote || (job.workModality === 'remote_country' || job.workModality === 'remote_worldwide') || loc.includes('remoto');

      // 1. Subcategoría
      if (selectedCategory !== 'all' && subCat !== selectedCategory) return false;

      // 2. Ubicación
      if (selectedLocation === 'ibague') {
        if (!loc.includes('ibag') && !loc.includes('tolima')) return false;
      } else if (selectedLocation === 'remoto') {
        if (!isRem) return false;
      } else if (selectedLocation === 'bogota') {
        if (!loc.includes('bogot')) return false;
      } else if (selectedLocation === 'medellin') {
        if (!loc.includes('medell')) return false;
      } else if (selectedLocation === 'cali') {
        if (!loc.includes('cali')) return false;
      }

      // 3. Modalidad
      if (selectedModality === 'remote' && !isRem) return false;
      if (selectedModality === 'hybrid' && (isRem || job.workModality !== 'hybrid')) return false;
      if (selectedModality === 'on_site' && (isRem || job.workModality === 'hybrid')) return false;

      // 4. Tipo de Contrato
      if (selectedContract !== 'all') {
        const cType = job.contractType || 'indefinido';
        if (selectedContract !== cType) return false;
      }

      // 5. Búsqueda por texto libre
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = (job.title || '').toLowerCase().includes(q);
        const mComp = (job.companyName || '').toLowerCase().includes(q);
        const mLoc = loc.includes(q);
        const mDesc = (job.description || '').toLowerCase().includes(q);
        const mSkills = (job.requiredSkills || []).some((s: string) => s.toLowerCase().includes(q));
        if (!mTitle && !mComp && !mLoc && !mDesc && !mSkills) return false;
      }

      return true;
    });
  }, [selectedCategory, selectedLocation, selectedModality, selectedContract, searchQuery]);

  // Ordenamiento
  const sortedJobs = useMemo(() => {
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

    return [...filteredJobs].sort((a, b) => {
      const locA = ((a.displayLocation || '') + ' ' + (a.locationCity || '')).toLowerCase();
      const locB = ((b.displayLocation || '') + ' ' + (b.locationCity || '')).toLowerCase();
      const isIbagueA = locA.includes('ibag') || locA.includes('tolima');
      const isIbagueB = locB.includes('ibag') || locB.includes('tolima');

      if (sortBy === 'ibague_first') {
        if (isIbagueA && !isIbagueB) return -1;
        if (!isIbagueA && isIbagueB) return 1;
        return getAgeHours(a) - getAgeHours(b);
      }
      if (sortBy === 'newest') {
        const ageA = getAgeHours(a);
        const ageB = getAgeHours(b);
        if (Math.abs(ageA - ageB) > 0.1) return ageA - ageB;
        return new Date(b.createdAt || b.scrapedAt || 0).getTime() - new Date(a.createdAt || a.scrapedAt || 0).getTime();
      }
      if (sortBy === 'highest_salary') {
        const salA = a.salaryMax || (a.salaryMaxUsdEquivalent ? a.salaryMaxUsdEquivalent * 4000 : 0);
        const salB = b.salaryMax || (b.salaryMaxUsdEquivalent ? b.salaryMaxUsdEquivalent * 4000 : 0);
        return salB - salA;
      }
      if (sortBy === 'lowest_salary') {
        const salA = a.salaryMin || (a.salaryMinUsdEquivalent ? a.salaryMinUsdEquivalent * 4000 : 99999999);
        const salB = b.salaryMin || (b.salaryMinUsdEquivalent ? b.salaryMinUsdEquivalent * 4000 : 99999999);
        return salA - salB;
      }
      return 0;
    });
  }, [filteredJobs, sortBy]);

  const totalIbagueCount = useMemo(() => {
    return (rawSalesJobs as any[]).filter(j => {
      const l = ((j.displayLocation || '') + ' ' + (j.locationCity || '')).toLowerCase();
      return l.includes('ibag') || l.includes('tolima');
    }).length;
  }, []);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedModality('all');
    setSelectedContract('all');
    setSortBy('ibague_first');
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      
      {/* Hero Banner Especial Ventas, Comercial & Contabilidad */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sección Especial: Ventas, Coordinación Comercial, Contabilidad & Finanzas</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Camello en Ventas, Canales TAT, Puntos de Venta & Contabilidad
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Ofertas reales y verificadas en <strong>Computrabajo</strong>, <strong>Jobleads</strong>, <strong>LinkedIn</strong> y empresas directas para <strong>Jefes y Coordinadores de Canal Mixto y TAT</strong>, <strong>Supervisión de Puntos de Venta</strong>, <strong>Contadoras Públicas (Costos y Presupuestos)</strong> y <strong>Gerencia Comercial</strong> en <strong>Ibagué - Tolima</strong>.
          </p>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => { setSelectedLocation('ibague'); setSelectedCategory('all'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                selectedLocation === 'ibague'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md scale-105'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-amber-300 border-amber-500/30'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>📍 Ibagué / Tolima ({totalIbagueCount} ofertas reales)</span>
            </button>

            <button
              onClick={() => setSelectedCategory('tat_mixto')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                selectedCategory === 'tat_mixto'
                  ? 'bg-indigo-500 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-indigo-400" />
              <span>Canal TAT, Mixto & Distributivo</span>
            </button>

            <button
              onClick={() => setSelectedCategory('punto_venta')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                selectedCategory === 'punto_venta'
                  ? 'bg-purple-500 text-white border-purple-400 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Puntos de Venta & Tiendas</span>
            </button>

            <button
              onClick={() => setSelectedCategory('contabilidad_finanzas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                selectedCategory === 'contabilidad_finanzas'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contabilidad & Costos</span>
            </button>
          </div>
        </div>
      </section>

      {/* Subcategory Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SALES_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as SalesSubCategory)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cargo o empresa (ej: Landers, Universal, Postobón, Gente Útil, TAT, Mixto, Ibagué)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Location Selector */}
          <div className="w-full md:w-56">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value as LocationFilter)}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                selectedLocation === 'ibague'
                  ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">📍 Toda Colombia</option>
              <option value="ibague">📍 Ibagué / Tolima ({totalIbagueCount})</option>
              <option value="remoto">🏠 Remoto / Híbrido</option>
              <option value="bogota">📍 Bogotá, D.C.</option>
              <option value="medellin">📍 Medellín</option>
              <option value="cali">📍 Cali</option>
            </select>
          </div>

          {/* Modality Selector */}
          <div className="w-full md:w-44">
            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value as ModalityFilter)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">🏢 Modalidad</option>
              <option value="on_site">Presencial</option>
              <option value="hybrid">Híbrido / Home Office</option>
              <option value="remote">Remoto 100%</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full md:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none transition-all cursor-pointer"
            >
              <option value="ibague_first">📍 Ibagué / Tolima primero</option>
              <option value="highest_salary">💰 Mayor salario</option>
              <option value="lowest_salary">💵 Menor salario</option>
              <option value="newest">⚡ Más recientes</option>
            </select>
          </div>
        </div>

        {/* Filter State Count & Reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{sortedJobs.length}</span>
            <span>ofertas de empleo verificadas</span>
          </div>

          {(searchQuery || selectedCategory !== 'all' || selectedLocation !== 'all' || selectedModality !== 'all' || selectedContract !== 'all') && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedJobs.slice(0, displayCount).map((job) => {
          const isIbague = ((job.displayLocation || '') + ' ' + (job.locationCity || '')).toLowerCase().includes('ibag') ||
                           ((job.displayLocation || '') + ' ' + (job.locationCity || '')).toLowerCase().includes('tolima');
          const isRem = job.isRemote || (job.workModality === 'remote_country' || job.workModality === 'remote_worldwide');

          return (
            <article
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isIbague && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-extrabold">
                          📍 Ibagué / Tolima
                        </span>
                      )}
                      {job.categoryLabel && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          {job.categoryLabel}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                      {job.title}
                    </h2>
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{job.companyName}</span>
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                    {job.companyName.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Badges Grid */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{job.displayLocation || job.locationCity}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    <span>{job.contractTypeLabel || 'Indefinido'}</span>
                  </span>

                  {isRem && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                      🏠 Híbrido / Remoto
                    </span>
                  )}
                </div>

                {/* Salary Tag */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{job.salaryDisplayText || 'Salario a convenir'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {job.postedDateText || 'Reciente'}
                  </span>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1">
                  {(job.requiredSkills || []).slice(0, 4).map((skill: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-indigo-600 font-bold flex items-center gap-1 group-hover:underline">
                  <span>Ver detalles y postulación</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>

                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {job.source}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Subtle Candidate Visibility Banner */}
      {!user && (
        <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-indigo-950/90 text-white border border-amber-500/30 shadow-lg flex flex-col md:flex-row items-center justify-between gap-5 my-6 backdrop-blur-sm">
          <div className="flex items-center gap-4 text-left">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/20">
                  Ventas, TAT & Proyectos
                </span>
                <span className="text-xs text-slate-400 font-medium">100% Opcional & Gratuito</span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                ¿Quieres que te ayudemos a tener más visibilidad con empresas comerciales?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                Crea tu perfil gratis para que empresas de consumo masivo, retail y distribución encuentren tu hoja de vida.
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
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
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
            className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-amber-400 hover:text-amber-800 font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            Cargar más ofertas comerciales (+24) · Mostrando {Math.min(displayCount, filteredJobs.length)} de {filteredJobs.length}
          </button>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase">
                    {selectedJob.categoryLabel || 'Ventas & Comercial'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    🇨🇴 100% Español
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  {selectedJob.title}
                </h2>
                <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedJob.companyName}</span>
                  <span className="text-slate-300">·</span>
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedJob.displayLocation}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
              
              {/* Highlight Box */}
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Oferta Verificada & Condiciones</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-amber-900">
                  <div><strong>Salario:</strong> {selectedJob.salaryDisplayText}</div>
                  <div><strong>Contrato:</strong> {selectedJob.contractTypeLabel || 'Indefinido'}</div>
                  <div><strong>Experiencia:</strong> {selectedJob.experienceLabel || '2-4 años'}</div>
                  <div><strong>Ubicación:</strong> {selectedJob.displayLocation}</div>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Habilidades y Competencias
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedJob.requiredSkills || []).map((skill: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Descripción del Puesto
                </h3>
                <p className="whitespace-pre-line text-slate-600 leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <a
                href={selectedJob.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Postularme en la fuente oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
