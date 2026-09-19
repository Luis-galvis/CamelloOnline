import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';
import { detectExperience } from './experience-detector';
import { detectNonTechCategory } from './non-tech-remote-colombia';

interface TargetAtsBoard {
  ats: 'greenhouse' | 'lever' | 'ashby' | 'workable';
  token: string;
  companyName: string;
  domain: string;
  isColombiaNative: boolean;
}

export const TARGET_COLOMBIA_ATS_BOARDS: TargetAtsBoard[] = [
  // Native Colombian & Regional Tech / Fintech / Banking Companies
  { ats: 'greenhouse', token: 'rappi', companyName: 'Rappi', domain: 'rappi.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'nubank', companyName: 'Nubank Colombia', domain: 'nubank.com.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'addi', companyName: 'Addi', domain: 'addi.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'truora', companyName: 'Truora', domain: 'truora.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'simetrik', companyName: 'Simetrik', domain: 'simetrik.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'lumu', companyName: 'Lumu Technologies', domain: 'lumu.io', isColombiaNative: true },
  { ats: 'greenhouse', token: 'bold', companyName: 'Bold.co', domain: 'bold.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'bitso', companyName: 'Bitso Colombia', domain: 'bitso.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'mercadolibre', companyName: 'Mercado Libre Colombia', domain: 'mercadolibre.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'habi', companyName: 'Habi', domain: 'habi.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'globant', companyName: 'Globant Colombia', domain: 'globant.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'epam', companyName: 'EPAM Systems Colombia', domain: 'epam.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'gorillalogic', companyName: 'Gorilla Logic Colombia', domain: 'gorillalogic.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'encora', companyName: 'Encora Colombia', domain: 'encora.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'endava', companyName: 'Endava Colombia', domain: 'endava.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'perficient', companyName: 'Perficient Colombia', domain: 'perficient.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'scotiabank-colpatria', companyName: 'Scotiabank Colpatria Tech', domain: 'scotiabankcolpatria.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'sofka', companyName: 'Sofka Technologies', domain: 'sofka.com.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'pragma', companyName: 'Pragma', domain: 'pragma.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'ceiba', companyName: 'Ceiba Software', domain: 'ceiba.com.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'canonical', companyName: 'Canonical (Ubuntu)', domain: 'canonical.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'gitlab', companyName: 'GitLab', domain: 'gitlab.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'automattic', companyName: 'Automattic (WordPress)', domain: 'automattic.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'brex', companyName: 'Brex', domain: 'brex.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'cloudflare', companyName: 'Cloudflare', domain: 'cloudflare.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'github', companyName: 'GitHub', domain: 'github.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'datadog', companyName: 'Datadog', domain: 'datadoghq.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'mongodb', companyName: 'MongoDB', domain: 'mongodb.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'twilio', companyName: 'Twilio', domain: 'twilio.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'hashicorp', companyName: 'HashiCorp', domain: 'hashicorp.com', isColombiaNative: false },
  { ats: 'lever', token: 'platzi', companyName: 'Platzi', domain: 'platzi.com', isColombiaNative: true },
  { ats: 'lever', token: 'torre', companyName: 'Torre', domain: 'torre.ai', isColombiaNative: true },
  { ats: 'lever', token: 'melonn', companyName: 'Melonn', domain: 'melonn.com', isColombiaNative: true },
  { ats: 'lever', token: 'kushki', companyName: 'Kushki', domain: 'kushkipagos.com', isColombiaNative: true },
  { ats: 'lever', token: 'clara', companyName: 'Clara', domain: 'clara.com', isColombiaNative: false },
  { ats: 'lever', token: 'ontop', companyName: 'Ontop', domain: 'getontop.com', isColombiaNative: true },
  { ats: 'lever', token: 'vercel', companyName: 'Vercel', domain: 'vercel.com', isColombiaNative: false },
  { ats: 'lever', token: 'figma', companyName: 'Figma', domain: 'figma.com', isColombiaNative: false },
  { ats: 'lever', token: 'netflix', companyName: 'Netflix', domain: 'netflix.com', isColombiaNative: false },
  { ats: 'lever', token: 'spotify', companyName: 'Spotify', domain: 'spotify.com', isColombiaNative: false },
  { ats: 'lever', token: 'palantir', companyName: 'Palantir', domain: 'palantir.com', isColombiaNative: false }
];

async function fetchGreenhouseJobsRaw(token: string) {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: any) => ({
      id: String(j.id),
      title: j.title || '',
      content: (j.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      url: j.absolute_url || '',
      location: j.location?.name || ''
    }));
  } catch {
    return [];
  }
}

async function fetchLeverJobsRaw(token: string) {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${token}?mode=json`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((j: any) => ({
      id: String(j.id),
      title: j.text || '',
      content: ((j.descriptionPlain || j.description || '')).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      url: j.hostedUrl || '',
      location: j.categories?.location || j.workplaceType || ''
    }));
  } catch {
    return [];
  }
}

export async function scrapeAtsColombiaJobs(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  for (const target of TARGET_COLOMBIA_ATS_BOARDS) {
    let rawJobs: any[] = [];
    if (target.ats === 'greenhouse') {
      rawJobs = await fetchGreenhouseJobsRaw(target.token);
    } else {
      rawJobs = await fetchLeverJobsRaw(target.token);
    }

    for (const raw of rawJobs) {
      const title = raw.title;
      const content = raw.content;
      const rawLoc = raw.location;

      if (!title) continue;

      // 1. Strict Location Check: MUST be in Colombia or Remote Latam/Colombia
      const locNorm = normalizeLocation(rawLoc, `${title} ${target.companyName} ${content}`);
      
      // If not valid in Colombia, check if native
      if (!locNorm.isColombiaValid) {
        if (target.isColombiaNative && (rawLoc.toLowerCase().includes('remote') || !rawLoc || rawLoc.toLowerCase().includes('latam'))) {
          locNorm.isColombiaValid = true;
          locNorm.city = 'Bogotá, D.C.';
          locNorm.displayLocation = 'Remoto · Bogotá, D.C.';
          locNorm.filterKey = 'remoto_colombia';
          locNorm.isRemote = true;
          locNorm.workModality = 'remote_country';
        } else {
          continue;
        }
      }

      // 2. Experience check
      const expRes = detectExperience(title, content);
      if (!expRes.isEligible) {
        continue;
      }

      const uniqueId = `${target.ats}-${raw.id}`;
      if (seenIds.has(uniqueId)) continue;
      seenIds.add(uniqueId);

      // 3. English requirement detection
      const engResult = detectEnglishRequirement(title, content);

      // 4. Salary extraction
      const salResult = extractSalary(content, '');

      // 5. Skills & category extraction
      const skills = extractSkills(`${title} ${content}`);
      const contractRes = detectContractType(title, content, '');
      
      // Determine category (tech or commercial/finance/ops)
      const nonTechRes = detectNonTechCategory(title, content);
      const techRes = detectTechCategory(title, content);

      const isCommercialOrFinance = 
        title.toLowerCase().includes('sales') || 
        title.toLowerCase().includes('comercial') || 
        title.toLowerCase().includes('ventas') || 
        title.toLowerCase().includes('account') ||
        title.toLowerCase().includes('contab') ||
        title.toLowerCase().includes('financ') ||
        title.toLowerCase().includes('project');

      const category = isCommercialOrFinance 
        ? nonTechRes.category 
        : techRes.category;
      
      const categoryLabel = isCommercialOrFinance 
        ? nonTechRes.categoryLabel 
        : techRes.categoryLabel;

      jobs.push({
        id: uniqueId,
        source: target.ats,
        sourceUrl: raw.url,
        sourceJobId: raw.id,
        title: title,
        companyName: target.companyName,
        companyDomain: target.domain,
        description: content.slice(0, 800) || `Oportunidad para ${title} en ${target.companyName}.`,
        locationCity: locNorm.city,
        locationDepartment: locNorm.department,
        locationCountry: 'CO',
        displayLocation: locNorm.displayLocation,
        locationFilterKey: locNorm.filterKey,
        isRemote: locNorm.isRemote,
        workModality: locNorm.workModality,
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
        seniority: expRes.seniority,
        maxYearsExperience: expRes.maxYearsExperience,
        isZeroExperience: expRes.isZeroExperience,
        experienceTier: expRes.experienceTier,
        experienceLabel: expRes.experienceLabel,
        requiredSkills: skills.length > 0 ? skills : ['Trabajo en equipo', 'Orientación a resultados'],
        contractType: contractRes.contractType,
        contractTypeLabel: contractRes.contractTypeLabel,
        category: category as any,
        categoryLabel: categoryLabel,
        applicantCountText: 'Menos de 25 postulantes',
        applicantTier: 'low',
        postedDateText: 'Reciente',
        scrapedAt: new Date().toISOString()
      });
    }
  }

  return jobs;
}
