import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';
import { isTechJob } from './tech-filter';
import { detectExperience } from './experience-detector';

const GETONBOARD_CATEGORIES = [
  'programming',
  'data-science-analytics',
  'sysadmin-devops-qa',
  'design-ux'
];

export async function scrapeGetOnBoardColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];

  for (const cat of GETONBOARD_CATEGORIES) {
    try {
      const url = `https://www.getonbrd.com/api/v0/categories/${cat}/jobs?per_page=50&page=1`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) REALJOBS/1.0'
        }
      });

      if (!res.ok) continue;

      const json = await res.json();
      const rawJobs = json.data || [];

      for (const item of rawJobs) {
        const attr = item.attributes || {};
        const title = attr.title || '';
        const description = (attr.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const compData = attr.company?.data?.attributes || {};
        const companyName = compData.name || 'Empresa Tech en GetOnBoard';
        const companyLogo = compData.logo || undefined;
        const publicUrl = item.links?.public_url || `https://www.getonbrd.com/empleos/${item.id}`;
        
        // Strictly verify tech job role
        if (!isTechJob(title, description)) continue;

        const isRemote = Boolean(attr.remote);
        const remoteZone = (attr.remote_zone || '').toLowerCase();
        const countries = (attr.countries || []).map((c: string) => String(c).toLowerCase());
        const country = String(attr.country || '').toLowerCase();
        const rawLocation = String(attr.location || '').toLowerCase();

        // 1. Explicit foreign country rejection
        const isRestrictedToForeign = 
          (remoteZone.includes('chile') && !remoteZone.includes('colombia')) ||
          (remoteZone.includes('argentina') && !remoteZone.includes('colombia')) ||
          (remoteZone.includes('mexico') && !remoteZone.includes('colombia')) ||
          (remoteZone.includes('peru') && !remoteZone.includes('colombia')) ||
          (remoteZone.includes('brazil') && !remoteZone.includes('colombia')) ||
          (remoteZone.includes('spain') || remoteZone.includes('españa')) ||
          (remoteZone.includes('usa') || remoteZone.includes('united states')) ||
          (country.includes('chile') || country.includes('argentina') || country.includes('mexico') || country.includes('peru') || country.includes('spain'));

        if (isRestrictedToForeign && !countries.some((c: string) => c.includes('colombia') || c === 'co')) {
          continue;
        }

        // 2. Must explicitly allow Colombia or open Latam/Worldwide
        const allowsColombia = 
          countries.some((c: string) => c.includes('colombia') || c === 'co') ||
          country.includes('colombia') ||
          country === 'co' ||
          rawLocation.includes('colombia') ||
          rawLocation.includes('bogot') ||
          rawLocation.includes('medell') ||
          rawLocation.includes('cali') ||
          rawLocation.includes('barranqu') ||
          remoteZone.includes('colombia') ||
          remoteZone.includes('anywhere') ||
          remoteZone.includes('worldwide') ||
          remoteZone.includes('latam') ||
          remoteZone.includes('latin america');

        if (!allowsColombia) continue;

        // Accurate Experience Detection
        const expResult = detectExperience(title, description);
        if (!expResult.isEligible) continue;

        // Location normalization
        const locationNorm = normalizeLocation(isRemote ? 'Remoto (Colombia)' : (attr.location || 'Colombia'), `${title} ${description}`);
        if (!locationNorm.isColombiaValid) continue;
        
        // English requirement
        const engResult = detectEnglishRequirement(title, description);

        // Salary extraction
        let salResult = extractSalary(description, '');
        if (!salResult.isDisclosed && attr.min_salary && attr.max_salary) {
          const minUsd = attr.min_salary;
          const maxUsd = attr.max_salary;
          salResult = {
            isDisclosed: true,
            min: minUsd,
            max: maxUsd,
            currency: 'USD',
            displayText: `$${minUsd.toLocaleString()} - $${maxUsd.toLocaleString()} USD / mes`,
            usdEquivalentMin: minUsd,
            usdEquivalentMax: maxUsd
          };
        }

        const skills = extractSkills(`${title} ${description}`);
        const contractRes = detectContractType(title, description, '');
        const catRes = detectTechCategory(title, description);

        jobs.push({
          id: `getonbrd-${item.id}`,
          source: 'getonbrd',
          sourceUrl: publicUrl,
          sourceJobId: String(item.id),
          title: title,
          companyName: companyName,
          companyLogo: companyLogo,
          description: description.slice(0, 800) || `Oportunidad laboral para el cargo de ${title} en ${companyName}.`,
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
          requiredSkills: skills.length > 0 ? skills : ['Tecnología', 'Git', 'Software'],
          contractType: contractRes.contractType,
          contractTypeLabel: contractRes.contractTypeLabel,
          category: catRes.category,
          categoryLabel: catRes.categoryLabel,
          postedDateText: 'Reciente',
          scrapedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn(`[GetOnBrd] Error en categoría ${cat}:`, e);
    }
  }

  return jobs;
}
