import { ColombiaScrapedJob } from './types';
import { detectExperience } from './experience-detector';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectJobCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';

// Dataset abierto y gratuito de empleos tech LATAM-eligible (normalizado, ~1.400 postings/día).
// Fuente: https://github.com/JuanCarlosGuti/latam-tech-jobs
const URL = 'https://api.apify.com/v2/key-value-stores/crearcode~latam-tech-jobs/records/latest';

// Pre-filtro liviano: el pipeline ya descarta senior/lead vía detectExperience.
const SENIOR_TITLE = /\b(senior|sr\.?|lead|principal|staff|director|gerente|arquitecto|architect|jefe\s*de)\b/i;

export async function scrapeLatamTechJobs(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  try {
    const res = await fetch(URL, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.warn('[latam-tech-jobs] HTTP', res.status);
      return [];
    }
    const data = await res.json();
    const list: any[] = Array.isArray(data) ? data : (data?.postings || data?.jobs || []);

    for (const j of list) {
      if (j.latamFriendly === false) continue;
      const title = (j.title || '').trim();
      if (!title) continue;
      if (SENIOR_TITLE.test(title)) continue; // el pipeline junior no muestra senior/lead

      const isRemote = j.workMode === 'remote' || /remote|remot[oa]/i.test(j.locationRaw || '');
      // Presencial solo si es Colombia; remoto de cualquier LATAM/global.
      if (!isRemote && j.countryCode && String(j.countryCode).toUpperCase() !== 'CO') continue;

      const desc = (j.description || '').slice(0, 1500);
      const exp = detectExperience(title, desc);
      const eng = detectEnglishRequirement(title, desc);
      const contract = detectContractType(title, desc, '');
      const cat = detectJobCategory(title, desc);
      const skills = extractSkills(`${title} ${desc}`);

      let salMin: number | undefined, salMax: number | undefined;
      if (j.salary?.annualizedMin) {
        salMin = Math.round(Number(j.salary.annualizedMin) / 12);
        salMax = j.salary.annualizedMax ? Math.round(Number(j.salary.annualizedMax) / 12) : salMin;
      }

      const companyName = j.companyName || j.companySlug || 'Empresa';
      const sourceJobId = String(j.id || j.url || `${j.companySlug}-${title}`).slice(0, 80);

      jobs.push({
        id: `latam-${sourceJobId}`,
        source: 'latam',
        sourceUrl: j.url || '',
        sourceJobId,
        title,
        companyName,
        companyDomain: `${j.companySlug || 'remote'}.com`,
        description: desc || `Vacante tech LATAM: ${title} en ${companyName}.`,
        locationCity: isRemote ? 'Remoto (LATAM)' : (j.locationRaw || 'Colombia'),
        locationDepartment: undefined,
        locationCountry: j.countryCode || 'CO',
        displayLocation: isRemote ? '🌎 Remoto · LATAM' : (j.locationRaw || 'Colombia'),
        locationFilterKey: isRemote ? 'remoto_colombia' : 'colombia',
        isRemote,
        workModality: isRemote ? 'remote_worldwide' : (j.workMode === 'hybrid' ? 'hybrid' : 'on_site'),
        salaryDisclosed: salMin != null,
        salaryMinUsd: salMin,
        salaryMaxUsd: salMax,
        salaryMinUsdEquivalent: salMin,
        salaryMaxUsdEquivalent: salMax,
        salaryCurrency: 'USD',
        salaryDisplayText: salMin != null ? `$${salMin} - $${salMax} USD / mes` : 'Salario a convenir',
        salaryPeriod: 'monthly',
        requiresEnglish: eng.requiresEnglish,
        englishLevel: (eng.englishLevel === 'no_english_required' ? 'b2_upper_intermediate' : eng.englishLevel) as any,
        englishLevelLabel: eng.levelLabel,
        englishBadgeText: eng.badgeText,
        seniority: exp.seniority === 'senior' ? 'junior' : exp.seniority,
        maxYearsExperience: Math.min(2, exp.maxYearsExperience || 1),
        minYearsExperience: exp.minYears ?? 0,
        isZeroExperience: exp.isZeroExperience,
        experienceTier: exp.experienceTier,
        experienceLabel: exp.experienceLabel,
        experienceLevelLabel: exp.experienceLabel,
        requiredSkills: skills.length > 0 ? skills : [cat.categoryLabel || 'Tech', 'Inglés'],
        contractType: contract.contractType,
        contractTypeLabel: contract.contractTypeLabel,
        category: cat.category,
        categoryLabel: cat.categoryLabel,
        postedDateText: 'Reciente',
        scrapedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('[latam-tech-jobs] error:', e);
  }

  console.log(`[latam-tech-jobs] ${jobs.length} vacantes tech LATAM elegibles recolectadas.`);
  return jobs;
}
