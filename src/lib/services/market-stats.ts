import 'server-only';
import { supabaseAdmin } from '@/lib/supabase-server';
import { detectJobCategory } from './scrapers/category-detector';
import { mapDbRowToJobPost } from './job-finder';
import { JobPost } from '@/types';

const JOB_SELECT = `
  id, company_id, title, slug, description, work_modality, location_city,
  salary_min_usd, salary_max_usd, currency, seniority_required, english_required,
  max_years_experience_required, is_zero_experience, status, expires_at,
  is_auto_ingested, source_ats, source_url, source_job_id, is_claimed,
  views_count, applications_count, created_at, updated_at,
  companies (id, name, slug, logo_url, website, is_verified)
`;

/** Trae TODAS las vacantes activas (paginado). Devuelve [] si la BD no responde. */
export async function fetchActiveRows(): Promise<any[]> {
  const rows: any[] = [];
  try {
    for (let from = 0; from < 50000; from += 1000) {
      const { data } = await supabaseAdmin
        .from('job_posts')
        .select(JOB_SELECT)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, from + 999);
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < 1000) break;
    }
  } catch (e) {
    console.warn('[market-stats] Error trayendo vacantes activas:', e);
  }
  return rows;
}

export interface NewTodayByProfile {
  category: string;
  label: string;
  count: number;
}

export interface CompanyRank {
  name: string;
  slug: string;
  isVerified: boolean;
  total: number;
  sinExperiencia: number;
  remotas: number;
  usd: number;
  conSalario: number;
}

export interface MarketStats {
  totalActive: number;
  remote: number;
  zeroExp: number;
  remoteZeroExp: number;
  requiresEnglish: number;
  hybrid: number;
  byCategory: { category: string; label: string; count: number }[];
  byModality: { modality: string; count: number }[];
  newToday: number;
  newTodayByProfile: NewTodayByProfile[];
  topCompaniesJunior: CompanyRank[];
  topCompaniesRemote: CompanyRank[];
  salary: { disclosed: number; avgMonthlyUsd: number | null; min: number | null; max: number | null };
  lastUpdated: string;
}

export async function getMarketStats(): Promise<MarketStats> {
  const rows = await fetchActiveRows();
  const todayStr = new Date().toISOString().slice(0, 10);

  const byCategory = new Map<string, number>();
  const categoryLabels = new Map<string, string>();
  const byModality = new Map<string, number>();
  const newTodayByCat = new Map<string, number>();
  const companyAgg = new Map<string, CompanyRank>();

  let remote = 0, zero = 0, remoteZero = 0, english = 0, hybrid = 0, newToday = 0;
  const salaries: number[] = [];

  for (const r of rows) {
    const catRes = detectJobCategory(r.title || '', r.description || '');
    const cat = catRes.category;
    categoryLabels.set(cat, catRes.categoryLabel);
    byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
    const mod = r.work_modality || 'on_site';
    byModality.set(mod, (byModality.get(mod) || 0) + 1);

    const isRemote = mod === 'remote_country' || mod === 'remote_worldwide';
    const isZero = r.is_zero_experience === true;
    if (isRemote) remote++;
    if (isZero) zero++;
    if (isRemote && isZero) remoteZero++;
    if (mod === 'hybrid') hybrid++;
    if (r.english_required && r.english_required !== 'no_english') english++;

    const day = (r.created_at || '').slice(0, 10);
    if (day === todayStr) {
      newToday++;
      newTodayByCat.set(cat, (newTodayByCat.get(cat) || 0) + 1);
    }

    // salario real (excluye el default de 700 USD que usa el pipeline cuando no hay dato)
    const sal = Number(r.salary_min_usd);
    if (sal > 0 && sal !== 700 && sal !== 1500) salaries.push(sal);

    const comp = Array.isArray(r.companies) ? r.companies[0] : r.companies;
    const cname = comp?.name || 'Empresa Confidencial';
    const cslug = comp?.slug || 'empresa';
    if (!companyAgg.has(cname)) {
      companyAgg.set(cname, {
        name: cname, slug: cslug, isVerified: Boolean(comp?.is_verified),
        total: 0, sinExperiencia: 0, remotas: 0, usd: 0, conSalario: 0,
      });
    }
    const c = companyAgg.get(cname)!;
    c.total++;
    if (isZero) c.sinExperiencia++;
    if (isRemote) c.remotas++;
    const isUsd = (r.currency === 'USD') || (sal > 0 && sal >= 1000);
    if (isUsd) c.usd++;
    if (sal > 0 && sal !== 700 && sal !== 1500) c.conSalario++;
  }

  const sortedCompanies = Array.from(companyAgg.values());
  const topCompaniesJunior = [...sortedCompanies]
    .sort((a, b) => b.sinExperiencia - a.sinExperiencia || b.total - a.total)
    .slice(0, 12);
  const topCompaniesRemote = [...sortedCompanies]
    .sort((a, b) => b.remotas - a.remotas || b.usd - a.usd)
    .slice(0, 12);

  const byCategorySorted = Array.from(byCategory.entries())
    .map(([category, count]) => ({
      category,
      label: category === 'general_remote' ? 'Otros / Sin clasificar' : (categoryLabels.get(category) || category),
      count,
    }))
    .sort((a, b) => ((a.category === 'general_remote' ? 1 : 0) - (b.category === 'general_remote' ? 1 : 0)) || (b.count - a.count));

  const byModalitySorted = Array.from(byModality.entries())
    .map(([modality, count]) => ({ modality, count }))
    .sort((a, b) => b.count - a.count);

  const newTodayByProfile = Array.from(newTodayByCat.entries())
    .map(([category, count]) => ({
      category,
      label: category === 'general_remote' ? 'Otros / Sin clasificar' : (categoryLabels.get(category) || category),
      count,
    }))
    .sort((a, b) => ((a.category === 'general_remote' ? 1 : 0) - (b.category === 'general_remote' ? 1 : 0)) || (b.count - a.count));

  let avg: number | null = null;
  if (salaries.length > 0) avg = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);

  return {
    totalActive: rows.length,
    remote, zeroExp: zero, remoteZeroExp: remoteZero,
    requiresEnglish: english, hybrid,
    byCategory: byCategorySorted,
    byModality: byModalitySorted,
    newToday,
    newTodayByProfile,
    topCompaniesJunior,
    topCompaniesRemote,
    salary: {
      disclosed: salaries.length,
      avgMonthlyUsd: avg,
      min: salaries.length ? Math.round(Math.min(...salaries)) : null,
      max: salaries.length ? Math.round(Math.max(...salaries)) : null,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/** Devuelve vacantes mapeadas (JobPost) para páginas de nicho. */
export async function getJobsByFilter(
  filter: 'sin-experiencia' | 'primer-empleo' | 'remoto-usd',
  limit = 30
): Promise<JobPost[]> {
  const rows = await fetchActiveRows();
  let matched = rows.filter(r => {
    const title = (r.title || '').toLowerCase();
    if (filter === 'sin-experiencia') {
      return r.is_zero_experience === true;
    }
    if (filter === 'primer-empleo') {
      return r.is_zero_experience === true ||
        r.seniority_required === 'trainee' || r.seniority_required === 'intern' ||
        /practicante|aprendiz|pasante|sena|semillero|trainee|intern/.test(title);
    }
    // remoto-usd
    const isRemote = r.work_modality === 'remote_country' || r.work_modality === 'remote_worldwide';
    const sal = Number(r.salary_min_usd);
    return isRemote && (r.currency === 'USD' || (sal > 0 && sal >= 1000));
  });
  return matched.slice(0, limit).map((r: any) => mapDbRowToJobPost(r));
}
