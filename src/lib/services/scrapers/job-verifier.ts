/**
 * Verificador / Enriquecedor de vacantes
 *
 * Abre la página de detalle REAL de cada vacante (LinkedIn y Computrabajo) para:
 *  - descartar vacantes cerradas o inexistentes (redirigen / "no se aceptan solicitudes")
 *  - leer la descripción completa y recalcular experiencia, contrato, modalidad e inglés
 *  - evitar que "junior" en el título o la URL de búsqueda marquen "sin experiencia"
 *    cuando la vacante pide años de experiencia (ej. "entre 2 y 4 años")
 */
import { ColombiaScrapedJob } from './types';
import { detectExperience, normalizeForMatch } from './experience-detector';
import { detectContractType } from './contract-detector';
import { detectEnglishRequirement } from './english-detector';
import { normalizeLocation } from './location-normalizer';
import { extractApplicantCount } from './applicant-extractor';
import { decodeHtmlEntities } from './clean-text';

/** La plataforma es para perfiles junior: máximo de años mínimos exigidos. */
export const MAX_MIN_YEARS_ALLOWED = 2.0;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const REMOTE_EVIDENCE = /\b(100\s*%?\s*remot[oa]|remot[oa]|remote|teletrabajo|trabajo\s+en\s+casa|desde\s+casa|home\s*office|work\s+from\s+home|wfh)\b/i;
const ONSITE_EVIDENCE = /\b(100\s*%?\s*presencial|modalidad\s*:?\s*presencial|presencial|on[\s-]?site|trabajo\s+en\s+sitio|en\s+oficina|hibrid[oa]|hybrid)\b/i;
const HYBRID_EVIDENCE = /\b(hibrid[oa]|hybrid)\b/i;

export type DetailStatus = 'open' | 'closed' | 'unknown';

interface DetailResult {
  status: DetailStatus;
  text: string;
  html: string;
  location?: string;
  extraTags?: string;
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
  ).replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchPage(url: string, timeoutMs = 9000, retries = 2): Promise<{ status: number; url: string; html: string } | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*;q=0.8', 'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8' },
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(t);
      if (res.status === 429 || res.status >= 500) {
        await sleep((attempt + 1) * 1500 + Math.random() * 600);
        continue;
      }
      const html = await res.text();
      return { status: res.status, url: res.url, html };
    } catch {
      await sleep(800);
    }
  }
  return null;
}

async function fetchLinkedInDetail(job: ColombiaScrapedJob): Promise<DetailResult> {
  const id = job.sourceJobId;
  const page = await fetchPage(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`);
  if (!page) return { status: 'unknown', text: '', html: '' };
  if (page.status === 404 || page.status === 410) return { status: 'closed', text: '', html: page.html };
  if (page.status !== 200) return { status: 'unknown', text: '', html: page.html };

  const html = page.html;
  if (/closed-job|no longer accepting applications|no se aceptan solicitudes|ya no se aceptan|ya no acepta solicitudes/i.test(html)) {
    return { status: 'closed', text: '', html };
  }

  const descMatch = html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const description = descMatch ? htmlToText(descMatch[1]) : '';
  if (!description) return { status: 'unknown', text: '', html };

  const criteria = [...html.matchAll(/description__job-criteria-text[^"]*"[^>]*>\s*([^<]+?)\s*</gi)].map(m => decodeHtmlEntities(m[1])).join(' | ');
  const locMatch = html.match(/topcard__flavor topcard__flavor--bullet"[^>]*>\s*([^<]+?)\s*</i);

  return {
    status: 'open',
    text: description,
    html,
    extraTags: criteria,
    location: locMatch ? decodeHtmlEntities(locMatch[1]) : undefined
  };
}

async function fetchComputrabajoDetail(job: ColombiaScrapedJob): Promise<DetailResult> {
  const page = await fetchPage(job.sourceUrl);
  if (!page) return { status: 'unknown', text: '', html: '' };
  // Ofertas expiradas / inexistentes redirigen al listado (sin /ofertas-de-trabajo/ en la URL)
  if (page.status === 404 || page.status === 410 || !/\/ofertas-de-trabajo\//i.test(page.url)) {
    return { status: 'closed', text: '', html: page.html };
  }
  if (page.status !== 200) return { status: 'unknown', text: '', html: page.html };

  const html = page.html;
  const start = html.search(/div-link="oferta"/i);
  if (start < 0) return { status: 'unknown', text: '', html };
  let section = html.slice(start, start + 12000);
  const end = section.search(/Palabras clave|div-link="empresa"|div-link="similares"/i);
  if (end > 0) section = section.slice(0, end);

  const tags = [...section.matchAll(/<span class="tag base[^"]*">\s*([^<]+?)\s*<\/span>/gi)].map(m => decodeHtmlEntities(m[1])).join(' | ');
  const text = htmlToText(section);
  if (text.length < 40) return { status: 'unknown', text: '', html };

  return { status: 'open', text, html, extraTags: tags };
}

function applyDetail(job: ColombiaScrapedJob, detail: DetailResult): ColombiaScrapedJob | null {
  const fullText = `${detail.text} ${detail.extraTags || ''}`;
  const norm = normalizeForMatch(`${job.title} ${fullText}`);

  // ---------- Experiencia (sin forzar por query/URL) ----------
  const exp = detectExperience(job.title, fullText);
  const minYears = exp.minYears ?? exp.maxYearsExperience;
  if (exp.hasExplicitYears && (exp.minYears ?? 0) > MAX_MIN_YEARS_ALLOWED) return null;
  if (exp.seniority === 'senior') return null;

  const isZero = exp.isZeroExperience;

  // ---------- Modalidad ----------
  const rawLocation = detail.location || job.rawLocation || job.locationCity || 'Colombia';
  const locNorm = normalizeLocation(rawLocation, '');
  const locationSaysRemote = REMOTE_EVIDENCE.test(normalizeForMatch(rawLocation));
  const textRemote = REMOTE_EVIDENCE.test(norm);
  const textOnsite = ONSITE_EVIDENCE.test(norm);
  const isHybrid = HYBRID_EVIDENCE.test(norm);
  const cityIsSpecific = !['colombia', 'other', 'remoto_colombia'].includes(locNorm.filterKey);

  let isRemote: boolean;
  if (locationSaysRemote) isRemote = true;
  else if (textOnsite && !textRemote) isRemote = false;
  else if (textRemote && !isHybrid) isRemote = true;
  else if (isHybrid) isRemote = false;
  else isRemote = !!job.isRemote && !cityIsSpecific; // sin evidencia y ciudad concreta => presencial

  // Si el texto menciona remoto y presencial a la vez, preferir la frase de modalidad explícita
  const modalityPhrase = norm.match(/modalidad\s*:?\s*(100\s*%?\s*)?(presencial|remot[oa]|hibrid[oa]|teletrabajo)/);
  if (modalityPhrase) {
    isRemote = /remot|teletrabajo/.test(modalityPhrase[2]);
  }

  if (!isRemote && !locNorm.isColombiaValid) return null;

  // ---------- Contrato, inglés, postulantes ----------
  const contract = detectContractType(job.title, fullText, detail.extraTags || '');
  const english = detectEnglishRequirement(job.title, fullText);
  const applicants = job.source === 'linkedin' ? extractApplicantCount(detail.html) : undefined;

  const seniority = isZero
    ? (contract.contractType === 'aprendizaje' || /practicante|aprendiz|pasant|intern/i.test(job.title) ? 'intern' : 'trainee')
    : exp.seniority;

  const updated: ColombiaScrapedJob = {
    ...job,
    verified: true,
    rawLocation,
    description: detail.text.slice(0, 1500),
    isRemote,
    workModality: isRemote ? 'remote_country' : (isHybrid ? 'hybrid' : 'on_site'),
    locationCity: isRemote ? 'Remoto (Colombia)' : locNorm.city,
    locationDepartment: locNorm.department,
    displayLocation: isRemote ? `Remoto · ${locNorm.city && locNorm.city !== 'Colombia' ? locNorm.city : 'Colombia'}` : locNorm.displayLocation,
    locationFilterKey: isRemote ? 'remoto_colombia' : locNorm.filterKey,
    seniority: seniority as ColombiaScrapedJob['seniority'],
    isZeroExperience: isZero,
    maxYearsExperience: isZero ? 0 : (exp.maxYearsExperience || minYears || 1),
    minYearsExperience: isZero ? 0 : (exp.minYears ?? 0),
    experienceTier: isZero ? 'zero_exp' : exp.experienceTier,
    experienceLabel: isZero ? 'Sin experiencia previa' : exp.experienceLabel,
    experienceLevelLabel: isZero ? 'Sin experiencia previa' : exp.experienceLabel,
    contractType: contract.contractType,
    contractTypeLabel: contract.contractTypeLabel,
    requiresEnglish: english.requiresEnglish,
    englishLevel: english.englishLevel,
    englishLevelLabel: english.levelLabel,
    englishBadgeText: english.badgeText
  };

  if (applicants) {
    updated.applicantCountText = applicants.applicantCountText;
    updated.applicantTier = applicants.applicantTier;
    updated.applicantCount = applicants.applicantCount;
  } else if (job.source === 'computrabajo') {
    // Los conteos de Computrabajo eran inventados: no mostrar datos falsos
    updated.applicantCountText = undefined;
    updated.applicantTier = undefined;
    updated.applicantCount = undefined;
  }
  return updated;
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let idx = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const item = items[idx++];
      await worker(item);
    }
  }));
}

/** Corrección barata (sin red) para las demás fuentes: números de años mandan sobre "sin experiencia". */
function sanitizeOffline(job: ColombiaScrapedJob): ColombiaScrapedJob | null {
  const exp = detectExperience(job.title, job.description || '');
  if (exp.hasExplicitYears && (exp.minYears ?? 0) > MAX_MIN_YEARS_ALLOWED) return null;
  if (job.isZeroExperience && exp.hasExplicitYears && (exp.minYears ?? 0) > 0) {
    return {
      ...job,
      isZeroExperience: false,
      seniority: exp.seniority,
      maxYearsExperience: exp.maxYearsExperience,
      minYearsExperience: exp.minYears ?? 0,
      experienceTier: exp.experienceTier,
      experienceLabel: exp.experienceLabel,
      experienceLevelLabel: exp.experienceLabel
    };
  }
  return job;
}

export interface VerificationReport {
  jobs: ColombiaScrapedJob[];
  checked: number;
  closed: number;
  unverifiedDropped: number;
  rejectedByExperience: number;
}

export async function verifyAndEnrichJobs(jobs: ColombiaScrapedJob[]): Promise<VerificationReport> {
  const toVerify = jobs.filter(j => j.source === 'linkedin' || j.source === 'computrabajo');
  const verifiedMap = new Map<string, ColombiaScrapedJob | null>();
  const unverifiedIds = new Set<string>();
  let closed = 0;
  let rejectedByExperience = 0;

  console.log(`🔎 [Verifier] Validando ${toVerify.length} vacantes en su página de detalle (LinkedIn / Computrabajo)...`);

  await runPool(toVerify, 5, async (job) => {
    const detail = job.source === 'linkedin' ? await fetchLinkedInDetail(job) : await fetchComputrabajoDetail(job);
    if (detail.status === 'closed') {
      closed++;
      verifiedMap.set(job.id, null);
    } else if (detail.status === 'open') {
      const updated = applyDetail(job, detail);
      if (!updated) rejectedByExperience++;
      verifiedMap.set(job.id, updated);
    } else {
      unverifiedIds.add(job.id);
    }
    await sleep(150);
  });

  // Si no se pudo verificar NINGUNA (bloqueo / sin red), no vaciar el catálogo
  const anyVerified = Array.from(verifiedMap.values()).some(Boolean);
  const keepUnverified = !anyVerified && unverifiedIds.size > 0;

  const result: ColombiaScrapedJob[] = [];
  let unverifiedDropped = 0;
  for (const job of jobs) {
    if (verifiedMap.has(job.id)) {
      const v = verifiedMap.get(job.id);
      if (v) result.push(v);
      continue;
    }
    if (unverifiedIds.has(job.id)) {
      if (keepUnverified) {
        const s = sanitizeOffline(job);
        if (s) result.push(s);
      } else {
        unverifiedDropped++;
      }
      continue;
    }
    const s = sanitizeOffline(job);
    if (s) result.push(s);
  }

  console.log(`✅ [Verifier] ${result.length} vacantes válidas | cerradas/inexistentes: ${closed} | descartadas por años (>${MAX_MIN_YEARS_ALLOWED}): ${rejectedByExperience} | sin verificar descartadas: ${unverifiedDropped}`);
  return { jobs: result, checked: toVerify.length, closed, unverifiedDropped, rejectedByExperience };
}
