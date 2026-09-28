import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectExperience } from './experience-detector';
import { decodeHtmlEntities } from './clean-text';
import { extractPostedDate } from './date-extractor';
import { extractApplicantCount } from './applicant-extractor';

const LOCAL_BOARDS_URLS = [
  'https://co.computrabajo.com/trabajo-de-en-ibague',
  'https://co.computrabajo.com/trabajo-de-en-tolima',
  'https://co.computrabajo.com/trabajo-de-sin-experiencia-en-tolima',
  'https://co.computrabajo.com/trabajo-de-sistemas-en-ibague'
];

async function fetchWithTimeout(url: string, timeoutMs: number = 4000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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

/**
 * Scraper de Bolsas de Empleo Locales y Cajas de Compensación Familiar (Tolima / Ibagué / SENA APE)
 */
export async function scrapeLocalBoardsColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  console.log(`📍 [Cajas Locales / Tolima] Extrayendo vacantes locales de Ibagué y Tolima...`);

  for (const url of LOCAL_BOARDS_URLS) {
    const html = await fetchWithTimeout(url, 4500);
    if (!html) continue;

    const articleRegex = /<article[^>]*class="[^"]*box_offer[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    let match;

    while ((match = articleRegex.exec(html)) !== null) {
      const articleHtml = match[1];

      const titleMatch = articleHtml.match(/<a[^>]*class="[^"]*js-o-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
                         articleHtml.match(/<h2[^>]*class="[^"]*fs18[^"]*"[^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!titleMatch) continue;

      const rawHref = titleMatch[1];
      const title = decodeHtmlEntities(titleMatch[2].replace(/<[^>]*>/g, '').trim());
      const cleanHref = rawHref.split('#')[0].split('?')[0];
      const sourceUrl = cleanHref.startsWith('http') ? cleanHref : `https://co.computrabajo.com${cleanHref}`;

      const idMatch = sourceUrl.match(/-([a-f0-9]{32})/i) || sourceUrl.match(/\/oferta-de-trabajo-de-[^/]+-en-[^/]+-([A-Z0-9]+)/i);
      const sourceJobId = idMatch ? idMatch[1] : `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      if (seenIds.has(sourceJobId)) continue;
      seenIds.add(sourceJobId);

      const compMatch = articleHtml.match(/offer-grid-article-company-url[^>]*>([\s\S]*?)<\/a>/i) ||
                        articleHtml.match(/<span[^>]*class="[^"]*fc_base[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const companyName = compMatch ? decodeHtmlEntities(compMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Empresa Local Ibagué / Tolima';

      const locMatch = articleHtml.match(/<span[^>]*class="[^"]*fc_aux[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
                       articleHtml.match(/<p[^>]*class="[^"]*fs14[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
      const rawLocation = locMatch ? decodeHtmlEntities(locMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Ibagué, Tolima';

      const descMatch = articleHtml.match(/<p[^>]*class="[^"]*body_regular[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
                        articleHtml.match(/<p[^>]*class="[^"]*text-truncate[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
      const description = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim()) : `Vacante laboral en Ibagué / Tolima para ${title}.`;

      const locationNorm = normalizeLocation(rawLocation, `${title} ${description} Ibague Tolima`);
      const isZeroExpSearch = /sin[\s-]*experiencia|primer[\s-]*empleo|aprendiz|practicante/i.test(`${url} ${title}`);
      const expResult = detectExperience(title, description, { isZeroExpSearch, query: url });
      if (!expResult.isEligible) continue;

      const isZeroExpFinal = isZeroExpSearch || expResult.isZeroExperience;
      const maxExpFinal = isZeroExpFinal ? 0 : Math.min(2.0, expResult.maxYearsExperience || 1.0);

      const salResult = extractSalary(articleHtml, title);
      const engResult = detectEnglishRequirement(title, `${companyName} ${description}`);
      const contractRes = detectContractType(title, description, articleHtml);
      const dateRes = extractPostedDate(articleHtml, title);
      const appRes = extractApplicantCount(articleHtml);

      jobs.push({
        id: `local-${sourceJobId}`,
        source: 'local_boards',
        sourceUrl,
        sourceJobId,
        title,
        companyName,
        companyDomain: `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        description,
        locationCity: locationNorm.city || 'Ibagué',
        locationDepartment: locationNorm.department || 'Tolima',
        locationCountry: 'CO',
        displayLocation: locationNorm.displayLocation || 'Ibagué, Tolima',
        locationFilterKey: locationNorm.filterKey || 'ibague',
        isRemote: false,
        workModality: 'on_site',
        salaryDisclosed: salResult.isDisclosed,
        salaryMin: salResult.min,
        salaryMax: salResult.max,
        salaryCurrency: salResult.currency || 'COP',
        salaryDisplayText: salResult.displayText || 'Salario legal vigente / A convenir',
        salaryMinUsdEquivalent: salResult.usdEquivalentMin,
        salaryMaxUsdEquivalent: salResult.usdEquivalentMax,
        requiresEnglish: engResult.requiresEnglish,
        englishLevel: engResult.englishLevel,
        englishBadgeText: engResult.badgeText,
        seniority: isZeroExpFinal ? 'trainee' : expResult.seniority,
        maxYearsExperience: maxExpFinal,
        minYearsExperience: 0,
        isZeroExperience: isZeroExpFinal,
        experienceTier: isZeroExpFinal ? 'zero_exp' : expResult.experienceTier,
        experienceLabel: isZeroExpFinal ? 'Sin experiencia previa' : expResult.experienceLabel,
        experienceLevelLabel: isZeroExpFinal ? 'Sin experiencia previa' : expResult.experienceLabel,
        requiredSkills: ['Atención y Servicio', 'Responsabilidad', 'Ibagué / Tolima'],
        contractType: contractRes.contractType,
        contractTypeLabel: contractRes.contractTypeLabel,
        category: 'sales_commercial' as any,
        categoryLabel: 'Comercial & Servicios Locales',
        applicantCountText: appRes.applicantCountText,
        applicantTier: appRes.applicantTier,
        postedDateText: dateRes.postedDateText,
        createdAt: dateRes.postedDate.toISOString(),
        scrapedAt: new Date().toISOString()
      });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`📍 [Cajas Locales / Tolima] ${jobs.length} vacantes locales de Ibagué y Tolima recolectadas.`);
  return jobs;
}
