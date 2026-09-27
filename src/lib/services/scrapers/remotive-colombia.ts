import { ColombiaScrapedJob } from './types';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';
import { decodeHtmlEntities } from './clean-text';
import { isTechJob } from './tech-filter';
import { detectExperience } from './experience-detector';

export async function scrapeRemotiveColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const categories = ['software-dev', 'data', 'qa', 'devops', 'product', 'design'];

  for (const cat of categories) {
    try {
      const url = `https://remotive.com/api/remote-jobs?category=${cat}`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) REALJOBS/1.0'
        }
      });

      if (!res.ok) continue;

      const data = await res.json();
      const rawJobs = data.jobs || [];

      for (const item of rawJobs) {
        const title = decodeHtmlEntities(item.title || '');
        const companyName = decodeHtmlEntities(item.company_name || 'Empresa Tech Global');
        const candidateLoc = (item.candidate_required_location || '').toLowerCase();
        const rawSalary = item.salary || '';
        const descriptionHtml = item.description || '';
        const cleanDesc = decodeHtmlEntities(descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());

        // Must strictly be a tech job role
        if (!isTechJob(title, cleanDesc)) continue;

        // Must be open to Colombia / Latam / Worldwide
        const allowsColombia = 
          candidateLoc.includes('colombia') ||
          candidateLoc.includes('latin america') ||
          candidateLoc.includes('latam') ||
          candidateLoc.includes('worldwide') ||
          candidateLoc.includes('anywhere') ||
          candidateLoc === '';

        // Exclude foreign-specific restrictions
        const isForeignRestricted = 
          (candidateLoc.includes('usa') || candidateLoc.includes('united states') || candidateLoc.includes('us only')) ||
          (candidateLoc.includes('uk') || candidateLoc.includes('united kingdom') || candidateLoc.includes('europe')) ||
          (candidateLoc.includes('canada') || candidateLoc.includes('germany') || candidateLoc.includes('india'));

        if (!allowsColombia || isForeignRestricted) continue;

        // Accurate Experience detection (0 - 5 YoE)
        const expResult = detectExperience(title, cleanDesc);
        if (!expResult.isEligible) continue;

        const pubDate = item.publication_date ? new Date(item.publication_date) : new Date();
        const ageDays = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays > 45) continue;

        const salResult = extractSalary(cleanDesc, rawSalary);
        const engResult = detectEnglishRequirement(title, cleanDesc);
        const skills = extractSkills(`${title} ${cleanDesc}`);
        const contractRes = detectContractType(title, cleanDesc, '');
        const catRes = detectTechCategory(title, cleanDesc);

        jobs.push({
          id: `remotive-${item.id}`,
          source: 'lever', // mapped for ATS icon/consistency
          sourceUrl: item.url,
          sourceJobId: String(item.id),
          title: title,
          companyName: companyName,
          companyLogo: item.company_logo || undefined,
          description: cleanDesc.slice(0, 800) || `Oportunidad remota internacional para ${title} en ${companyName}.`,
          locationCity: 'Remoto (Colombia)',
          locationCountry: 'CO',
          displayLocation: 'Remoto (Colombia / Global)',
          locationFilterKey: 'remoto_colombia',
          isRemote: true,
          workModality: 'remote_worldwide',
          salaryDisclosed: salResult.isDisclosed,
          salaryMin: salResult.min,
          salaryMax: salResult.max,
          salaryCurrency: salResult.currency || 'USD',
          salaryDisplayText: salResult.displayText,
          salaryMinUsdEquivalent: salResult.usdEquivalentMin,
          salaryMaxUsdEquivalent: salResult.usdEquivalentMax,
          requiresEnglish: engResult.requiresEnglish,
          englishLevel: engResult.englishLevel,
          englishBadgeText: engResult.badgeText,
          seniority: expResult.seniority === 'senior' ? 'junior' : expResult.seniority,
          maxYearsExperience: expResult.isZeroExperience ? 0 : expResult.maxYearsExperience,
          isZeroExperience: expResult.isZeroExperience,
          requiredSkills: skills.length > 0 ? skills : ['Tecnología', 'Git', 'Ingeniería'],
          contractType: contractRes.contractType,
          contractTypeLabel: contractRes.contractTypeLabel,
          category: catRes.category,
          categoryLabel: catRes.categoryLabel,
          postedDateText: 'Reciente',
          scrapedAt: pubDate.toISOString()
        });
      }
    } catch (e) {
      console.warn(`[Remotive] Error en categoría ${cat}:`, e);
    }
  }

  return jobs;
}
