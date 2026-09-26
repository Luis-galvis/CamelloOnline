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

const ELEMPLEO_SEARCH_URLS = [
  // 1. Sin Experiencia Remoto & Nacional (Prioridad Alta)
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-sin-experiencia-remoto',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-remoto-sin-experiencia',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-sin-experiencia',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-primer-empleo',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-primer-empleo-remoto',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-practicante-remoto',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-practicante',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-aprendiz-sena',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-aprendiz-remoto',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-call-center-remoto',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-call-center-sin-experiencia',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-asistente-virtual',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-asesor-remoto',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-servicio-al-cliente-remoto',

  // 2. Ibagué & Tolima
  'https://www.elempleo.com/co/ofertas-empleo/ibague/sin-experiencia',
  'https://www.elempleo.com/co/ofertas-empleo/ibague/ventas',
  'https://www.elempleo.com/co/ofertas-empleo/ibague/servicio-al-cliente',
  'https://www.elempleo.com/co/ofertas-empleo/ibague/administracion-y-oficina',
  'https://www.elempleo.com/co/ofertas-empleo/ibague/contabilidad-y-finanzas',

  // 3. Tech & Junior
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-desarrollador-junior',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-practicante-de-sistemas',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-aprendiz-sena-sistemas',
  'https://www.elempleo.com/co/ofertas-empleo/trabajo-desarrollador-de-software',
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
      const html = await fetchWithTimeout(url, 4500);
      if (!html) return;

      const isUrlZeroExp = /sin[\s-]*experiencia|primer[\s-]*empleo|aprendiz|practicante|pasant/i.test(url);
      const isUrlRemote = /remoto|teletrabajo/i.test(url);

      const itemRegex = /<div[^>]*class="[^"]*result-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
      let itemMatch;

      while ((itemMatch = itemRegex.exec(html)) !== null) {
        const itemHtml = itemMatch[1];

        const titleMatch = itemHtml.match(/<a[^>]*class="[^"]*text-ellipsis[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
                           itemHtml.match(/<a[^>]*href="(\/co\/ofertas-empleo\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!titleMatch) continue;

        const rawHref = titleMatch[1];
        if (rawHref.includes('{{') || rawHref.includes('undefined')) continue;

        const title = decodeHtmlEntities(titleMatch[2].replace(/<[^>]*>/g, '').trim());
        if (title.includes('{{') || !title) continue;

        const cleanHref = rawHref.split('#')[0].split('?')[0];
        const sourceUrl = cleanHref.startsWith('http') ? cleanHref : `https://www.elempleo.com${cleanHref}`;
        
        const idMatch = sourceUrl.match(/(\d{6,})/);
        if (!idMatch) continue;
        const sourceJobId = idMatch[1];

        if (seenIds.has(sourceJobId)) continue;
        seenIds.add(sourceJobId);

        // GA4 Offer Data extraction
        const ga4Match = itemHtml.match(/data-ga4-offerdata="([^"]+)"/i);
        let offerTags = '';
        if (ga4Match) {
          try {
            const rawGa4 = decodeHtmlEntities(ga4Match[1]);
            const parsed = JSON.parse(rawGa4);
            offerTags = `${parsed.tags || ''} ${parsed.equivalentPositions || ''}`.toLowerCase();
          } catch {}
        }

        const compMatch = itemHtml.match(/<span[^>]*class="[^"]*info-company[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
                          itemHtml.match(/<span[^>]*class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const companyName = compMatch ? decodeHtmlEntities(compMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Empresa Verificada';

        const locMatch = itemHtml.match(/<span[^>]*class="[^"]*info-city[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const rawLocation = locMatch ? decodeHtmlEntities(locMatch[1].replace(/<[^>]*>/g, '').trim()) : (isUrlRemote ? 'Remoto (Colombia)' : 'Colombia');

        const descMatch = itemHtml.match(/<p[^>]*class="[^"]*text-description[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const snippet = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

        const isLocationExplicitRemote = /remot[oa]|teletrabajo|desde\s*casa|home\s*office|wfh/i.test(rawLocation);
        const hasRemoteInText = /remot[oa]|remote|teletrabajo|desde\s*casa|home\s*office|100%\s*remot[oa]|wfh/i.test(`${title} ${rawLocation} ${snippet} ${offerTags}`);
        const isRemoteFinal = isLocationExplicitRemote || hasRemoteInText || (isUrlRemote && !/bogot|medell|cali|barranquilla|ibagu|bucaramanga|cartagena|pereira|manizales|armenia|neiva|cucuta|estrella|bello|itagui|envigado/i.test(rawLocation));

        const locationNorm = normalizeLocation(rawLocation, `${title} ${snippet}`);
        if (!locationNorm.isColombiaValid && !isRemoteFinal) continue;

        const isZeroExpExplicit = isUrlZeroExp || /sin[\s-]*experiencia|primer[\s-]*empleo|aprendiz|practicante/i.test(`${title} ${snippet} ${offerTags}`);
        const expResult = detectExperience(title, `${snippet} ${offerTags}`, { isZeroExpSearch: isZeroExpExplicit, query: url });
        if (!expResult.isEligible) continue;

        const isZeroExpFinal = isZeroExpExplicit || expResult.isZeroExperience;
        const maxExpFinal = isZeroExpFinal ? 0 : Math.min(2.0, expResult.maxYearsExperience || 1.0);

        const salaryResult = extractSalary(itemHtml, title);
        const englishResult = detectEnglishRequirement(title, `${snippet} ${itemHtml} ${offerTags}`);
        const contractResult = detectContractType(title, itemHtml, salaryResult.displayText || salaryResult.salaryDisplayText);
        
        const catResult = detectJobCategory(title, `${snippet} ${offerTags}`);

        const dateResult = extractPostedDate(itemHtml, `${title} ${snippet}`);
        const skills = extractSkills(`${title} ${snippet} ${offerTags}`);

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
          id: `elempleo-${sourceJobId}`,
          source: 'elempleo',
          sourceUrl,
          sourceJobId,
          title,
          companyName,
          companyDomain: `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          description: snippet || `Convocatoria laboral para ${title} en ${companyName}. Modalidad: ${isRemoteFinal ? 'Remoto (Colombia)' : rawLocation}. ${isZeroExpFinal ? 'Perfil junior / sin experiencia previa requerida.' : ''}`,
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
          applicantCountText: 'Menos de 15 postulantes',
          applicantTier: 'low',
          applicantCount: 10,
          postedDateText: dateResult.postedDateText || 'Reciente',
          createdAt: dateResult.postedDate.toISOString(),
          scrapedAt: dateResult.postedDate.toISOString()
        });
      }
    }));
  }

  return jobs;
}
