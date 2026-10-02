import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectExperience } from './experience-detector';
import { decodeHtmlEntities } from './clean-text';
import { extractPostedDate } from './date-extractor';
import { extractApplicantCount } from './applicant-extractor';

const SALES_SEARCH_URLS = [
  // Ventas & Comercial
  'https://co.computrabajo.com/trabajo-de-asesor-comercial-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-asesor-comercial-junior',
  'https://co.computrabajo.com/trabajo-de-ventas-tat-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-asesor-comercial-remoto',
  'https://co.computrabajo.com/trabajo-de-auxiliar-contable-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-auxiliar-contable-junior',
  'https://co.computrabajo.com/trabajo-de-cajero-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-punto-de-venta-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-ventas-en-ibague',
  'https://co.computrabajo.com/trabajo-de-asesor-comercial-en-ibague',
  // Community Manager & Redes Sociales
  'https://co.computrabajo.com/trabajo-de-community-manager-junior',
  'https://co.computrabajo.com/trabajo-de-community-manager-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-community-manager-remoto',
  'https://co.computrabajo.com/trabajo-de-social-media-junior',
  'https://co.computrabajo.com/trabajo-de-gestor-redes-sociales',
  // Editor de Video & Audiovisual
  'https://co.computrabajo.com/trabajo-de-editor-de-video-junior',
  'https://co.computrabajo.com/trabajo-de-editor-de-video-sin-experiencia',
  'https://co.computrabajo.com/trabajo-de-editor-de-video-remoto',
  'https://co.computrabajo.com/trabajo-de-editor-audiovisual',
  // Backend C# / .NET Junior
  'https://co.computrabajo.com/trabajo-de-desarrollador-c-sharp-junior',
  'https://co.computrabajo.com/trabajo-de-desarrollador-net-junior',
  'https://co.computrabajo.com/trabajo-de-programador-c-sharp'
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

export async function scrapeSalesAndCommercialColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  console.log(`💼 [Ventas & Comercial] Extrayendo vacantes comerciales, TAT y contables junior en Colombia...`);

  const chunkSize = 3;
  for (let i = 0; i < SALES_SEARCH_URLS.length; i += chunkSize) {
    const chunk = SALES_SEARCH_URLS.slice(i, i + chunkSize);
    await Promise.allSettled(chunk.map(async (url) => {
      const html = await fetchWithTimeout(url, 4500);
      if (!html) return;

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
        const sourceJobId = idMatch ? idMatch[1] : `sales-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        if (seenIds.has(sourceJobId)) continue;
        seenIds.add(sourceJobId);

        const compMatch = articleHtml.match(/offer-grid-article-company-url[^>]*>([\s\S]*?)<\/a>/i) ||
                          articleHtml.match(/<span[^>]*class="[^"]*fc_base[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const companyName = compMatch ? decodeHtmlEntities(compMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Empresa Verificada';

        const locMatch = articleHtml.match(/<span[^>]*class="[^"]*fc_aux[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
                         articleHtml.match(/<p[^>]*class="[^"]*fs14[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const rawLocation = locMatch ? decodeHtmlEntities(locMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Colombia';

        const descMatch = articleHtml.match(/<p[^>]*class="[^"]*body_regular[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
                          articleHtml.match(/<p[^>]*class="[^"]*text-truncate[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const description = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim()) : `Vacante laboral para ${title} en ${companyName}.`;

        const locationNorm = normalizeLocation(rawLocation, `${title} ${description}`);
        const isRemote = locationNorm.isRemote || /remoto|teletrabajo/i.test(`${rawLocation} ${title} ${url}`);

        const isZeroExpSearch = /sin[\s-]*experiencia|primer[\s-]*empleo|aprendiz|practicante/i.test(`${url} ${title}`);
        const expResult = detectExperience(title, description, { isZeroExpSearch, query: url });
        if (!expResult.isEligible) continue;

        const isZeroExpFinal = isZeroExpSearch || expResult.isZeroExperience;
        const maxExpFinal = isZeroExpFinal ? 0 : Math.min(2.0, expResult.maxYearsExperience || 1.0);

        const isAccounting = /contab|contador|financier|facturaci/i.test(`${title} ${description}`);
        const category = isAccounting ? 'finance_accounting' : 'sales_commercial';
        const categoryLabel = isAccounting ? 'Contabilidad & Finanzas' : 'Ventas & Comercial';

        const salResult = extractSalary(articleHtml, title);
        const engResult = detectEnglishRequirement(title, `${companyName} ${description}`);
        const contractRes = detectContractType(title, description, articleHtml);
        const dateRes = extractPostedDate(articleHtml, title);
        const appRes = extractApplicantCount(articleHtml);

        jobs.push({
          id: `sales-${sourceJobId}`,
          source: 'computrabajo',
          sourceUrl,
          sourceJobId,
          title,
          companyName,
          companyDomain: `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          description,
          locationCity: isRemote ? 'Remoto (Colombia)' : locationNorm.city,
          locationDepartment: locationNorm.department,
          locationCountry: 'CO',
          displayLocation: isRemote ? `Remoto · ${locationNorm.city || 'Colombia'}` : locationNorm.displayLocation,
          locationFilterKey: isRemote ? 'remoto_colombia' : locationNorm.filterKey,
          isRemote,
          workModality: isRemote ? 'remote_country' : locationNorm.workModality,
          salaryDisclosed: salResult.isDisclosed,
          salaryMin: salResult.min,
          salaryMax: salResult.max,
          salaryCurrency: salResult.currency || 'COP',
          salaryDisplayText: salResult.displayText || 'Salario a convenir',
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
          requiredSkills: [categoryLabel, 'Atención al Cliente', 'Orientación a Resultados'],
          contractType: contractRes.contractType,
          contractTypeLabel: contractRes.contractTypeLabel,
          category: category as any,
          categoryLabel,
          applicantCountText: appRes.applicantCountText,
          applicantTier: appRes.applicantTier,
          postedDateText: dateRes.postedDateText,
          createdAt: dateRes.postedDate.toISOString(),
          scrapedAt: new Date().toISOString()
        });
      }
    }));

    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`💼 [Ventas & Comercial] ${jobs.length} vacantes comerciales y contables recolectadas.`);
  return jobs;
}
