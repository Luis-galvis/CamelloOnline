import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';
import { isTechJob } from './tech-filter';
import { detectExperience } from './experience-detector';
import { extractApplicantCount } from './applicant-extractor';
import { extractPostedDate } from './date-extractor';
import { decodeHtmlEntities } from './clean-text';

const LINKEDIN_PRIORITY_QUERIES = [
  // Desarrollo y Software Remoto / Colombia
  { q: 'desarrollador junior', remote: false },
  { q: 'junior software engineer', remote: false },
  { q: 'desarrollador frontend react', remote: true },
  { q: 'desarrollador backend python', remote: true },
  { q: 'desarrollador full stack remote', remote: true },
  { q: 'desarrollador node', remote: false },
  { q: 'desarrollador java junior', remote: false },
  { q: 'mobile developer flutter', remote: true },
  { q: 'programador junior remoto', remote: true },
  // Datos, Analytics & IA
  { q: 'analista de datos', remote: false },
  { q: 'data analyst remote', remote: true },
  { q: 'ingeniero de datos', remote: false },
  { q: 'power bi analista', remote: true },
  { q: 'ai engineer machine learning', remote: true },
  // QA, DevOps & Soporte
  { q: 'qa tester junior', remote: true },
  { q: 'analista qa remoto', remote: true },
  { q: 'soporte ti junior', remote: false },
  { q: 'soporte tecnico remoto', remote: true },
  { q: 'devops junior cloud', remote: true },
  // Trainees, Semilleros y Prácticas 0 YoE (Sin Experiencia)
  { q: 'practicante sistemas', remote: false },
  { q: 'practicante sistemas remoto', remote: true },
  { q: 'practicante desarrollo software', remote: true },
  { q: 'practicante desarrollo web', remote: true },
  { q: 'practicante analisis de datos', remote: true },
  { q: 'aprendiz sena adso remoto', remote: true },
  { q: 'semillero desarrollo software', remote: true },
  { q: 'trainee desarrollador', remote: true },
  { q: 'junior sin experiencia', remote: true }
];

async function fetchWithTimeout(url: string, timeoutMs: number = 3500): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}

export async function scrapeLinkedInColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  console.log(`[LinkedIn Scraper] Consultando ${LINKEDIN_PRIORITY_QUERIES.length} queries prioritarias en paralelo...`);

  // Batch execution (chunks of 4)
  const chunkSize = 4;
  for (let i = 0; i < LINKEDIN_PRIORITY_QUERIES.length; i += chunkSize) {
    const chunk = LINKEDIN_PRIORITY_QUERIES.slice(i, i + chunkSize);
    
    await Promise.allSettled(chunk.map(async (item) => {
      for (const offset of [0, 10]) {
        const encodedQuery = encodeURIComponent(item.q);
        const remoteParam = item.remote ? '&f_WT=2' : '';
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedQuery}&location=Colombia&geoId=100876405${remoteParam}&start=${offset}`;

        const html = await fetchWithTimeout(url, 3500);
        if (html) {
          parseLinkedInHtml(html, encodedQuery, item.q, jobs, seenIds, item.remote);
        }
      }
    }));
  }

  console.log(`[LinkedIn Scraper] Encontradas ${jobs.length} vacantes de LinkedIn Jobs.`);
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

    const titleMatch = cardHtml.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

    const compMatch = cardHtml.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
    const companyName = compMatch ? decodeHtmlEntities(compMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

    if (!title || !companyName) continue;

    // Strict Tech / Professional filter
    if (!isTechJob(title, cardHtml)) {
      continue;
    }

    const locMatch = cardHtml.match(/<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const rawLocation = locMatch ? decodeHtmlEntities(locMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Colombia';

    const linkMatch = cardHtml.match(/<a[^>]*class="[^"]*base-card__full-link[^"]*"[^>]*href="([^"]+)"/i);
    let rawUrl = linkMatch ? linkMatch[1].split('?')[0] : '';
    const jobIdMatch = rawUrl.match(/(\d{7,})/);
    const sourceJobId = jobIdMatch ? jobIdMatch[1] : `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (seenIds.has(sourceJobId)) continue;
    seenIds.add(sourceJobId);

    const imgMatch = cardHtml.match(/<img[^>]*data-delayed-url="([^"]+)"/i) || cardHtml.match(/<img[^>]*src="([^"]+)"/i);
    const logoUrl = imgMatch ? imgMatch[1] : undefined;

    // Extract posted time snippet
    const dateResult = extractPostedDate(cardHtml, title);
    const postedText = dateResult.postedDateText;
    const postedDate = dateResult.postedDate;

    // Location normalization
    const locationNorm = normalizeLocation(rawLocation, `${title} ${cardHtml}`);
    if (!locationNorm.isColombiaValid) continue;

    // Seniority and experience detection
    const experienceResult = detectExperience(title, cardHtml);
    if (!experienceResult.isEligible) continue;

    // Extract Salary
    const salaryResult = extractSalary(cardHtml, title);

    // Extract English Requirement
    const englishResult = detectEnglishRequirement(title, cardHtml);

    // Contract Type
    const contractResult = detectContractType(title, cardHtml, salaryResult.salaryDisplayText);

    // Tech Category
    const categoryResult = detectTechCategory(title, cardHtml);

    // Skills
    const skills = extractSkills(`${title} ${query} ${cardHtml}`);

    // Applicant Count Estimation
    const applicantInfo = extractApplicantCount(cardHtml);

    // Modality
    const isRemoteFinal = isForceRemote || locationNorm.isRemote || /remot[oa]|remote|teletrabajo|anywhere/i.test(`${title} ${rawLocation}`);
    const workModality = isRemoteFinal 
      ? (locationNorm.workModality.includes('worldwide') ? 'remote_worldwide' : 'remote_country')
      : locationNorm.workModality;

    jobs.push({
      id: `linkedin-${sourceJobId}`,
      source: 'linkedin',
      sourceUrl: rawUrl || `https://co.linkedin.com/jobs/view/${sourceJobId}`,
      sourceJobId,
      title,
      companyName,
      companyLogo: logoUrl,
      companyDomain: `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      description: `Oportunidad laboral verificada en LinkedIn Colombia para el cargo de ${title} en ${companyName}. Ubicación: ${rawLocation}. Modalidad: ${isRemoteFinal ? 'Remoto' : 'Presencial / Híbrido'}.`,
      locationCity: locationNorm.city,
      locationDepartment: locationNorm.department,
      locationCountry: 'CO',
      displayLocation: isRemoteFinal ? `Remoto · ${locationNorm.city}` : locationNorm.displayLocation,
      locationFilterKey: isRemoteFinal ? 'remoto_colombia' : locationNorm.filterKey,
      isRemote: isRemoteFinal,
      workModality,
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
      englishLevelLabel: englishResult.levelLabel || englishResult.englishLevelLabel,
      englishBadgeText: englishResult.badgeText,
      seniority: experienceResult.seniority,
      maxYearsExperience: experienceResult.maxYearsExperience ?? experienceResult.maxYears ?? 1,
      minYearsExperience: experienceResult.minYears ?? 0,
      isZeroExperience: experienceResult.isZeroExperience,
      experienceTier: experienceResult.experienceTier,
      experienceLabel: experienceResult.experienceLabel,
      experienceLevelLabel: experienceResult.experienceLabel,
      requiredSkills: skills.length > 0 ? skills : ['Desarrollo de Software', 'Git', 'Metodologías Ágiles'],
      contractType: contractResult.contractType,
      contractTypeLabel: contractResult.contractTypeLabel,
      category: categoryResult.category,
      categoryLabel: categoryResult.categoryLabel,
      applicantCountText: applicantInfo.applicantCountText,
      applicantTier: applicantInfo.applicantTier,
      applicantCount: applicantInfo.applicantCount,
      postedDateText: postedText,
      createdAt: postedDate instanceof Date ? postedDate.toISOString() : String(postedDate),
      scrapedAt: new Date().toISOString()
    });
  }
}
