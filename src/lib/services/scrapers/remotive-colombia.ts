import { ColombiaScrapedJob } from './types';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectJobCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';
import { decodeHtmlEntities } from './clean-text';
import { detectExperience } from './experience-detector';

const URL = 'https://remotive.com/api/remote-jobs';

export async function scrapeRemotiveColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  try {
    const res = await fetch(URL, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) REALJOBS/1.0',
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.warn('[Remotive] HTTP', res.status);
      return [];
    }

    const data = await res.json();
    const rawJobs = data.jobs || [];

    for (const item of rawJobs) {
      const title = decodeHtmlEntities(item.title || '').trim();
      const companyName = decodeHtmlEntities(item.company_name || 'Empresa Remota');
      const candidateLoc = (item.candidate_required_location || '').toLowerCase();
      const cleanDesc = decodeHtmlEntities((item.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());

      if (!title) continue;

      // Abierto a Colombia / Latam / Worldwide / Anywhere
      const allows = ['colombia', 'latin america', 'latam', 'worldwide', 'anywhere', 'americas', 'global'].some(k => candidateLoc.includes(k)) || candidateLoc === '';
      const foreignRestricted =
        /usa|united states|us only|u\.s\.|united kingdom|\buk\b|europe|canada|germany|india|australia|japan|singapore/i.test(candidateLoc) &&
        !/worldwide|anywhere|global|latam|latin america|americas/.test(candidateLoc);
      if (!allows || foreignRestricted) continue;

      const exp = detectExperience(title, cleanDesc);
      const eng = detectEnglishRequirement(title, cleanDesc);
      const contract = detectContractType(title, cleanDesc, '');
      const cat = detectJobCategory(title, cleanDesc);
      const skills = extractSkills(`${title} ${cleanDesc}`);
      const sal = extractSalary(cleanDesc, item.salary || '');

      jobs.push({
        id: `remotive-${item.id}`,
        source: 'remotive',
        sourceUrl: item.url || '',
        sourceJobId: String(item.id),
        title,
        companyName,
        companyLogo: item.company_logo || undefined,
        description: cleanDesc.slice(0, 800) || `Vacante remota: ${title} en ${companyName}.`,
        locationCity: 'Remoto (Global)',
        locationCountry: 'CO',
        displayLocation: '🌎 Remoto · Global',
        locationFilterKey: 'remoto_colombia',
        isRemote: true,
        workModality: 'remote_worldwide',
        salaryDisclosed: sal.isDisclosed,
        salaryMin: sal.min,
        salaryMax: sal.max,
        salaryCurrency: sal.currency || 'USD',
        salaryDisplayText: sal.displayText || sal.salaryDisplayText || 'Salario a convenir',
        salaryMinUsdEquivalent: sal.usdEquivalentMin,
        salaryMaxUsdEquivalent: sal.usdEquivalentMax,
        requiresEnglish: eng.requiresEnglish,
        englishLevel: eng.englishLevel,
        englishLevelLabel: eng.levelLabel,
        englishBadgeText: eng.badgeText,
        seniority: exp.seniority === 'senior' ? 'junior' : exp.seniority,
        maxYearsExperience: exp.isZeroExperience ? 0 : Math.min(2, exp.maxYearsExperience || 1),
        minYearsExperience: exp.minYears ?? 0,
        isZeroExperience: exp.isZeroExperience,
        experienceTier: exp.experienceTier,
        experienceLabel: exp.experienceLabel,
        experienceLevelLabel: exp.experienceLabel,
        requiredSkills: skills.length > 0 ? skills : [cat.categoryLabel || 'Remoto', 'Inglés'],
        contractType: contract.contractType,
        contractTypeLabel: contract.contractTypeLabel,
        category: cat.category,
        categoryLabel: cat.categoryLabel,
        postedDateText: 'Reciente',
        scrapedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('[Remotive] error:', e);
  }

  console.log(`[Remotive] ${jobs.length} vacantes remotas recolectadas.`);
  return jobs;
}
