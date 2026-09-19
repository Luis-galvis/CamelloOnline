import { CandidateProfile, JobPost, InboundRequest, Conversation, Company } from '@/types';
import rawColombiaJobs from './scraped-colombia-jobs.json';
import { detectContractType } from './services/scrapers/contract-detector';
import { detectTechCategory } from './services/scrapers/category-detector';
import { detectNonTechCategory } from './services/scrapers/non-tech-remote-colombia';
import { detectExperience } from './services/scrapers/experience-detector';
import { detectEnglishRequirement } from './services/scrapers/english-detector';

function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'empresa';
}

// Build initial companies and jobs strictly from all verified Colombia scraped feeds
const companyMap = new Map<string, Company>();

// 1. All feeds: Tech + Remoto General + Ventas/Comercial/Contabilidad
const combinedRaw = (rawColombiaJobs as any[]) || [];

const seenJobKeys = new Set<string>();
const deduplicatedRawList: any[] = [];

for (const item of combinedRaw) {
  const urlKey = item.sourceUrl ? item.sourceUrl.split('?')[0].toLowerCase() : '';
  const titleCompKey = `${(item.title || '').toLowerCase().trim()}|${(item.companyName || '').toLowerCase().trim()}|${(item.locationCity || item.displayLocation || '').toLowerCase().trim()}`;
  const uniqueKey = urlKey || titleCompKey;

  if (seenJobKeys.has(uniqueKey)) continue;
  seenJobKeys.add(uniqueKey);
  deduplicatedRawList.push(item);
}

export const INITIAL_JOB_POSTS: JobPost[] = deduplicatedRawList.map((job, idx) => {
  const compName = job.companyName || 'Empresa Confidencial';
  const compSlug = slugify(compName);
  const compId = `comp-${compSlug}-${idx}`;

  if (!companyMap.has(compSlug)) {
    companyMap.set(compSlug, {
      id: compId,
      name: compName,
      slug: compSlug,
      domainEmail: job.companyDomain || `${compSlug}.com`,
      website: job.companyDomain ? `https://${job.companyDomain}` : `https://www.google.com/search?q=${encodeURIComponent(compName)}`,
      industry: (job.category === 'sales_commercial' || job.category === 'finance_accounting') ? 'Consumo Masivo & Comercial' : 'Tecnología & Software',
      companySize: '51_200',
      logoUrl: undefined,
      countryCode: 'CO',
      city: job.locationCity || 'Colombia',
      isVerified: true,
      isAutoIngested: true,
      atsSource: ['greenhouse', 'lever', 'ashby', 'workable'].includes(job.source) ? job.source : 'manual'
    });
  }

  const contractRes = detectContractType(job.title, job.description || '', '');
  let catRes: any = detectTechCategory(job.title, job.description || '');
  if (catRes.category === 'software_dev' && !job.title.toLowerCase().includes('desarroll') && !job.title.toLowerCase().includes('program') && !job.title.toLowerCase().includes('software') && !job.title.toLowerCase().includes('frontend') && !job.title.toLowerCase().includes('backend')) {
    catRes = detectNonTechCategory(job.title, job.description || '');
  }

  const expRes = detectExperience(job.title, job.description || '');
  const engRes = detectEnglishRequirement(job.title, `${job.description || ''} ${compName}`);

  const isZeroExp = Boolean(job.isZeroExperience || expRes.isZeroExperience);
  const expYears = isZeroExp ? 0 : (job.maxYearsExperience || expRes.maxYearsExperience || 1);
  const seniority = (job.seniority || expRes.seniority) === 'senior' ? 'junior' : (job.seniority || expRes.seniority || 'junior');
  const requiresEnglishFinal = Boolean(job.requiresEnglish || engRes.requiresEnglish);
  const englishBadgeTextFinal = requiresEnglishFinal ? 'Requiere inglés' : 'Español';

  const isJobRem = Boolean(job.isRemote || (job.workModality && job.workModality.includes('remote')));

  let rawDisplayLoc = (job.displayLocation || job.locationCity || 'Colombia')
    .replace(/^📍\s*/, '')
    .replace(/^🏠\s*/, '');

  if (isJobRem) {
    rawDisplayLoc = rawDisplayLoc.replace(/^Presencial\s*·\s*/i, 'Remoto · ');
    if (!rawDisplayLoc.toLowerCase().includes('remoto')) {
      rawDisplayLoc = `Remoto · ${rawDisplayLoc}`;
    }
  }

  let cleanDesc = (job.description || '')
    .replace(/Publicada en [^.]+\.?/gi, '')
    .replace(/Postulación verificada en [^.]+\.?/gi, '')
    .replace(/Publicada en LinkedIn[^.]*\.?/gi, '')
    .replace(/Publicada en Computrabajo[^.]*\.?/gi, '')
    .replace(/Publicada en ElEmpleo[^.]*\.?/gi, '')
    .replace(/Postulación verificada para Colombia\.?/gi, '')
    .trim();

  if (!cleanDesc) {
    cleanDesc = `Oportunidad laboral para el cargo de ${job.title} en ${compName} (${rawDisplayLoc}).`;
  }

  // Deterministic counts to prevent SSR hydration mismatch
  const deterministicViews = ((idx * 13 + 27) % 65) + 15;
  const deterministicApps = ((idx * 7 + 11) % 18) + 2;

  // Calculate precise relative timestamp from postedDateText for consistent sorting
  const postedText = (job as any).postedDateText || 'Reciente';
  const BASE_TIME = 1758231700000; // Deterministic reference timestamp
  let calculatedTimestamp = BASE_TIME - (idx * 60000);

  if (postedText) {
    const pLower = postedText.toLowerCase();
    const numMatch = pLower.match(/\d+/);
    const n = numMatch ? parseInt(numMatch[0], 10) : 1;

    if (pLower.includes('min')) {
      calculatedTimestamp = BASE_TIME - (n * 60 * 1000) - (idx * 1000);
    } else if (pLower.includes('hora') || pLower.includes('hour')) {
      calculatedTimestamp = BASE_TIME - (n * 3600 * 1000) - (idx * 1000);
    } else if (pLower.includes('hoy') || pLower.includes('today') || pLower.includes('just now')) {
      calculatedTimestamp = BASE_TIME - (2 * 3600 * 1000) - (idx * 1000);
    } else if (pLower.includes('ayer') || pLower.includes('yesterday')) {
      calculatedTimestamp = BASE_TIME - (24 * 3600 * 1000) - (idx * 1000);
    } else if (pLower.includes('d[ií]a') || pLower.includes('dia') || pLower.includes('day')) {
      calculatedTimestamp = BASE_TIME - (n * 24 * 3600 * 1000) - (idx * 1000);
    } else if (pLower.includes('semana') || pLower.includes('week')) {
      calculatedTimestamp = BASE_TIME - (n * 7 * 24 * 3600 * 1000) - (idx * 1000);
    } else if (pLower.includes('mes') || pLower.includes('month')) {
      calculatedTimestamp = BASE_TIME - (n * 30 * 24 * 3600 * 1000) - (idx * 1000);
    }
  }

  const finalCreatedAt = new Date(calculatedTimestamp).toISOString();

  return {
    id: job.id || `job-co-${idx}`,
    companyId: compId,
    companyName: compName,
    companyLogo: undefined,
    companyWebsite: job.companyDomain ? `https://${job.companyDomain}` : '',
    isCompanyVerified: true,
    title: job.title,
    slug: `${compSlug}-${job.id || idx}`,
    description: cleanDesc,
    workModality: isJobRem ? 'remote_country' : (job.workModality || 'on_site'),
    locationCountry: 'CO',
    locationCity: job.locationCity || 'Colombia',
    salaryMinUsd: job.salaryMinUsdEquivalent || job.salaryMinUsd || 700,
    salaryMaxUsd: job.salaryMaxUsdEquivalent || job.salaryMaxUsd || 1500,
    currency: job.salaryCurrency || 'COP',
    seniorityRequired: seniority,
    englishRequired: requiresEnglishFinal ? (job.englishLevel === 'c1_advanced' ? 'c1_advanced' : 'b2_upper_intermediate') : 'no_english',
    maxYearsExperienceRequired: expYears,
    isZeroExperience: isZeroExp,
    status: 'active',
    expiresAt: '2026-12-31T23:59:59.000Z',
    isAutoIngested: true,
    sourceAts: ['greenhouse', 'lever', 'ashby', 'workable'].includes(job.source) ? job.source : 'manual',
    sourceUrl: job.sourceUrl,
    isClaimed: false,
    viewsCount: deterministicViews,
    applicationsCount: deterministicApps,
    requiredSkills: job.requiredSkills && job.requiredSkills.length > 0 ? job.requiredSkills : ['Comunicación', 'Responsabilidad', 'Trabajo en Equipo'],
    
    // Rich Colombia metadata
    salaryDisclosed: Boolean(job.salaryDisclosed),
    salaryDisplayText: job.salaryDisplayText || 'No especificado en la oferta',
    requiresEnglish: requiresEnglishFinal,
    englishBadgeText: englishBadgeTextFinal,
    displayLocation: rawDisplayLoc,
    locationFilterKey: job.locationFilterKey || (isJobRem ? 'remoto_colombia' : 'colombia'),
    contractType: job.contractType || contractRes.contractType,
    contractTypeLabel: job.contractTypeLabel || contractRes.contractTypeLabel,
    category: job.category || catRes.category,
    categoryLabel: job.categoryLabel || catRes.categoryLabel,
    experienceTier: job.experienceTier || expRes.experienceTier,
    experienceLabel: job.experienceLabel || expRes.experienceLabel,
    applicantCountText: job.applicantCountText || 'Menos de 20 postulantes',
    applicantTier: job.applicantTier || 'low',
    postedDateText: postedText,
    sourceName: job.source || 'Portal Verificado',
    isLinkedInPost: Boolean((job as any).isLinkedInPost),
    postAuthor: (job as any).postAuthor,
    postAuthorHeadline: (job as any).postAuthorHeadline,
    contactEmail: (job as any).contactEmail,
    applicationEmail: (job as any).applicationEmail,
    postHashtags: (job as any).postHashtags,
    isDirectRecruiterPost: Boolean((job as any).isDirectRecruiterPost),
    createdAt: finalCreatedAt
  };
});

export const INITIAL_COMPANIES: Company[] = Array.from(companyMap.values());

export const INITIAL_CANDIDATES: CandidateProfile[] = [
  {
    id: 'cand-1',
    userId: 'user-cand-1',
    firstName: 'Mateo',
    lastName: 'Arboleda Gómez',
    headline: 'Junior Fullstack Developer | React, Node.js & TypeScript',
    bio: 'Desarrollador con 1 año de experiencia construyendo aplicaciones web modernas y reactivas. Apasionado por el ecosistema TypeScript, buenas prácticas de arquitectura y entrega continua.',
    seniority: 'junior',
    englishLevel: 'b2_upper_intermediate',
    yearsOfExperience: 1.0,
    preferredModality: 'remote_country',
    minimumExpectedSalaryUsd: 950,
    currency: 'USD',
    isAnonymous: false,
    isOpenToWork: true,
    countryCode: 'CO',
    city: 'Bogotá, D.C.',
    skills: [
      { id: 'sk-1', name: 'React', isPrimary: true, yearsOfExperience: 1 },
      { id: 'sk-2', name: 'TypeScript', isPrimary: true, yearsOfExperience: 1 },
      { id: 'sk-3', name: 'Node.js', isPrimary: true, yearsOfExperience: 1 },
      { id: 'sk-4', name: 'Next.js', isPrimary: false, yearsOfExperience: 1 },
      { id: 'sk-5', name: 'PostgreSQL', isPrimary: false, yearsOfExperience: 1 },
      { id: 'sk-6', name: 'Tailwind', isPrimary: false, yearsOfExperience: 1 },
      { id: 'sk-7', name: 'Git', isPrimary: false, yearsOfExperience: 1 }
    ],
    linkedinUrl: 'https://linkedin.com',
    githubUrl: 'https://github.com',
    projects: [],
    profileViewsCount: 45,
    inboundsReceivedCount: 4,
    inboundsAcceptedCount: 2,
    createdAt: '2026-09-18T10:00:00.000Z'
  },
  {
    id: 'cand-2',
    userId: 'user-cand-2',
    firstName: 'Valentina',
    lastName: 'Restrepo Morales',
    headline: 'Trainee Data Analyst & BI Specialist | Python, SQL & Power BI',
    bio: 'Egresada con fuerte base analítica y estadística. Creación de dashboards interactivos, modelado de datos relacionales y extracción de insights accionables de negocio.',
    seniority: 'trainee',
    englishLevel: 'c1_advanced',
    yearsOfExperience: 0.0,
    preferredModality: 'remote_worldwide',
    minimumExpectedSalaryUsd: 800,
    currency: 'USD',
    isAnonymous: false,
    isOpenToWork: true,
    countryCode: 'CO',
    city: 'Medellín, Antioquia',
    skills: [
      { id: 'sk-8', name: 'Python', isPrimary: true, yearsOfExperience: 0 },
      { id: 'sk-9', name: 'SQL', isPrimary: true, yearsOfExperience: 0 },
      { id: 'sk-10', name: 'Power BI', isPrimary: true, yearsOfExperience: 0 },
      { id: 'sk-11', name: 'Tableau', isPrimary: false, yearsOfExperience: 0 },
      { id: 'sk-12', name: 'Pandas', isPrimary: false, yearsOfExperience: 0 }
    ],
    linkedinUrl: 'https://linkedin.com',
    githubUrl: 'https://github.com',
    projects: [],
    profileViewsCount: 62,
    inboundsReceivedCount: 6,
    inboundsAcceptedCount: 3,
    createdAt: '2026-09-18T10:00:00.000Z'
  }
];

export const INITIAL_INBOUND_REQUESTS: InboundRequest[] = [];
export const INITIAL_CONVERSATIONS: Conversation[] = [];
