import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { detectExperience } from './experience-detector';
import { extractApplicantCount } from './applicant-extractor';
import { extractPostedDate } from './date-extractor';
import { decodeHtmlEntities } from './clean-text';

export async function scrapeWeRemotoColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenUrls = new Set<string>();

  // 1. Live scraping from WeRemoto / WorkRemoto portal
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://weremoto.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      // Match job cards in weremoto markdown/html structure
      const jobLinkRegex = /<a[^>]*href="([^"]*\/job-posts\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = jobLinkRegex.exec(html)) !== null) {
        const url = match[1].startsWith('http') ? match[1] : `https://weremoto.com${match[1]}`;
        const rawTitle = decodeHtmlEntities(match[2].replace(/<[^>]*>/g, '').trim());
        
        if (!rawTitle || rawTitle.toLowerCase().includes('ver trabajo') || rawTitle.toLowerCase().includes('publicación')) continue;
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        const isEntryTitle = /junior|jr|trainee|intern|practicante|pasant|entry|asistente|soporte|support|customer/i.test(rawTitle);
        const expResult = detectExperience(rawTitle, '', { isZeroExpSearch: isEntryTitle });
        if (!expResult.isEligible) continue;

        const isZeroExpFinal = isEntryTitle || expResult.isZeroExperience;
        const maxExpFinal = isZeroExpFinal ? 0 : Math.min(2.0, expResult.maxYearsExperience || 1.0);

        const salaryResult = extractSalary(rawTitle);
        const englishResult = detectEnglishRequirement(rawTitle, 'Remoto Latam Colombia');
        const contractResult = detectContractType(rawTitle);
        const catResult = detectTechCategory(rawTitle, '');
        const applicantInfo = extractApplicantCount(rawTitle);
        const dateResult = extractPostedDate(rawTitle);

        jobs.push({
          id: `weremoto-${Math.random().toString(36).slice(2, 10)}`,
          title: rawTitle,
          companyName: 'Empresa Remota Latam',
          companyDomain: 'weremoto.com',
          sourceUrl: url,
          source: 'weremoto' as any,
          sourceJobId: url.split('/').pop() || `wm-${Date.now()}`,
          isRemote: true,
          workModality: 'remote_worldwide',
          locationCity: 'Remoto (Colombia)',
          locationDepartment: 'Remoto',
          locationCountry: 'CO',
          locationFilterKey: 'remoto_colombia',
          displayLocation: 'Remoto · Colombia / Latam',
          salaryMin: salaryResult.min || salaryResult.salaryMinCop,
          salaryMax: salaryResult.max || salaryResult.salaryMaxCop,
          salaryMinUsd: salaryResult.usdEquivalentMin || salaryResult.salaryMinUsd,
          salaryMaxUsd: salaryResult.usdEquivalentMax || salaryResult.salaryMaxUsd,
          salaryCurrency: salaryResult.currency || 'USD',
          salaryDisclosed: salaryResult.isDisclosed,
          salaryDisplayText: salaryResult.displayText || salaryResult.salaryDisplayText || 'Salario no especificado',
          salaryPeriod: salaryResult.period || 'monthly',
          requiresEnglish: englishResult.requiresEnglish,
          englishLevel: (englishResult.englishLevel === 'no_english_required' ? 'no_english' : englishResult.englishLevel) as any,
          englishLevelLabel: englishResult.levelLabel || englishResult.englishLevelLabel,
          englishBadgeText: englishResult.badgeText,
          contractType: contractResult.contractType,
          contractTypeLabel: contractResult.contractTypeLabel || 'Indefinido',
          category: catResult.category as any,
          categoryLabel: catResult.categoryLabel,
          description: `Vacante remota publicada en WeRemoto para Colombia y Latinoamérica: ${rawTitle}. Modalidad 100% remota con compensación internacional y flexibilidad horaria. ${isZeroExpFinal ? 'Perfil junior / sin experiencia previa requerida.' : ''}`,
          requiredSkills: ['Trabajo Remoto', 'Comunicación Asíncrona', 'Autogestión'],
          createdAt: dateResult.postedDate,
          postedDateText: dateResult.postedDateText,
          applicantCountText: applicantInfo.applicantCountText,
          applicantTier: applicantInfo.applicantTier,
          applicantCount: applicantInfo.applicantCount,
          maxYearsExperience: maxExpFinal,
          minYearsExperience: isZeroExpFinal ? 0 : (expResult.minYears ?? 0),
          experienceLevelLabel: isZeroExpFinal ? 'Sin experiencia previa' : expResult.experienceLabel,
          experienceTier: isZeroExpFinal ? 'zero_exp' : expResult.experienceTier,
          experienceLabel: isZeroExpFinal ? 'Sin experiencia previa' : expResult.experienceLabel,
          seniority: isZeroExpFinal ? (/practicante|aprendiz|pasant/i.test(rawTitle) ? 'intern' : 'trainee') : expResult.seniority,
          isZeroExperience: isZeroExpFinal
        });
      }
    }
  } catch (e) {
    console.warn('[WeRemoto Scraper] Error al consultar WeRemoto en vivo:', e);
  }

  return jobs;
}
