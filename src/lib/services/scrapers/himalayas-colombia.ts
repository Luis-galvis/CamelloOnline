import { ColombiaScrapedJob } from './types';
import { detectExperience } from './experience-detector';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectJobCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';

const API = 'https://himalayas.app/jobs/api';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Convierte el salario de Himalayas a USD mensual. */
function toMonthlyUsd(min: any, max: any, period: string | null, currency: string | null): { min?: number; max?: number } {
  if (currency && currency !== 'USD') return {}; // solo USD por ahora
  const periodLower = (period || 'annual').toLowerCase();
  const mult = periodLower === 'hourly' ? 160 : periodLower === 'annual' ? 1 / 12 : 1;
  const minNum = min != null ? Number(min) * mult : undefined;
  const maxNum = max != null ? Number(max) * mult : undefined;
  return { min: minNum, max: maxNum };
}

function mapSeniority(seniorityList: string[] | undefined, title: string): ColombiaScrapedJob['seniority'] {
  const sen = (seniorityList || []).map(s => String(s).toLowerCase()).join(' ');
  if (/intern|trainee/.test(sen)) return 'intern';
  if (/junior|entry|graduate|early|associate/.test(sen)) return 'junior';
  const t = title.toLowerCase();
  if (/intern|trainee|practicante|pasant/.test(t)) return 'intern';
  if (/junior|jr|entry|graduate/.test(t)) return 'junior';
  return 'junior';
}

function mapCategory(parentCategories: string[] | undefined, title: string): { category: any; label: string } {
  const pc = (parentCategories || []).map(s => String(s).toLowerCase());
  const full = pc.join(' ') + ' ' + title.toLowerCase();
  if (pc.includes('developer') || pc.includes('engineering') || /developer|engineer|software|programador|desarrollador/.test(full)) {
    return { category: 'software_dev', label: 'Desarrollo de Software' };
  }
  if (/data|analytics|machine learning|ai/.test(full)) return { category: 'data_ai', label: 'Datos, IA & Analytics' };
  if (/qa|quality|test/.test(full)) return { category: 'qa_testing', label: 'QA & Testing' };
  if (/design|ux|ui|product/.test(full)) return { category: 'ui_ux_product', label: 'Diseño & Producto' };
  if (/sales|comercial|ventas|account executive|business development/.test(full)) return { category: 'sales_commercial', label: 'Ventas & Comercial' };
  if (/marketing|content|community|social media|seo/.test(full)) return { category: 'marketing_digital', label: 'Marketing & Contenido' };
  if (/customer|support|service/.test(full)) return { category: 'customer_service', label: 'Servicio al Cliente' };
  if (/finance|accounting|contab|finanz/.test(full)) return { category: 'finance_accounting', label: 'Finanzas & Contabilidad' };
  if (/operation|admin|assistant|virtual/.test(full)) return { category: 'virtual_assistant_ops', label: 'Operaciones & Asistencia' };
  if (/human resources|recruiting|talent|hr/.test(full)) return { category: 'hr_recruiting', label: 'RRHH & Reclutamiento' };
  return { category: 'general_remote', label: 'Remoto General' };
}

export async function scrapeHimalayasColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  const MAX_PAGES = 12; // 12 * 50 = hasta 600 candidatos por corrida

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${API}?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    let data: any;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
      if (!res.ok) break;
      data = await res.json();
    } catch {
      break;
    }

    const list: any[] = data?.jobs || [];
    if (list.length === 0) break;

    for (const j of list) {
      const title = (j.title || '').trim();
      if (!title) continue;

      // --- Filtro de ubicación: solo Colombia / Latam / Worldwide / Anywhere ---
      const locs: string[] = (j.locationRestrictions || []).map((s: any) => String(s).toLowerCase());
      const isWorldwide = locs.length === 0;
      const isColombiaEligible = locs.some(l =>
        l.includes('colombia') || l.includes('latam') || l.includes('latin america') ||
        l.includes('americas') || l.includes('anywhere') || l.includes('worldwide') || l.includes('global')
      );
      if (!isWorldwide && !isColombiaEligible) continue;

      // --- Filtro seniority: descartar roles senior/mid/lead ---
      const senStr = (j.seniority || []).map((s: any) => String(s).toLowerCase()).join(' ');
      if (/\b(senior|lead|staff|principal|director|manager|head|vp|mid-level|mid level|chief|executive)\b/.test(senStr)) continue;

      const guid = String(j.guid || j.applicationLink || '');
      const key = String(j.guid || `${j.companySlug}-${j.title}`).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const desc = stripHtml(j.description || j.excerpt || '').slice(0, 1500);
      const sal = toMonthlyUsd(j.minSalary, j.maxSalary, j.salaryPeriod, j.currency);
      const cat = mapCategory(j.parentCategories, title);
      const exp = detectExperience(title, desc);
      const eng = detectEnglishRequirement(title, desc);
      const contract = detectContractType(title, desc, '');
      const skills = extractSkills(`${title} ${desc}`);
      const seniority = mapSeniority(j.seniority, title);

      const applyUrl = String(j.applicationLink || guid).split('?')[0];
      const isZero = exp.isZeroExperience || /intern|trainee|no experience|entry level|0 experience/.test(desc.slice(0, 400).toLowerCase());

      jobs.push({
        id: `himalayas-${key.replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`,
        source: 'himalayas',
        sourceUrl: applyUrl,
        sourceJobId: String(j.guid || key).slice(0, 80),
        title,
        companyName: j.companyName || 'Empresa Remota',
        companyDomain: `${j.companySlug || 'remote'}.com`,
        companyLogo: j.companyLogo || undefined,
        description: desc || `Vacante remota: ${title} en ${j.companyName || 'empresa global'}.`,
        locationCity: isWorldwide ? 'Remoto (Mundial)' : 'Remoto (Colombia)',
        locationCountry: 'CO',
        displayLocation: isWorldwide ? '🌎 Remoto · Mundial' : '🏠 Remoto · Colombia / Latam',
        locationFilterKey: 'remoto_colombia',
        isRemote: true,
        workModality: isWorldwide ? 'remote_worldwide' : 'remote_country',
        salaryDisclosed: sal.min != null || sal.max != null,
        salaryMinUsd: sal.min,
        salaryMaxUsd: sal.max,
        salaryMinUsdEquivalent: sal.min,
        salaryMaxUsdEquivalent: sal.max,
        salaryCurrency: 'USD',
        salaryDisplayText: sal.min != null ? `$${Math.round(sal.min)} - $${Math.round(sal.max ?? sal.min)} USD / mes` : 'Salario a convenir',
        salaryPeriod: 'monthly',
        requiresEnglish: eng.requiresEnglish || true,
        englishLevel: (eng.englishLevel === 'no_english_required' ? 'b2_upper_intermediate' : eng.englishLevel) as any,
        englishLevelLabel: eng.levelLabel,
        englishBadgeText: eng.badgeText,
        seniority,
        maxYearsExperience: isZero ? 0 : Math.min(2, exp.maxYearsExperience || 1),
        minYearsExperience: isZero ? 0 : (exp.minYears ?? 0),
        isZeroExperience: isZero,
        experienceTier: isZero ? 'zero_exp' : exp.experienceTier,
        experienceLabel: isZero ? 'Sin experiencia previa' : exp.experienceLabel,
        experienceLevelLabel: isZero ? 'Sin experiencia previa' : exp.experienceLabel,
        requiredSkills: skills.length > 0 ? skills : [cat.label, 'Inglés', 'Trabajo Remoto'],
        contractType: contract.contractType,
        contractTypeLabel: contract.contractTypeLabel,
        category: cat.category,
        categoryLabel: cat.label,
        postedDateText: 'Reciente',
        scrapedAt: new Date().toISOString(),
      });
    }

    cursor = data?.nextCursor;
    if (!cursor) break;
    await sleep(250);
  }

  console.log(`[Himalayas] ${jobs.length} vacantes remotas elegibles para Colombia/Latam recolectadas.`);
  return jobs;
}
