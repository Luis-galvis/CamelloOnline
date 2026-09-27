import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { detectNonTechCategory } from './non-tech-remote-colombia';
import { extractSkills } from '../ats-ingestion';
import { detectExperience } from './experience-detector';

// Seniority IDs from GetOnBoard API:
//  1 = Sin experiencia
//  2 = Junior
//  3 = Semi Senior (excluded)
//  4 = Senior     (excluded)
//  5 = Expert     (excluded)
const ELIGIBLE_SENIORITY_IDS = new Set([1, 2]);

// Tech Category endpoints on GetOnBoard
const TECH_CATEGORY_ENDPOINTS = [
  'programming',
  'data-science-analytics',
  'sysadmin-devops-qa',
  'mobile-developer',
  'ui-ux-design',
  'cybersecurity'
];

// Search queries that yield Colombia/Remote + junior results
const SEARCH_QUERIES = [
  'colombia',
  'junior',
  'trainee',
  'intern',
  'practicante',
  'practicante colombia',
  'aprendiz',
  'desarrollador colombia',
  'developer colombia',
  'software colombia',
  'frontend colombia',
  'backend colombia',
  'full stack colombia',
  'python colombia',
  'react colombia',
  'data analyst colombia',
  'qa colombia',
  'soporte ti',
  'soporte',
  'support',
  'customer service',
  'marketing',
  'ventas',
  'sales',
  'contabilidad',
  'administrativo',
  'rrhh',
  'diseño',
  'finanzas colombia',
  'asistente',
  'bilingual',
  'english spanish',
];

// Accept these country strings from GetOnBoard
const ALLOWED_COUNTRIES = new Set([
  'colombia',
  'co',
  'remote',
  'remoto',
  'latam',
  'latin america',
  'latinoamérica',
  'worldwide',
  'anywhere',
]);

function isCountryEligible(countries: string[], remote: boolean, remoteZone: string | null): boolean {
  if (remote && (!countries.length || countries.some((c) => ALLOWED_COUNTRIES.has(c.toLowerCase())))) {
    return true;
  }
  if (countries.some((c) => ALLOWED_COUNTRIES.has(c.toLowerCase()))) return true;
  if (remoteZone) {
    const rz = remoteZone.toLowerCase();
    if (
      rz.includes('latam') ||
      rz.includes('latin') ||
      rz.includes('colombia') ||
      rz.includes('anywhere') ||
      rz.includes('worldwide')
    ) {
      return true;
    }
  }
  return false;
}

function isTitleSenior(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes('senior') ||
    t.includes(' sr.') ||
    t.includes(' sr ') ||
    t.startsWith('sr.') ||
    t.includes(' lead') ||
    t.includes('principal') ||
    t.includes('director') ||
    t.includes('head of') ||
    t.includes(' vp ') ||
    t.includes('chief') ||
    t.includes('gerente') ||
    t.includes('jefe de')
  );
}

export async function scrapeGetOnBoardColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch direct tech category feeds
  const targetEndpoints: { url: string; query: string }[] = [];
  for (const cat of TECH_CATEGORY_ENDPOINTS) {
    targetEndpoints.push({
      url: `https://www.getonbrd.com/api/v0/categories/${cat}/jobs`,
      query: cat
    });
  }
  for (const query of SEARCH_QUERIES) {
    targetEndpoints.push({
      url: `https://www.getonbrd.com/api/v0/search/jobs?query=${encodeURIComponent(query)}`,
      query
    });
  }

  for (const target of targetEndpoints) {
    try {
      const res = await fetch(target.url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; REALJOBS/1.0)',
        },
      });

      if (!res.ok) {
        continue;
      }

      const json = await res.json();
      const rawJobs: any[] = json.data || [];

      for (const item of rawJobs) {
        const id = String(item.id || '');
        if (!id || seenIds.has(id)) continue;

        const attr = item.attributes || {};
        const title: string = (attr.title || '').trim();
        if (!title) continue;

        // ── Seniority filter ──────────────────────────────────────────
        const seniorityId = Number(attr.seniority?.data?.id ?? -1);
        // If API provides a seniority and it's neither junior nor sin-experiencia → skip
        if (seniorityId !== -1 && !ELIGIBLE_SENIORITY_IDS.has(seniorityId)) continue;
        // Belt-and-suspenders: also check title keywords
        if (isTitleSenior(title)) continue;

        // ── Country / Remote filter ───────────────────────────────────
        const isRemote: boolean = Boolean(attr.remote);
        const remoteZone: string = attr.remote_zone || '';
        const countries: string[] = (attr.countries || []).map((c: any) => String(c));

        if (!isCountryEligible(countries, isRemote, remoteZone)) continue;

        seenIds.add(id);

        // ── Description ───────────────────────────────────────────────
        const rawDesc = [
          attr.description_headline,
          attr.description,
          attr.functions,
          attr.benefits,
          attr.desirable,
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // ── Experience ────────────────────────────────────────────────
        const isZeroExpSearch = seniorityId === 1 || target.query.includes('sin experiencia') || target.query.includes('aprendiz') || target.query.includes('intern') || target.query.includes('trainee');
        const expResult = detectExperience(title, rawDesc, {
          isZeroExpSearch,
          query: target.query,
        });
        if (!expResult.isEligible) continue;

        // ── Location ──────────────────────────────────────────────────
        const rawLocation =
          countries.find((c) => c.toLowerCase() !== 'remote')
            ? countries.find((c) => c.toLowerCase() !== 'remote')!
            : isRemote
            ? 'Remoto (Colombia)'
            : 'Colombia';

        const locationNorm = normalizeLocation(
          isRemote ? 'Remoto (Colombia)' : rawLocation,
          `${title} ${rawDesc}`
        );
        if (!locationNorm.isColombiaValid) continue;

        // ── Company ───────────────────────────────────────────────────
        const compData = attr.company?.data?.attributes || {};
        const companyName: string = compData.name || 'Empresa en GetOnBoard';
        const companyLogo: string | undefined = compData.logo || undefined;
        const publicUrl: string =
          item.links?.public_url || `https://www.getonbrd.com/empleos/${id}`;

        // ── Salary ────────────────────────────────────────────────────
        let salResult = extractSalary(rawDesc, '');
        if (!salResult.isDisclosed && attr.min_salary && attr.max_salary) {
          salResult = {
            isDisclosed: true,
            min: attr.min_salary,
            max: attr.max_salary,
            currency: 'USD',
            displayText: `$${Number(attr.min_salary).toLocaleString()} - $${Number(attr.max_salary).toLocaleString()} USD / mes`,
            usdEquivalentMin: attr.min_salary,
            usdEquivalentMax: attr.max_salary,
          };
        }

        // ── Metadata ─────────────────────────────────────────────────
        const engResult = detectEnglishRequirement(title, rawDesc);
        const skills = extractSkills(`${title} ${rawDesc}`);
        const contractRes = detectContractType(title, rawDesc, '');

        const categoryName = (attr.category_name || '').toLowerCase();
        const isNonTech =
          categoryName.includes('sales') ||
          categoryName.includes('customer') ||
          categoryName.includes('support') ||
          categoryName.includes('operations') ||
          categoryName.includes('marketing') ||
          categoryName.includes('content') ||
          categoryName.includes('admin') ||
          categoryName.includes('education') ||
          categoryName.includes('finance');

        const catRes = isNonTech
          ? detectNonTechCategory(title, rawDesc)
          : detectTechCategory(title, rawDesc);

        jobs.push({
          id: `getonbrd-${id}`,
          source: 'getonbrd',
          sourceUrl: publicUrl,
          sourceJobId: id,
          title,
          companyName,
          companyLogo,
          description:
            rawDesc.slice(0, 800) ||
            `Oportunidad laboral para el cargo de ${title} en ${companyName}.`,
          locationCity: locationNorm.city,
          locationDepartment: locationNorm.department,
          locationCountry: 'CO',
          displayLocation: locationNorm.displayLocation,
          locationFilterKey: locationNorm.filterKey,
          isRemote: locationNorm.isRemote,
          workModality: locationNorm.workModality,
          salaryDisclosed: salResult.isDisclosed,
          salaryMin: salResult.min,
          salaryMax: salResult.max,
          salaryCurrency: salResult.currency,
          salaryDisplayText: salResult.displayText,
          salaryMinUsdEquivalent: salResult.usdEquivalentMin,
          salaryMaxUsdEquivalent: salResult.usdEquivalentMax,
          requiresEnglish: engResult.requiresEnglish,
          englishLevel: engResult.englishLevel,
          englishBadgeText: engResult.badgeText,
          seniority: expResult.seniority === 'senior' ? 'junior' : expResult.seniority,
          maxYearsExperience: expResult.isZeroExperience ? 0 : expResult.maxYearsExperience,
          isZeroExperience: expResult.isZeroExperience,
          requiredSkills:
            skills.length > 0 ? skills : ['Tecnología', 'Git', 'Software'],
          contractType: contractRes.contractType,
          contractTypeLabel: contractRes.contractTypeLabel,
          category: catRes.category as any,
          categoryLabel: catRes.categoryLabel,
          postedDateText: 'Reciente',
          scrapedAt: new Date().toISOString(),
        });
      }

      // Throttle between queries
      await new Promise((r) => setTimeout(r, 200));
    } catch (e: any) {
      console.warn(`[GetOnBrd] Error en query "${query}":`, e.message);
    }
  }

  console.log(`[GetOnBrd] Total eligible jobs collected: ${jobs.length}`);
  return jobs;
}
