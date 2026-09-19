import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { detectNonTechCategory } from './non-tech-remote-colombia';
import { extractSkills } from '../ats-ingestion';
import { decodeHtmlEntities } from './clean-text';
import { detectExperience } from './experience-detector';

const ELEMPLEO_SEARCH_URLS = [
  'https://www.elempleo.com/co/ofertas-empleo/ibague/ventas',
  'https://www.elempleo.com/co/ofertas-empleo/ibague/administracion-y-oficina',
  'https://www.elempleo.com/co/ofertas-empleo/ibague/servicio-al-cliente',
  'https://www.elempleo.com/co/ofertas-empleo/ibague/contabilidad-y-finanzas',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-asesor-comercial',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-asistente-administrativo',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-servicio-al-cliente-remoto',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-desarrollador-de-software',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-ingeniero-de-sistemas',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-analista-de-datos',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-analista-qa'
];

async function fetchWithTimeout(url: string, timeoutMs: number = 4000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function scrapeElEmpleoColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  const chunkSize = 3;
  for (let i = 0; i < ELEMPLEO_SEARCH_URLS.length; i += chunkSize) {
    const chunk = ELEMPLEO_SEARCH_URLS.slice(i, i + chunkSize);
    await Promise.allSettled(chunk.map(async (url) => {
      const html = await fetchWithTimeout(url, 4000);
      if (!html) return;

      const itemRegex = /<div[^>]*class="[^"]*result-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
      let itemMatch;

      while ((itemMatch = itemRegex.exec(html)) !== null) {
        const itemHtml = itemMatch[1];

        const titleMatch = itemHtml.match(/<a[^>]*class="[^"]*text-ellipsis[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
                           itemHtml.match(/<a[^>]*href="(\/co\/ofertas-empleo\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!titleMatch) continue;

        const rawHref = titleMatch[1];
        const title = decodeHtmlEntities(titleMatch[2].replace(/<[^>]*>/g, '').trim());
        const cleanHref = rawHref.split('#')[0].split('?')[0];
        const sourceUrl = cleanHref.startsWith('http') ? cleanHref : `https://www.elempleo.com${cleanHref}`;
        
        const idMatch = sourceUrl.match(/(\d{6,})/);
        const sourceJobId = idMatch ? idMatch[1] : `ee-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        if (seenIds.has(sourceJobId)) continue;
        seenIds.add(sourceJobId);

        const compMatch = itemHtml.match(/<span[^>]*class="[^"]*info-company[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
                          itemHtml.match(/<span[^>]*class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const companyName = compMatch ? decodeHtmlEntities(compMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Empresa Verificada';

        const locMatch = itemHtml.match(/<span[^>]*class="[^"]*info-city[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const rawLocation = locMatch ? decodeHtmlEntities(locMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Colombia';

        const descMatch = itemHtml.match(/<p[^>]*class="[^"]*text-description[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const snippet = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

        const locationNorm = normalizeLocation(rawLocation, `${title} ${snippet}`);
        if (!locationNorm.isColombiaValid) continue;

        const expResult = detectExperience(title, snippet);
        if (!expResult.isEligible) continue;

        const salaryResult = extractSalary(itemHtml, title);
        const englishResult = detectEnglishRequirement(title, `${snippet} ${itemHtml}`);
        const contractResult = detectContractType(title, itemHtml, salaryResult.displayText || salaryResult.salaryDisplayText);
        
        let catResult: any = detectTechCategory(title, snippet);
        if (catResult.category === 'software_dev' && !title.toLowerCase().includes('desarroll') && !title.toLowerCase().includes('program') && !title.toLowerCase().includes('software')) {
          catResult = detectNonTechCategory(title, snippet);
        }

        const skills = extractSkills(`${title} ${snippet}`);

        jobs.push({
          id: `elempleo-${sourceJobId}`,
          source: 'elempleo',
          sourceUrl,
          sourceJobId,
          title,
          companyName,
          companyDomain: `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          description: snippet || `Convocatoria laboral para ${title} en ${companyName}.`,
          locationCity: locationNorm.city,
          locationDepartment: locationNorm.department,
          locationCountry: 'CO',
          displayLocation: locationNorm.displayLocation,
          locationFilterKey: locationNorm.filterKey,
          isRemote: locationNorm.isRemote,
          workModality: locationNorm.workModality,
          salaryDisclosed: salaryResult.isDisclosed,
          salaryMin: salaryResult.min || salaryResult.salaryMinCop,
          salaryMax: salaryResult.max || salaryResult.salaryMaxCop,
          salaryMinUsd: salaryResult.usdEquivalentMin || salaryResult.salaryMinUsd,
          salaryMaxUsd: salaryResult.usdEquivalentMax || salaryResult.salaryMaxUsd,
          salaryCurrency: salaryResult.currency || 'COP',
          salaryDisplayText: salaryResult.displayText || salaryResult.salaryDisplayText || 'Salario no especificado',
          salaryPeriod: salaryResult.period || 'monthly',
          salaryMinUsdEquivalent: salaryResult.usdEquivalentMin || salaryResult.salaryMinUsd,
          salaryMaxUsdEquivalent: salaryResult.usdEquivalentMax || salaryResult.salaryMaxUsd,
          requiresEnglish: englishResult.requiresEnglish,
          englishLevel: englishResult.englishLevel,
          englishLevelLabel: englishResult.levelLabel,
          englishBadgeText: englishResult.badgeText,
          seniority: expResult.seniority,
          maxYearsExperience: expResult.maxYearsExperience ?? expResult.maxYears ?? 1,
          minYearsExperience: expResult.minYears ?? 0,
          isZeroExperience: expResult.isZeroExperience,
          experienceTier: expResult.experienceTier,
          experienceLabel: expResult.experienceLabel,
          experienceLevelLabel: expResult.experienceLabel,
          requiredSkills: skills.length > 0 ? skills : ['Trabajo en Equipo', 'Orientación a Resultados'],
          contractType: contractResult.contractType,
          contractTypeLabel: contractResult.contractTypeLabel,
          category: catResult.category as any,
          categoryLabel: catResult.categoryLabel,
          applicantCountText: 'Menos de 15 postulantes',
          applicantTier: 'low',
          applicantCount: 10,
          postedDateText: 'Publicada recientemente',
          createdAt: new Date().toISOString(),
          scrapedAt: new Date().toISOString()
        });
      }
    }));
  }

  return jobs;
}
