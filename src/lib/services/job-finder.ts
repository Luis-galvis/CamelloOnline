import 'server-only';
import { supabaseAdmin } from '@/lib/supabase-server';
import { INITIAL_JOB_POSTS } from '@/lib/mock-data';
import { JobPost } from '@/types';
import { normalizeLocation } from './scrapers/location-normalizer';
import { detectContractType, getContractTypeLabel } from './scrapers/contract-detector';
import { detectEnglishRequirement } from './scrapers/english-detector';
import { detectExperience } from './scrapers/experience-detector';
import { extractSalary } from './scrapers/salary-extractor';
import { detectJobCategory } from './scrapers/category-detector';

const JOB_SELECT = `
  id,
  company_id,
  title,
  slug,
  description,
  work_modality,
  location_city,
  salary_min_usd,
  salary_max_usd,
  currency,
  seniority_required,
  english_required,
  max_years_experience_required,
  is_zero_experience,
  status,
  expires_at,
  is_auto_ingested,
  source_ats,
  source_url,
  source_job_id,
  is_claimed,
  views_count,
  applications_count,
  created_at,
  companies (
    id,
    name,
    slug,
    logo_url,
    website,
    is_verified
  )
`;

/** Mapea una fila de job_posts (con companies embebida) a un JobPost consumible por la UI de detalle. */
export function mapDbRowToJobPost(row: any): JobPost {
  const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies;
  const companyName = comp?.name || 'Empresa Verificada';
  const title = row.title || '';
  const description = row.description || '';
  const locRes = normalizeLocation(row.location_city || 'Colombia', `${title} ${description}`);
  const expRes = detectExperience(title, description);
  const engRes = detectEnglishRequirement(title, `${description} ${companyName}`);
  const contractRes = detectContractType(title, description, '');
  const salRes = extractSalary(description, '');
  const catRes = detectJobCategory(title, description);

  const isZero = Boolean(row.is_zero_experience);
  const isRemote = Boolean(
    locRes.isRemote ||
    row.work_modality === 'remote_country' ||
    row.work_modality === 'remote_worldwide'
  );
  const displayLocation = (locRes.displayLocation || row.location_city || 'Colombia')
    .replace(/^📍\s*/, '')
    .replace(/^🏠\s*/, '');

  const srcUrl = (row.source_url || '').toLowerCase();
  const sourceName = srcUrl.includes('computrabajo') ? 'Computrabajo'
    : srcUrl.includes('elempleo') ? 'ElEmpleo'
    : srcUrl.includes('torre.ai') ? 'Torre.ai'
    : srcUrl.includes('getonbrd') ? 'Get on Board'
    : srcUrl.includes('greenhouse') ? 'Greenhouse'
    : srcUrl.includes('lever') ? 'Lever'
    : srcUrl.includes('linkedin') ? 'LinkedIn Jobs'
    : srcUrl.includes('weremoto') ? 'WeRemoto'
    : 'Portal Verificado';

  return {
    id: row.id,
    companyId: row.company_id,
    companyName,
    companyLogo: comp?.logo_url || undefined,
    companyWebsite: comp?.website || 'https://camelloonline.com',
    isCompanyVerified: comp?.is_verified ?? true,
    title,
    slug: row.slug,
    description,
    workModality: row.work_modality || locRes.workModality || (isRemote ? 'remote_country' : 'on_site'),
    locationCity: row.location_city || 'Colombia',
    salaryMinUsd: Number(row.salary_min_usd) || 700,
    salaryMaxUsd: Number(row.salary_max_usd) || 1500,
    currency: row.currency || 'COP',
    seniorityRequired: row.seniority_required || 'junior',
    englishRequired: row.english_required || 'no_english',
    maxYearsExperienceRequired: Number(row.max_years_experience_required) || 0,
    isZeroExperience: isZero,
    status: row.status || 'active',
    expiresAt: row.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
    isAutoIngested: Boolean(row.is_auto_ingested),
    sourceAts: row.source_ats || 'manual',
    sourceUrl: row.source_url,
    isClaimed: Boolean(row.is_claimed),
    viewsCount: row.views_count || 0,
    applicationsCount: row.applications_count || 0,
    requiredSkills: catRes.categoryLabel ? [catRes.categoryLabel, 'Comunicación'] : ['Desarrollo de Software', 'Comunicación'],
    salaryDisclosed: salRes.isDisclosed,
    salaryDisplayText: salRes.displayText || 'Salario a convenir',
    requiresEnglish: engRes.requiresEnglish,
    englishBadgeText: engRes.badgeText,
    displayLocation,
    locationFilterKey: locRes.filterKey,
    isRemote,
    contractType: contractRes.contractType,
    contractTypeLabel: getContractTypeLabel(contractRes.contractType),
    category: catRes.category as any,
    categoryLabel: catRes.categoryLabel,
    experienceTier: expRes.experienceTier,
    experienceLabel: isZero ? 'Sin experiencia previa' : expRes.experienceLabel,
    sourceName,
    postedDateText: 'Reciente',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function getJobBySlug(slug: string): Promise<JobPost | null> {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug).toLowerCase().trim();

  try {
    const { data, error } = await supabaseAdmin
      .from('job_posts')
      .select(JOB_SELECT)
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle();

    if (!error && data) {
      return mapDbRowToJobPost(data);
    }
  } catch {
    // caer al fallback de JSON seed
  }

  // Fallback al JSON seed (para build sin conexión a Supabase)
  return (
    INITIAL_JOB_POSTS.find(
      j => (j.slug && j.slug.toLowerCase() === decoded) || (j.id && j.id.toLowerCase() === decoded)
    ) || null
  );
}

export async function getAllJobSlugs(): Promise<string[]> {
  const seen = new Set<string>();
  const slugs: string[] = [];

  try {
    // Paginar todos los slugs activos (PostgREST limita a 1000 por petición)
    for (let from = 0; from < 10000; from += 1000) {
      const { data } = await supabaseAdmin
        .from('job_posts')
        .select('slug')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, from + 999);

      if (!data || data.length === 0) break;
      for (const r of data) {
        if (r.slug && !seen.has(r.slug)) {
          seen.add(r.slug);
          slugs.push(r.slug);
        }
      }
      if (data.length < 1000) break;
    }
  } catch {
    // fallback al JSON seed
  }

  if (slugs.length === 0) {
    for (const j of INITIAL_JOB_POSTS) {
      if (j.slug && !seen.has(j.slug)) {
        seen.add(j.slug);
        slugs.push(j.slug);
      }
    }
  }

  return slugs;
}
