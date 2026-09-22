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
import { extractPostedDate } from './date-extractor';

const COMPUTRABAJO_SEARCH_PATHS = [
  // 1. Ibagué & Tolima (Ventas, Comercial, TAT, Contabilidad, Administración, Retail)
  'https://co.computrabajo.com/trabajo-de-ventas-en-tolima',
  'https://co.computrabajo.com/trabajo-de-comercial-en-tolima',
  'https://co.computrabajo.com/trabajo-de-asesor-comercial-en-tolima',
  'https://co.computrabajo.com/trabajo-de-jefe-de-ventas-en-tolima',
  'https://co.computrabajo.com/trabajo-de-coordinador-en-tolima',
  'https://co.computrabajo.com/trabajo-de-supervisor-en-tolima',
  'https://co.computrabajo.com/trabajo-de-tat-en-tolima',
  'https://co.computrabajo.com/trabajo-de-contador-en-tolima',
  'https://co.computrabajo.com/trabajo-de-auxiliar-contable-en-tolima',
  'https://co.computrabajo.com/trabajo-de-administrador-en-tolima',
  'https://co.computrabajo.com/trabajo-de-servicio-al-cliente-en-tolima',
  'https://co.computrabajo.com/trabajo-de-cajero-en-tolima',
  'https://co.computrabajo.com/trabajo-de-ventas-en-ibague',
  'https://co.computrabajo.com/trabajo-de-comercial-en-ibague',
  'https://co.computrabajo.com/trabajo-de-asesor-comercial-en-ibague',
  // 2. Ventas & Comercial Nacional & Remoto
  'https://co.computrabajo.com/trabajo-de-asesor-comercial-remoto',
  'https://co.computrabajo.com/trabajo-de-servicio-al-cliente-remoto',
  'https://co.computrabajo.com/trabajo-de-ejecutivo-de-cuenta',
  'https://co.computrabajo.com/trabajo-de-call-center-remoto',
  // 3. Remoto Sin Experiencia (BPO, Atención, Ventas, Asistentes, Junior)
  'https://co.computrabajo.com/trabajo-de-sin-experiencia-remoto',
  'https://co.computrabajo.com/trabajo-de-practicante-remoto',
  'https://co.computrabajo.com/trabajo-de-aprendiz-remoto',
  'https://co.computrabajo.com/trabajo-de-primer-empleo-remoto',
  'https://co.computrabajo.com/trabajo-de-junior-remoto',
  'https://co.computrabajo.com/trabajo-de-asesor-remoto-sin-experiencia',
  // 4. Tech & Remoto (Junior & Sin Experiencia / Soporte & Sistemas)
  'https://co.computrabajo.com/trabajo-de-desarrollador-software',
  'https://co.computrabajo.com/trabajo-de-desarrollador-junior',
  'https://co.computrabajo.com/trabajo-de-desarrollador-frontend',
  'https://co.computrabajo.com/trabajo-de-desarrollador-backend',
  'https://co.computrabajo.com/trabajo-de-desarrollador-remoto',
  'https://co.computrabajo.com/trabajo-de-programador-remoto',
  'https://co.computrabajo.com/trabajo-de-practicante-sistemas',
  'https://co.computrabajo.com/trabajo-de-aprendiz-sena-sistemas',
  'https://co.computrabajo.com/trabajo-de-semillero-desarrollo',
  'https://co.computrabajo.com/trabajo-de-soporte-ti-remoto',
  'https://co.computrabajo.com/trabajo-de-soporte-tecnico',
  'https://co.computrabajo.com/trabajo-de-mesa-de-ayuda',
  'https://co.computrabajo.com/trabajo-de-tecnico-de-sistemas',
  'https://co.computrabajo.com/trabajo-de-auxiliar-de-sistemas',
  'https://co.computrabajo.com/trabajo-de-analista-de-datos',
  'https://co.computrabajo.com/trabajo-de-analista-qa'
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

export async function scrapeComputrabajoColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  const chunkSize = 4;
  for (let i = 0; i < COMPUTRABAJO_SEARCH_PATHS.length; i += chunkSize) {
    const chunk = COMPUTRABAJO_SEARCH_PATHS.slice(i, i + chunkSize);
    await Promise.allSettled(chunk.map(async (url) => {
      const html = await fetchWithTimeout(url, 4000);
      if (!html) return;

      const articleRegex = /<article[^>]*class="[^"]*box_offer[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      let match;

      while ((match = articleRegex.exec(html)) !== null) {
        const articleHtml = match[1];

        const titleMatch = articleHtml.match(/<a[^>]*class="[^"]*js-o-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
                           articleHtml.match(/<h1[^>]*class="[^"]*fs18[^"]*"[^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!titleMatch) continue;

        const rawHref = titleMatch[1];
        const title = decodeHtmlEntities(titleMatch[2].replace(/<[^>]*>/g, '').trim());
        const cleanHref = rawHref.split('#')[0].split('?')[0];
        const sourceUrl = cleanHref.startsWith('http') ? cleanHref : `https://co.computrabajo.com${cleanHref}`;
        
        const idMatch = sourceUrl.match(/-([a-f0-9]{32})/i) || sourceUrl.match(/\/oferta-de-trabajo-de-[^/]+-en-[^/]+-([A-Z0-9]+)/i);
        const sourceJobId = idMatch ? idMatch[1] : `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        if (seenIds.has(sourceJobId)) continue;
        seenIds.add(sourceJobId);

        const compMatch = articleHtml.match(/<a[^>]*class="[^"]*it-blank[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
                          articleHtml.match(/<p[^>]*class="[^"]*fs16[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const companyName = compMatch ? decodeHtmlEntities(compMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Empresa Confidencial';

        const locMatch = articleHtml.match(/<p[^>]*class="[^"]*fs14[^"]*">\s*<span[^>]*>([\s\S]*?)<\/span>/i) ||
                         articleHtml.match(/<span[^>]*class="[^"]*mr10[^"]*">([\s\S]*?)<\/span>/i);
        const rawLocation = locMatch ? decodeHtmlEntities(locMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Colombia';

        const descMatch = articleHtml.match(/<p[^>]*class="[^"]*text-show-more[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
                          articleHtml.match(/<p[^>]*class="[^"]*fs13[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const snippet = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

        const locationNorm = normalizeLocation(rawLocation, `${title} ${snippet}`);
        if (!locationNorm.isColombiaValid) continue;

        const expResult = detectExperience(title, snippet);
        if (!expResult.isEligible) continue;

        const salaryResult = extractSalary(articleHtml, title);
        const englishResult = detectEnglishRequirement(title, `${snippet} ${articleHtml}`);
        const contractResult = detectContractType(title, articleHtml, salaryResult.displayText || salaryResult.salaryDisplayText);
        
        let catResult: any = detectTechCategory(title, snippet);
        if (catResult.category === 'software_dev' && !title.toLowerCase().includes('desarroll') && !title.toLowerCase().includes('program') && !title.toLowerCase().includes('software')) {
          catResult = detectNonTechCategory(title, snippet);
        }

        const dateResult = extractPostedDate(articleHtml, `${title} ${snippet}`);
        const skills = extractSkills(`${title} ${snippet}`);

        const isSalesOrCommercial = /ventas|comercial|tat|supervisor|asesor|vendedor|ejecutiv|tienda|punto de venta|cajer|cliente/i.test(`${title} ${snippet}`);
        const isAccounting = /contad|contable|costos|presupuesto|auditor|factur/i.test(`${title} ${snippet}`);
        const isManager = /director|gerente|jefe|coordinador|lider|administrador/i.test(`${title} ${snippet}`);

        let roleSkills = skills;
        if (roleSkills.length === 0) {
          if (isAccounting) {
            roleSkills = ['Contabilidad General', 'Costos y Presupuestos', 'Conciliaciones', 'Excel Avanzado'];
          } else if (isSalesOrCommercial) {
            roleSkills = ['Gestión Comercial', 'Ventas y Negociación', 'Atención al Cliente', 'Cumplimiento de Metas'];
          } else if (isManager) {
            roleSkills = ['Liderazgo de Equipos', 'Gestión Estratégica', 'Planificación', 'Toma de Decisiones'];
          } else {
            roleSkills = ['Trabajo en Equipo', 'Orientación a Resultados', 'Responsabilidad'];
          }
        }

        jobs.push({
          id: `computrabajo-${sourceJobId}`,
          source: 'computrabajo',
          sourceUrl,
          sourceJobId,
          title,
          companyName,
          companyDomain: `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          description: snippet || `Oferta laboral para ${title} en ${companyName}. Ubicación: ${rawLocation}.`,
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
          requiredSkills: roleSkills,
          contractType: contractResult.contractType,
          contractTypeLabel: contractResult.contractTypeLabel,
          category: catResult.category as any,
          categoryLabel: catResult.categoryLabel,
          applicantCountText: 'Menos de 20 postulantes',
          applicantTier: 'low',
          applicantCount: 12,
          postedDateText: dateResult.postedDateText || 'Reciente',
          createdAt: dateResult.postedDate.toISOString(),
          scrapedAt: dateResult.postedDate.toISOString()
        });
      }
    }));
  }

  return jobs;
}
