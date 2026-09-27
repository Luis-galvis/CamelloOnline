import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectJobCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';
import { decodeHtmlEntities } from './clean-text';
import { detectExperience } from './experience-detector';
import { extractPostedDate } from './date-extractor';

const COMPUTRABAJO_SEARCH_PATHS = [
  // 1. Vacantes Remotas Sin Experiencia (Prioridad Máxima RealJobs)
  'https://co.computrabajo.com/empleos-sin-experiencia-remoto',
  'https://co.computrabajo.com/empleos-sin-experiencia?fm=2',
  'https://co.computrabajo.com/trabajo-de-sin-experiencia-remoto',
  'https://co.computrabajo.com/trabajo-de-primer-empleo-remoto',
  'https://co.computrabajo.com/trabajo-de-practicante-remoto',
  'https://co.computrabajo.com/trabajo-de-aprendiz-remoto',
  'https://co.computrabajo.com/trabajo-de-aprendiz-sena-remoto',
  'https://co.computrabajo.com/trabajo-de-asesor-remoto-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-teletrabajo-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-asistente-remoto-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-call-center-remoto-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-semillero-remoto',
  'https://co.computrabajo.com/trabajo-de-junior-remoto',
  'https://co.computrabajo.com/trabajo-de-digitador-remoto',
  'https://co.computrabajo.com/trabajo-de-asistente-virtual-remoto',
  'https://co.computrabajo.com/trabajo-de-servicio-al-cliente-remoto',
  'https://co.computrabajo.com/trabajo-de-atencion-al-cliente-remoto',
  'https://co.computrabajo.com/trabajo-de-desarrollador-junior-remoto',
  'https://co.computrabajo.com/trabajo-de-soporte-ti-remoto',
  'https://co.computrabajo.com/trabajo-de-soporte-tecnico-remoto',

  // 2. Sin Experiencia Nacional (Primer Empleo, Semilleros, ADSO, Aprendices)
  'https://co.computrabajo.com/empleos-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-primer-empleo',
  'https://co.computrabajo.com/trabajo-de-practicante',
  'https://co.computrabajo.com/trabajo-de-aprendiz-sena',
  'https://co.computrabajo.com/trabajo-de-semillero-desarrollo',
  'https://co.computrabajo.com/trabajo-de-practicante-sistemas',
  'https://co.computrabajo.com/trabajo-de-aprendiz-sena-sistemas',

  // 3. Ibagué & Tolima (Presencial & Local)
  'https://co.computrabajo.com/trabajo-de-sin-experiencia-en-tolima',
  'https://co.computrabajo.com/trabajo-de-sin-experiencia-en-ibague',
  'https://co.computrabajo.com/trabajo-de-primer-empleo-en-ibague',
  'https://co.computrabajo.com/trabajo-de-ventas-en-ibague',
  'https://co.computrabajo.com/trabajo-de-asesor-comercial-en-ibague',
  'https://co.computrabajo.com/trabajo-de-auxiliar-contable-en-ibague',
  'https://co.computrabajo.com/trabajo-de-servicio-al-cliente-en-ibague',

  // 4. Tech Junior, Desarrollo de Software, Datos & QA (Prioridad Tech Ampliada)
  'https://co.computrabajo.com/trabajo-de-desarrollador-junior',
  'https://co.computrabajo.com/trabajo-de-programador-junior',
  'https://co.computrabajo.com/trabajo-de-programador-remoto',
  'https://co.computrabajo.com/trabajo-de-desarrollador-remoto',
  'https://co.computrabajo.com/trabajo-de-desarrollador-software',
  'https://co.computrabajo.com/trabajo-de-desarrollador-web',
  'https://co.computrabajo.com/trabajo-de-frontend',
  'https://co.computrabajo.com/trabajo-de-backend',
  'https://co.computrabajo.com/trabajo-de-full-stack',
  'https://co.computrabajo.com/trabajo-de-react',
  'https://co.computrabajo.com/trabajo-de-python',
  'https://co.computrabajo.com/trabajo-de-java',
  'https://co.computrabajo.com/trabajo-de-net',
  'https://co.computrabajo.com/trabajo-de-php',
  'https://co.computrabajo.com/trabajo-de-analista-qa',
  'https://co.computrabajo.com/trabajo-de-tester-qa',
  'https://co.computrabajo.com/trabajo-de-analista-de-datos',
  'https://co.computrabajo.com/trabajo-de-analista-de-datos-junior',
  'https://co.computrabajo.com/trabajo-de-power-bi',
  'https://co.computrabajo.com/trabajo-de-soporte-ti',
  'https://co.computrabajo.com/trabajo-de-auxiliar-de-sistemas',
  'https://co.computrabajo.com/trabajo-de-tecnico-en-sistemas',
  'https://co.computrabajo.com/trabajo-de-ingeniero-de-sistemas-junior',
  'https://co.computrabajo.com/trabajo-de-adso',
  'https://co.computrabajo.com/trabajo-de-aprendiz-sena-adso',
  'https://co.computrabajo.com/trabajo-de-devops',
  'https://co.computrabajo.com/trabajo-de-ui-ux'
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
      const html = await fetchWithTimeout(url, 4500);
      if (!html) return;

      const isUrlZeroExp = /sin[\s-]*experiencia|primer[\s-]*empleo|aprendiz|practicante|semillero|pasante/i.test(url);
      const isUrlRemote = /remoto|teletrabajo|fm=2/i.test(url);

      const articleRegex = /<article[^>]*class="[^"]*box_offer[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      let match;

      while ((match = articleRegex.exec(html)) !== null) {
        const articleHtml = match[1];

        const titleMatch = articleHtml.match(/<a[^>]*class="[^"]*js-o-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
                           articleHtml.match(/<h2[^>]*class="[^"]*fs18[^"]*"[^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
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

        const compMatch = articleHtml.match(/offer-grid-article-company-url[^>]*>([\s\S]*?)<\/a>/i) ||
                          articleHtml.match(/<a[^>]*class="[^"]*fc_base t_ellipsis[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
                          articleHtml.match(/<a[^>]*class="[^"]*it-blank[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
                          articleHtml.match(/<p[^>]*class="[^"]*fs16[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const companyName = compMatch ? decodeHtmlEntities(compMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Empresa Confidencial';

        const locMatch = articleHtml.match(/<p[^>]*class="[^"]*fs16[^"]*">\s*<span[^>]*class="[^"]*mr10[^"]*">([\s\S]*?)<\/span>/i) ||
                         articleHtml.match(/<span[^>]*class="[^"]*mr10[^"]*">([\s\S]*?)<\/span>/i) ||
                         articleHtml.match(/<p[^>]*class="[^"]*fs14[^"]*">\s*<span[^>]*>([\s\S]*?)<\/span>/i);
        const rawLocation = locMatch ? decodeHtmlEntities(locMatch[1].replace(/<[^>]*>/g, '').trim()) : (isUrlRemote ? 'Remoto (Colombia)' : 'Colombia');

        const descMatch = articleHtml.match(/<p[^>]*class="[^"]*text-show-more[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
                          articleHtml.match(/<p[^>]*class="[^"]*fs13[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const snippet = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

        // Determine remote modality accurately
        const isLocationExplicitRemote = /remot[oa]|teletrabajo|desde\s*casa|home\s*office|wfh/i.test(rawLocation);
        const hasRemoteInText = /remot[oa]|remote|teletrabajo|desde\s*casa|home\s*office|100%\s*remot[oa]|wfh/i.test(`${title} ${snippet}`);
        const isRemoteFinal = isLocationExplicitRemote || hasRemoteInText || (isUrlRemote && !/bogot|medell|cali|barranquilla|ibagu|bucaramanga|cartagena|pereira|manizales|armenia|neiva|cucuta|estrella|bello|itagui|envigado/i.test(rawLocation));

        const locationNorm = normalizeLocation(rawLocation, `${title} ${snippet}`);
        if (!locationNorm.isColombiaValid && !isRemoteFinal) continue;

        const expResult = detectExperience(title, snippet, { isZeroExpSearch: isUrlZeroExp, query: url });
        if (!expResult.isEligible) continue;

        const isZeroExpFinal = isUrlZeroExp || expResult.isZeroExperience;
        const maxExpFinal = isZeroExpFinal ? 0 : Math.min(2.0, expResult.maxYearsExperience || 1.0);

        const salaryResult = extractSalary(articleHtml, title);
        const englishResult = detectEnglishRequirement(title, `${snippet} ${articleHtml}`);
        const contractResult = detectContractType(title, articleHtml, salaryResult.displayText || salaryResult.salaryDisplayText);
        
        const catResult = detectJobCategory(title, snippet);

        const dateResult = extractPostedDate(articleHtml, `${title} ${snippet}`);
        const skills = extractSkills(`${title} ${snippet}`);

        let roleSkills = skills;
        if (roleSkills.length === 0) {
          if (catResult.category === 'sales_commercial') {
            roleSkills = ['Gestión Comercial', 'Ventas y Negociación', 'Atención al Cliente', 'Cumplimiento de Metas'];
          } else if (catResult.category === 'customer_service') {
            roleSkills = ['Servicio al Cliente', 'Comunicación Asertiva', 'Resolución de PQR', 'Manejo de CRM'];
          } else if (catResult.category === 'finance_accounting') {
            roleSkills = ['Contabilidad General', 'Excel Avanzado', 'Conciliaciones Bancarias', 'Facturación'];
          } else if (catResult.category === 'logistics_operations') {
            roleSkills = ['Control de Inventarios', 'Gestión de Bodega', 'Trabajo en Equipo', 'Despachos'];
          } else if (catResult.category === 'health_nursing') {
            roleSkills = ['Cuidado del Paciente', 'Primeros Auxilios', 'Atención en Salud'];
          } else if (catResult.category === 'virtual_assistant_ops') {
            roleSkills = ['Gestión Documental', 'Herramientas Ofimáticas', 'Organización'];
          } else if (catResult.category === 'marketing_digital') {
            roleSkills = ['Marketing Digital', 'Gestión de Redes', 'Creación de Contenido'];
          } else if (catResult.category === 'data_ai') {
            roleSkills = ['SQL', 'Power BI', 'Análisis de Datos'];
          } else if (catResult.category === 'qa_testing') {
            roleSkills = ['QA', 'Testing de Software', 'Casos de Prueba'];
          } else if (catResult.category === 'it_support') {
            roleSkills = ['Soporte Técnico', 'Help Desk', 'Redes y Sistemas'];
          } else if (catResult.category === 'software_dev') {
            roleSkills = ['Desarrollo de Software', 'Git', 'Metodologías Ágiles'];
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
          description: snippet || `Oferta laboral para ${title} en ${companyName}. Ubicación: ${isRemoteFinal ? 'Remoto (Colombia)' : rawLocation}. ${isZeroExpFinal ? 'Vacante abierta a talentos sin experiencia previa / primer empleo.' : ''}`,
          locationCity: isRemoteFinal ? 'Remoto (Colombia)' : locationNorm.city,
          locationDepartment: locationNorm.department,
          locationCountry: 'CO',
          displayLocation: isRemoteFinal ? `Remoto · ${locationNorm.city || 'Colombia'}` : locationNorm.displayLocation,
          locationFilterKey: isRemoteFinal ? 'remoto_colombia' : locationNorm.filterKey,
          isRemote: isRemoteFinal,
          workModality: isRemoteFinal ? 'remote_country' : locationNorm.workModality,
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
          seniority: isZeroExpFinal ? (/practicante|aprendiz|pasant/i.test(title) ? 'intern' : 'trainee') : expResult.seniority,
          maxYearsExperience: maxExpFinal,
          minYearsExperience: isZeroExpFinal ? 0 : (expResult.minYears ?? 0),
          isZeroExperience: isZeroExpFinal,
          experienceTier: isZeroExpFinal ? 'zero_exp' : expResult.experienceTier,
          experienceLabel: isZeroExpFinal ? 'Sin experiencia previa' : expResult.experienceLabel,
          experienceLevelLabel: isZeroExpFinal ? 'Sin experiencia previa' : expResult.experienceLabel,
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
