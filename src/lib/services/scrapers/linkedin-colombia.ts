import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectJobCategory, detectTechCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';
import { isTechJob } from './tech-filter';
import { detectExperience } from './experience-detector';
import { extractApplicantCount } from './applicant-extractor';
import { extractPostedDate } from './date-extractor';
import { decodeHtmlEntities } from './clean-text';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
];

const LINKEDIN_TECH_QUERIES = [
  // 1. Desarrollo de Software Junior & Trainee (Remoto & Colombia)
  { q: 'desarrollador junior', remote: true },
  { q: 'desarrollador junior', remote: false },
  { q: 'junior developer', remote: true },
  { q: 'junior developer', remote: false },
  { q: 'desarrollador software junior', remote: true },
  { q: 'desarrollador software junior', remote: false },
  { q: 'junior software engineer', remote: true },
  { q: 'frontend developer junior', remote: true },
  { q: 'backend developer junior', remote: true },
  { q: 'full stack junior', remote: true },
  { q: 'react developer junior', remote: true },
  { q: 'python developer junior', remote: true },
  { q: 'node js junior', remote: true },
  { q: 'java developer junior', remote: true },
  { q: 'net developer junior', remote: true },
  { q: 'programador junior', remote: true },
  { q: 'programador junior', remote: false },
  { q: 'mobile developer junior', remote: true },
  { q: 'flutter junior', remote: true },
  
  // 2. Semilleros, ADSO & Prácticas Tech (Colombia)
  { q: 'practicante desarrollo software', remote: false },
  { q: 'practicante sistemas', remote: false },
  { q: 'aprendiz adso sena', remote: false },
  { q: 'aprendiz sena sistemas', remote: false },
  { q: 'semillero desarrollo software', remote: false },
  { q: 'semillero programacion', remote: false },
  { q: 'trainee software engineer', remote: true },
  { q: 'ingeniero de sistemas junior', remote: false },
  { q: 'practicante ti', remote: false },
  { q: 'pasante desarrollo software', remote: false },

  // 3. Datos, Analytics & Inteligencia Artificial Junior
  { q: 'analista de datos junior', remote: true },
  { q: 'analista de datos junior', remote: false },
  { q: 'data analyst junior', remote: true },
  { q: 'junior data engineer', remote: true },
  { q: 'analista bi junior', remote: true },
  { q: 'power bi junior', remote: true },
  { q: 'data scientist junior', remote: true },
  { q: 'analista sql junior', remote: true },

  // 4. QA & Testing de Software
  { q: 'qa tester junior', remote: true },
  { q: 'analista qa junior', remote: true },
  { q: 'qa automation junior', remote: true },
  { q: 'tester de software junior', remote: true },
  { q: 'junior qa engineer', remote: true },
  { q: 'analista pruebas software junior', remote: false },

  // 5. Soporte TI, Cloud & DevOps Junior
  { q: 'soporte tecnico ti junior', remote: true },
  { q: 'soporte ti junior', remote: false },
  { q: 'mesa de ayuda ti junior', remote: false },
  { q: 'help desk ti junior', remote: false },
  { q: 'devops junior', remote: true },
  { q: 'cloud engineer junior', remote: true },
  { q: 'auxiliar de sistemas junior', remote: false },

  // 6. Principales Ciudades & Regiones (Bogotá, Medellín, Cali, Tolima/Ibagué)
  { q: 'desarrollador junior bogota', remote: false },
  { q: 'desarrollador junior medellin', remote: false },
  { q: 'desarrollador junior cali', remote: false },
  { q: 'practicante sistemas ibague tolima', remote: false },
  { q: 'junior developer colombia', remote: false }
];

async function fetchWithTimeout(url: string, timeoutMs: number = 6000, retryCount: number = 0): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const randomUa = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const res = await fetch(url, {
      headers: {
        'User-Agent': randomUa,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.status === 429) {
      if (retryCount < 2) {
        const waitTime = (retryCount + 1) * 1500 + Math.floor(Math.random() * 800);
        await new Promise(r => setTimeout(r, waitTime));
        return fetchWithTimeout(url, timeoutMs, retryCount + 1);
      }
      return null;
    }

    if (!res.ok) return null;
    return await res.text();
  } catch {
    if (retryCount < 1) {
      await new Promise(r => setTimeout(r, 1000));
      return fetchWithTimeout(url, timeoutMs, retryCount + 1);
    }
    return null;
  }
}

export async function scrapeLinkedInColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  console.log(`[LinkedIn Scraper] Consultando ${LINKEDIN_TECH_QUERIES.length} queries prioritarias de LinkedIn Jobs Colombia...`);

  // Batch execution with controlled concurrency to prevent HTTP 429
  const chunkSize = 2;
  for (let i = 0; i < LINKEDIN_TECH_QUERIES.length; i += chunkSize) {
    const chunk = LINKEDIN_TECH_QUERIES.slice(i, i + chunkSize);
    
    await Promise.allSettled(chunk.map(async (item) => {
      // Query page 0 and page 25 for deep retrieval without f_E restriction
      for (const offset of [0, 25]) {
        const encodedQuery = encodeURIComponent(item.q);
        const remoteParam = item.remote ? '&f_WT=2' : '';
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedQuery}&location=Colombia&geoId=100876405${remoteParam}&start=${offset}`;

        const html = await fetchWithTimeout(url, 6000);
        if (html) {
          parseLinkedInHtml(html, encodedQuery, item.q, jobs, seenIds, item.remote);
        }
      }
    }));

    // Delay between batches to prevent 429 rate limiting
    await new Promise(r => setTimeout(r, 450));
  }

  console.log(`[LinkedIn Scraper] Encontradas ${jobs.length} vacantes verificadas de LinkedIn Jobs.`);
  return jobs;
}

function parseLinkedInHtml(
  html: string, 
  encodedQuery: string, 
  query: string, 
  jobs: ColombiaScrapedJob[],
  seenIds: Set<string>,
  isForceRemote: boolean = false
) {
  const cardRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let cardMatch;

  while ((cardMatch = cardRegex.exec(html)) !== null) {
    const cardHtml = cardMatch[1];

    const titleMatch = cardHtml.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i) ||
                       cardHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

    const compMatch = cardHtml.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i) ||
                      cardHtml.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
    const companyName = compMatch ? decodeHtmlEntities(compMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

    if (!title || !companyName) continue;

    // Strict Tech / Professional filter
    if (!isTechJob(title, cardHtml)) {
      continue;
    }

    const locMatch = cardHtml.match(/<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const rawLocation = locMatch ? decodeHtmlEntities(locMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Colombia';

    const linkMatch = cardHtml.match(/<a[^>]*class="[^"]*base-card__full-link[^"]*"[^>]*href="([^"]+)"/i) ||
                      cardHtml.match(/<a[^>]*href="([^"]*linkedin\.com\/jobs\/view\/[^"]+)"/i) ||
                      cardHtml.match(/<a[^>]*href="([^"]*\/jobs\/view\/[^"]+)"/i);
    let rawUrl = linkMatch ? linkMatch[1].split('?')[0] : '';
    
    // Strict numeric ID extraction (at least 7 digits) to prevent broken URLs
    const jobIdMatch = rawUrl.match(/(\d{7,})/);
    if (!jobIdMatch) continue;
    const sourceJobId = jobIdMatch[1];

    if (seenIds.has(sourceJobId)) continue;
    seenIds.add(sourceJobId);

    const imgMatch = cardHtml.match(/<img[^>]*data-delayed-url="([^"]+)"/i) || cardHtml.match(/<img[^>]*src="([^"]+)"/i);
    const logoUrl = imgMatch ? imgMatch[1] : undefined;

    // Extract posted time snippet
    const dateResult = extractPostedDate(cardHtml, title);
    const postedText = dateResult.postedDateText;

    // Location normalization
    const locationNorm = normalizeLocation(rawLocation, `${title} ${cardHtml}`);
    const isRemote = isForceRemote || locationNorm.isRemote || /remot[oa]|remote|teletrabajo|desde casa|home office|wfh/i.test(`${rawLocation} ${title}`);

    if (!locationNorm.isColombiaValid && !isRemote) {
      continue;
    }

    // Experience detection (strictly zero exp only for explicit trainee/intern/no-exp queries)
    const isQueryZeroExp = /sin[\s-]*experiencia|primer[\s-]*empleo|practicante|aprendiz|semillero|trainee|pasant/i.test(query);
    const expResult = detectExperience(title, cardHtml, { isZeroExpSearch: isQueryZeroExp, query });
    if (!expResult.isEligible) {
      continue;
    }

    const isZeroExpFinal = expResult.isZeroExperience;
    const maxExpFinal = isZeroExpFinal ? 0 : Math.min(2.0, expResult.maxYearsExperience || 1.0);

    const contractResult = detectContractType(title, cardHtml);
    const contractType = contractResult.contractType;
    const contractTypeLabel = contractResult.contractTypeLabel;

    const salaryResult = extractSalary(cardHtml, title);
    const englishResult = detectEnglishRequirement(title, `${companyName} ${rawLocation}`);
    const catResult = detectJobCategory(title, cardHtml);
    const applicantResult = extractApplicantCount(cardHtml);
    const skills = extractSkills(`${title} ${query}`);

    const cleanSourceUrl = `https://www.linkedin.com/jobs/view/${sourceJobId}`;

    jobs.push({
      id: `linkedin-${sourceJobId}`,
      source: 'linkedin',
      sourceUrl: cleanSourceUrl,
      sourceJobId,
      title,
      companyName,
      companyDomain: `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      companyLogo: logoUrl,
      description: `Oportunidad laboral verificada en LinkedIn Colombia para el cargo de ${title} en ${companyName}. Ubicación: ${locationNorm.displayLocation}. Modalidad: ${isRemote ? 'Remoto' : 'Presencial / Híbrido'}.${isZeroExpFinal ? ' Vacante apta para talento sin experiencia previa.' : ''}`,
      locationCity: isRemote ? 'Remoto (Colombia)' : locationNorm.city,
      locationDepartment: locationNorm.department,
      locationCountry: 'CO',
      displayLocation: isRemote ? `Remoto · ${locationNorm.city || 'Colombia'}` : locationNorm.displayLocation,
      locationFilterKey: isRemote ? 'remoto_colombia' : locationNorm.filterKey,
      isRemote,
      workModality: isRemote ? 'remote_country' : locationNorm.workModality,
      salaryDisclosed: salaryResult.isDisclosed,
      salaryMin: salaryResult.min,
      salaryMax: salaryResult.max,
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
      seniority: isZeroExpFinal ? (contractType === 'aprendizaje' ? 'intern' : 'trainee') : expResult.seniority,
      maxYearsExperience: maxExpFinal,
      minYearsExperience: isZeroExpFinal ? 0 : (expResult.minYears ?? 0),
      isZeroExperience: isZeroExpFinal,
      experienceTier: isZeroExpFinal ? 'zero_exp' : expResult.experienceTier,
      experienceLabel: isZeroExpFinal ? 'Sin experiencia previa' : expResult.experienceLabel,
      experienceLevelLabel: isZeroExpFinal ? 'Sin experiencia previa' : expResult.experienceLabel,
      requiredSkills: skills.length > 0 ? skills : (catResult.category === 'data_ai' ? ['SQL', 'Power BI', 'Análisis de Datos'] : (catResult.category === 'qa_testing' ? ['QA', 'Testing', 'Casos de Prueba'] : ['Desarrollo de Software', 'Git', 'Metodologías Ágiles'])),
      contractType,
      contractTypeLabel,
      category: catResult.category as any,
      categoryLabel: catResult.categoryLabel,
      applicantCountText: applicantResult.applicantCountText,
      applicantTier: applicantResult.applicantTier,
      applicantCount: applicantResult.applicantCount,
      postedDateText: postedText || dateResult.postedDateText,
      createdAt: dateResult.postedDate.toISOString(),
      scrapedAt: new Date().toISOString()
    });
  }
}
