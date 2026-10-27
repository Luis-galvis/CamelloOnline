import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  DollarSign, 
  ExternalLink, 
  CheckCircle2, 
  ArrowLeft, 
  Share2, 
  Sparkles,
  ShieldCheck,
  Calendar,
  Languages
} from 'lucide-react';
import { getJobBySlug, getAllJobSlugs } from '@/lib/services/job-finder';
import { JobPostingJsonLd } from '@/components/seo/JsonLdSchemas';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

// Revalida cada hora las páginas pre-renderizadas para que no queden obsoletas
// cuando el scraper diario actualiza slugs, estado o contenido.
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllJobSlugs();
  // Pre-render top 60 jobs at build time, remainder generated on-demand
  return slugs.slice(0, 60).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    return {
      title: 'Oferta de Empleo en Colombia | Camello Online',
      description: 'Encuentra ofertas laborales verificadas en Colombia y trabajo remoto en Camello Online.'
    };
  }

  const cleanTitle = `${job.title} en ${job.companyName} | Camello Online Colombia`;
  const cleanDescription = `Vacante activa: ${job.title} en ${job.companyName} (${job.displayLocation || 'Colombia'}). Modalidad: ${job.isRemote ? 'Remoto' : (job.workModality === 'hybrid' ? 'Híbrido' : 'Presencial')}. Contrato: ${job.contractTypeLabel || 'A convenir'}. Aplica gratis a través de Camello Online.`;
  const canonicalUrl = `https://www.camelloonline.com/jobs/${job.slug || slug}`;

  return {
    title: cleanTitle,
    description: cleanDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: cleanTitle,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: 'Camello Online (CamelloOnline)',
      locale: 'es_CO',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description: cleanDescription,
    }
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    notFound();
  }

  const applyUrl = job.sourceUrl && job.sourceUrl.startsWith('http') 
    ? job.sourceUrl 
    : `https://www.google.com/search?q=${encodeURIComponent(`${job.companyName} ${job.title} empleo colombia`)}`;

  return (
    <>
      <JobPostingJsonLd jobs={[job]} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        
        {/* Breadcrumbs & Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-amber-700 transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/jobs" className="hover:text-amber-700 transition-colors">
            Empleos Colombia
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-xs sm:max-w-md">
            {job.title}
          </span>
        </nav>

        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a todas las ofertas</span>
          </Link>
        </div>

        {/* Main Job Card */}
        <article className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                {job.companyName ? job.companyName.charAt(0).toUpperCase() : 'E'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">
                    {job.companyName}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verificada</span>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.displayLocation || job.locationCity || 'Colombia'}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.postedDateText || 'Publicada recientemente'}</span>
                  </span>
                  <span>·</span>
                  <span className="text-slate-400">
                    Fuente: {job.sourceName || 'Portal Verificado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Apply CTA (Desktop) */}
            <div className="sm:self-center shrink-0">
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Postularme a la oferta</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Badges Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Modalidad</span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                {job.isRemote ? '🏠 100% Remoto' : (job.workModality === 'hybrid' ? '🏠 Híbrido' : '🏢 Presencial')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Contrato</span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                {job.contractTypeLabel || 'A convenir'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Experiencia</span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                {job.experienceLabel || (job.isZeroExperience ? 'Sin experiencia' : '1+ años')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Idioma</span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                {job.requiresEnglish ? 'Requiere inglés' : 'Español'}
              </span>
            </div>
          </div>

          {/* Salary Highlight Box */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                  Compensación Salarial
                </span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-950 block">
                  {job.salaryDisplayText || 'No especificado en la oferta inicial (A convenir)'}
                </span>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-3 pt-2">
            <h2 className="text-base font-bold text-slate-900">
              Descripción del empleo
            </h2>
            <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              {job.description}
            </div>
          </div>

          {/* Skills Required */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Habilidades y Tecnologías Requeridas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills.map((sk: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-semibold"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA Button */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Postulación verificada para Colombia a través de <strong>Camello Online</strong>.
            </div>
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Aplicar a la vacante ahora</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </article>

        {/* Explore More Categories Banner */}
        <section className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white space-y-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Más vacantes en Colombia
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              ¿Buscas otras oportunidades laborales?
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Explora más de 1.300 ofertas activas en Colombia por modalidad y especialidad:
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              💻 Bolsa de Empleo Tech
            </Link>
            <Link
              href="/remoto-colombia"
              className="px-4 py-2 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 text-white font-bold text-xs border border-indigo-600/50 transition-colors"
            >
              🏠 Trabajo Remoto Colombia
            </Link>
            <Link
              href="/ventas-comercial"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
            >
              🛒 Ventas & Comercial
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
