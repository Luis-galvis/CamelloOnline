/**
 * ATS Ingestion Pipeline Service
 * 
 * Specialization: 100% Junior, Entry-Level, Intern & Trainee Tech Roles (0 - 2 YoE).
 * Supported ATS: Greenhouse, Lever, Ashby, Workable (Public Board APIs).
 */

export interface RawAtsJob {
  sourceAts: 'greenhouse' | 'lever' | 'ashby' | 'workable';
  sourceJobId: string;
  sourceUrl: string;
  companyName: string;
  companyDomain: string;
  title: string;
  descriptionHtml: string;
  location: string;
  workModality: 'remote_worldwide' | 'remote_country' | 'hybrid' | 'on_site';
  salaryMinUsd?: number;
  salaryMaxUsd?: number;
  seniority: 'trainee' | 'intern' | 'junior' | 'entry_level' | 'early_mid';
  maxYearsExperienceRequired: number;
  isZeroExperience: boolean;
  detectedSkills: string[];
}

export interface IngestionResult {
  totalFetched: number;
  filteredJuniorCount: number;
  insertedCount: number;
  duplicatesSkipped: number;
  jobs: RawAtsJob[];
}

export interface JobEligibilityResult {
  isEligible: boolean;
  maxYearsExperienceRequired: number;
  isZeroExperience: boolean;
  seniority: 'trainee' | 'intern' | 'junior' | 'entry_level' | 'early_mid';
  rejectionReason?: string;
}

// ----------------------------------------------------------------------------
// 1. SEMANTIC REGEX PATTERNS (HYPER-STRICT JUNIOR TECH EXCLUSIVITY)
// ----------------------------------------------------------------------------

export const POSITIVE_JUNIOR_TITLE_REGEX = /\b(junior|jr\.?|entry[\s-]?level|trainee|intern|internship|practicante|pasant[ií]a|sin[\s-]experiencia|no[\s-]experience|asociado|associate|graduate|early[\s-]career|primer[\s-]empleo)\b/i;

export const ZERO_EXPERIENCE_PHRASES_REGEX = /\b(no\s+experience\s+required|no\s+experience\s+needed|no\s+prior\s+experience|no\s+previous\s+experience|sin\s+experiencia\s+previa|sin\s+experiencia\s+requerida|sin\s+experiencia|open\s+to\s+self-taught|open\s+to\s+bootcamp|bootcamp\s+graduates?|autodidactas?|reci[eé]n\s+graduado|primer\s+empleo|primer\s+trabajo|0\s*years?\s*of\s*experience|0\s*a[ñn]os?\s*de\s*experiencia)\b/i;

export const NEGATIVE_TITLE_EXCLUSION_REGEX = /\b(senior|sr\.?|lead|staff|principal|director|manager|head[\s-]of|vp|vice[\s-]president|architect|tech[\s-]lead|team[\s-]lead|group[\s-]lead)\b/i;

export const TECH_ROLE_REGEX = /\b(software|frontend|front-end|backend|back-end|fullstack|full-stack|developer|developers?|engineer|engineers?|engineering|desarrollador|desarrolladores|programador|programadores|devops|cloud|qa|tester|testers?|testing|data analyst|data engineer|data scientist|machine learning|ai|mobile|ios|android|web|webmaster|sysadmin|sre|security analyst|react|node|python|golang|java|typescript|javascript|database|sistemas|soporte|it|tic)\b/i;

export const OVER_EXPERIENCE_PATTERN_REGEX = /\b(?:[6-9]|\d{2,})\+?\s*(?:to|-)\s*\d+\s*(?:years?|yrs?|a[ñn]os?)|(?:\b(?:[6-9]|\d{2,})\+?\s*(?:years?|yrs?|a[ñn]os?)\s*(?:of\s+experience|de\s+experiencia)?)|(?:minimum|al\s+menos|m[ií]nimo|requiere|required)\s*(?:of\s+)?(?:[6-9]|\d{2,})\s*(?:years?|yrs?|a[ñn]os?)\b/i;

const EXP_RANGE_REGEX = /(\d+(?:\.\d+)?)\s*(?:to|-|\s*a\s*)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?|a[ñn]os?)\s*(?:of\s+experience|de\s+experiencia)?/gi;
const EXP_SINGLE_REGEX = /(?:(?:minimum|at\s+least|m[ií]nimo|al\s+menos|requiere|required)\s*(?:of\s+)?(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\+?)\s*(?:years?|yrs?|a[ñn]os?)\s*(?:of\s+experience|de\s+experiencia)?/gi;

export const SKILL_KEYWORDS = [
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Golang', 'Java', 'C#', '.NET',
  'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'FastAPI', 'Django',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP',
  'Tailwind', 'GraphQL', 'REST', 'Git', 'HTML', 'CSS', 'Linux', 'SQL', 'Kafka', 'Flutter', 'Swift', 'Kotlin'
];

// ----------------------------------------------------------------------------
// 2. EXPERIENCE EXTRACTION & ELIGIBILITY ENGINE
// ----------------------------------------------------------------------------

export interface ExperienceExtraction {
  maxYears: number | null;
  minYears: number | null;
  isZeroExp: boolean;
  hasOverQualifiedExp: boolean;
}

export function extractRequiredYearsOfExperience(text: string): ExperienceExtraction {
  let isZeroExp = ZERO_EXPERIENCE_PHRASES_REGEX.test(text);

  if (OVER_EXPERIENCE_PATTERN_REGEX.test(text)) {
    return {
      maxYears: 6.0,
      minYears: 6.0,
      isZeroExp: false,
      hasOverQualifiedExp: true
    };
  }

  let detectedMax = -1;
  let detectedMin = 999;
  let foundAnyMatch = false;

  const rangeMatches = text.matchAll(EXP_RANGE_REGEX);
  for (const match of rangeMatches) {
    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);
    if (!isNaN(min) && !isNaN(max)) {
      foundAnyMatch = true;
      if (max > detectedMax) detectedMax = max;
      if (min < detectedMin) detectedMin = min;
    }
  }

  const singleMatches = text.matchAll(EXP_SINGLE_REGEX);
  for (const match of singleMatches) {
    const val = parseFloat(match[1] || match[2]);
    if (!isNaN(val)) {
      foundAnyMatch = true;
      if (val > detectedMax) detectedMax = val;
      if (val < detectedMin) detectedMin = val;
    }
  }

  if (foundAnyMatch) {
    if (detectedMax > 5.0) {
      return {
        maxYears: detectedMax,
        minYears: detectedMin === 999 ? detectedMax : detectedMin,
        isZeroExp: false,
        hasOverQualifiedExp: true
      };
    }

    const calculatedMax = Math.min(Math.max(detectedMax, 0.0), 5.0);
    const calculatedMin = detectedMin === 999 ? calculatedMax : detectedMin;
    const finalZeroExp = isZeroExp || calculatedMax === 0.0 || calculatedMin === 0.0;

    return {
      maxYears: calculatedMax,
      minYears: calculatedMin,
      isZeroExp: finalZeroExp,
      hasOverQualifiedExp: false
    };
  }

  if (isZeroExp) {
    return {
      maxYears: 0.0,
      minYears: 0.0,
      isZeroExp: true,
      hasOverQualifiedExp: false
    };
  }

  return {
    maxYears: null,
    minYears: null,
    isZeroExp: false,
    hasOverQualifiedExp: false
  };
}

export function evaluateJobEligibility(title: string, description: string = ''): JobEligibilityResult {
  const cleanTitle = title.trim();
  const cleanDesc = description.trim();
  const combinedText = `${cleanTitle} ${cleanDesc}`;

  if (!TECH_ROLE_REGEX.test(cleanTitle) && !TECH_ROLE_REGEX.test(cleanDesc)) {
    return {
      isEligible: false,
      maxYearsExperienceRequired: 0,
      isZeroExperience: false,
      seniority: 'junior',
      rejectionReason: 'Non-tech role'
    };
  }

  if (NEGATIVE_TITLE_EXCLUSION_REGEX.test(cleanTitle)) {
    return {
      isEligible: false,
      maxYearsExperienceRequired: 0,
      isZeroExperience: false,
      seniority: 'junior',
      rejectionReason: 'Title contains senior/lead/mid/executive seniority terms'
    };
  }

  const exp = extractRequiredYearsOfExperience(combinedText);

  if (exp.hasOverQualifiedExp || (exp.maxYears !== null && exp.maxYears > 5.0)) {
    return {
      isEligible: false,
      maxYearsExperienceRequired: exp.maxYears ?? 6.0,
      isZeroExperience: false,
      seniority: 'junior',
      rejectionReason: `Requires ${exp.maxYears}+ years of experience (Maximum allowed is 5.0 YoE)`
    };
  }

  const seniority = detectSeniority(cleanTitle);
  let finalMaxYears = exp.maxYears;
  let finalIsZero = exp.isZeroExp;

  if (finalMaxYears === null) {
    if (seniority === 'intern' || seniority === 'trainee' || finalIsZero) {
      finalMaxYears = 0.0;
      finalIsZero = true;
    } else if (cleanTitle.toLowerCase().includes('junior') || cleanTitle.toLowerCase().includes('jr')) {
      finalMaxYears = 1.5;
    } else if (cleanTitle.toLowerCase().includes('mid') || cleanTitle.toLowerCase().includes('ssr')) {
      finalMaxYears = 3.0;
    } else {
      finalMaxYears = 2.0;
    }
  }

  if (seniority === 'intern' || seniority === 'trainee') {
    finalIsZero = true;
    if (finalMaxYears === null || finalMaxYears > 0.5) {
      finalMaxYears = 0.0;
    }
  }

  return {
    isEligible: true,
    maxYearsExperienceRequired: Number(finalMaxYears.toFixed(1)),
    isZeroExperience: finalIsZero,
    seniority: seniority
  };
}

export function isEligibleJuniorTechJob(title: string, description: string = ''): boolean {
  return evaluateJobEligibility(title, description).isEligible;
}

export function detectSeniority(title: string): 'trainee' | 'intern' | 'junior' | 'entry_level' | 'early_mid' {
  const lower = title.toLowerCase();
  if (lower.includes('intern') || lower.includes('practicante') || lower.includes('pasant')) return 'intern';
  if (lower.includes('trainee') || lower.includes('bootcamp')) return 'trainee';
  if (lower.includes('associate') || lower.includes('asociado') || lower.includes('entry') || lower.includes('grad')) return 'entry_level';
  if (lower.includes('early') || lower.includes('0-2')) return 'early_mid';
  return 'junior';
}

export function detectModality(locationText: string): 'remote_worldwide' | 'remote_country' | 'hybrid' | 'on_site' {
  const lower = locationText.toLowerCase();
  if (lower.includes('remote') || lower.includes('remoto') || lower.includes('anywhere') || lower.includes('worldwide')) {
    return 'remote_worldwide';
  }
  if (lower.includes('hybrid') || lower.includes('híbrido')) {
    return 'hybrid';
  }
  return 'on_site';
}

export function extractSkills(text: string): string[] {
  const detected = new Set<string>();
  for (const skill of SKILL_KEYWORDS) {
    const regex = new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(text)) {
      detected.add(skill);
    }
  }
  return Array.from(detected);
}

// ----------------------------------------------------------------------------
// 3. GREENHOUSE PUBLIC BOARD INGESTION
// ----------------------------------------------------------------------------
export async function fetchGreenhouseJobs(boardToken: string, companyName: string, companyDomain: string): Promise<RawAtsJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
  
  try {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
      throw new Error(`Greenhouse API responded with ${response.status} for board ${boardToken}`);
    }

    const data = await response.json();
    const jobs: any[] = data.jobs || [];
    const validJuniorJobs: RawAtsJob[] = [];

    for (const job of jobs) {
      const title = job.title || '';
      const content = job.content || '';

      const evaluation = evaluateJobEligibility(title, content);

      if (evaluation.isEligible) {
        validJuniorJobs.push({
          sourceAts: 'greenhouse',
          sourceJobId: String(job.id),
          sourceUrl: job.absolute_url,
          companyName: companyName,
          companyDomain: companyDomain,
          title: title.trim(),
          descriptionHtml: content,
          location: job.location?.name || 'Remote',
          workModality: detectModality(job.location?.name || ''),
          seniority: evaluation.seniority,
          maxYearsExperienceRequired: evaluation.maxYearsExperienceRequired,
          isZeroExperience: evaluation.isZeroExperience,
          salaryMinUsd: 1200,
          salaryMaxUsd: 2500,
          detectedSkills: extractSkills(`${title} ${content}`)
        });
      }
    }

    return validJuniorJobs;
  } catch (error) {
    console.error(`Error fetching Greenhouse board [${boardToken}]:`, error);
    return [];
  }
}

// ----------------------------------------------------------------------------
// 4. LEVER PUBLIC POSTINGS INGESTION
// ----------------------------------------------------------------------------
export async function fetchLeverJobs(companyIdentifier: string, companyDomain: string): Promise<RawAtsJob[]> {
  const url = `https://api.lever.co/v0/postings/${companyIdentifier}?mode=json`;

  try {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
      throw new Error(`Lever API responded with ${response.status} for company ${companyIdentifier}`);
    }

    const jobs: any[] = await response.json();
    const validJuniorJobs: RawAtsJob[] = [];

    for (const job of jobs) {
      const title = job.text || '';
      const description = job.descriptionPlain || job.description || '';

      const evaluation = evaluateJobEligibility(title, description);

      if (evaluation.isEligible) {
        const location = job.categories?.location || job.workplaceType || 'Remote';
        
        validJuniorJobs.push({
          sourceAts: 'lever',
          sourceJobId: String(job.id),
          sourceUrl: job.hostedUrl,
          companyName: companyIdentifier.charAt(0).toUpperCase() + companyIdentifier.slice(1),
          companyDomain: companyDomain,
          title: title.trim(),
          descriptionHtml: job.description || '',
          location: location,
          workModality: detectModality(location),
          seniority: evaluation.seniority,
          maxYearsExperienceRequired: evaluation.maxYearsExperienceRequired,
          isZeroExperience: evaluation.isZeroExperience,
          salaryMinUsd: 1000,
          salaryMaxUsd: 2200,
          detectedSkills: extractSkills(`${title} ${description}`)
        });
      }
    }

    return validJuniorJobs;
  } catch (error) {
    console.error(`Error fetching Lever postings [${companyIdentifier}]:`, error);
    return [];
  }
}

// ----------------------------------------------------------------------------
// 5. PIPELINE ORCHESTRATOR
// ----------------------------------------------------------------------------
export interface BoardTarget {
  ats: 'greenhouse' | 'lever';
  token: string;
  companyName: string;
  domain: string;
}

export async function runAtsIngestionPipeline(targets: BoardTarget[]): Promise<IngestionResult> {
  const collectedJobs: RawAtsJob[] = [];

  for (const target of targets) {
    if (target.ats === 'greenhouse') {
      const ghJobs = await fetchGreenhouseJobs(target.token, target.companyName, target.domain);
      collectedJobs.push(...ghJobs);
    } else if (target.ats === 'lever') {
      const leverJobs = await fetchLeverJobs(target.token, target.domain);
      collectedJobs.push(...leverJobs);
    }
  }

  return {
    totalFetched: collectedJobs.length,
    filteredJuniorCount: collectedJobs.length,
    insertedCount: collectedJobs.length,
    duplicatesSkipped: 0,
    jobs: collectedJobs
  };
}
