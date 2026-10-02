import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { isTechJob } from './tech-filter';
import { detectExperience } from './experience-detector';
import { extractApplicantCount } from './applicant-extractor';
import { extractPostedDate } from './date-extractor';
import { decodeHtmlEntities } from './clean-text';

export type NonTechCategory = 
  | 'customer_service'
  | 'sales_commercial'
  | 'marketing_digital'
  | 'community_manager'
  | 'video_editor'
  | 'virtual_assistant_ops'
  | 'hr_recruiting'
  | 'finance_accounting'
  | 'writing_content'
  | 'general_remote';

export interface NonTechCategoryResult {
  category: NonTechCategory;
  categoryLabel: string;
}

export function detectNonTechCategory(title: string = '', description: string = ''): NonTechCategoryResult {
  const text = `${title} ${description}`.toLowerCase();

  // 1. Atención al Cliente / Customer Service / BPO
  if (
    text.includes('servicio al cliente') ||
    text.includes('atenci[oó]n al cliente') ||
    text.includes('customer service') ||
    text.includes('customer support') ||
    text.includes('chat agent') ||
    text.includes('soporte al cliente') ||
    text.includes('call center') ||
    text.includes('helpdesk cliente') ||
    text.includes('pqr') ||
    text.includes('agente bilingue') ||
    text.includes('agente bilingüe') ||
    text.includes('contact center') ||
    text.includes('customer care') ||
    text.includes('customer success')
  ) {
    return { category: 'customer_service', categoryLabel: 'Atención al Cliente' };
  }

  // 2. Ventas & Comercial
  if (
    text.includes('asesor comercial') ||
    text.includes('ventas') ||
    text.includes('sales') ||
    text.includes('bdr') ||
    text.includes('sdr') ||
    text.includes('business development') ||
    text.includes('ejecutivo de cuenta') ||
    text.includes('account executive') ||
    text.includes('telemercadeo') ||
    text.includes('vendedor') ||
    text.includes('prospecci[oó]n') ||
    text.includes('inside sales') ||
    text.includes('comercial remoto')
  ) {
    return { category: 'sales_commercial', categoryLabel: 'Ventas & Comercial' };
  }

  // 3. Community Manager & Redes Sociales
  if (
    text.includes('community manager') ||
    text.includes('gestor de redes') ||
    text.includes('social media manager') ||
    text.includes('redes sociales') ||
    text.includes('instagram') ||
    text.includes('tiktok') ||
    text.includes('content creator') ||
    text.includes('creador de contenido')
  ) {
    return { category: 'community_manager', categoryLabel: 'Community Manager' };
  }

  // 4. Editor de Video & Produccion Audiovisual
  if (
    text.includes('editor de video') ||
    text.includes('video editor') ||
    text.includes('edicion de video') ||
    text.includes('video editing') ||
    text.includes('produccion audiovisual') ||
    text.includes('motion graphics') ||
    text.includes('after effects') ||
    text.includes('premiere') ||
    text.includes('davinci') ||
    text.includes('capcut') ||
    text.includes('audiovisual')
  ) {
    return { category: 'video_editor', categoryLabel: 'Editor de Video' };
  }

  // 6. Marketing Digital & Redes Sociales
  if (
    text.includes('marketing') ||
    text.includes('mercadeo') ||
    text.includes('seo') ||
    text.includes('sem') ||
    text.includes('growth') ||
    text.includes('publicidad') ||
    text.includes('pauta digital') ||
    text.includes('meta ads') ||
    text.includes('google ads') ||
    text.includes('diseño grafico') ||
    text.includes('diseñador grafico')
  ) {
    return { category: 'marketing_digital', categoryLabel: 'Marketing Digital' };
  }

  // 7. Asistente Virtual & Operaciones
  if (
    text.includes('asistente virtual') ||
    text.includes('virtual assistant') ||
    text.includes('asistente administrativo') ||
    text.includes('data entry') ||
    text.includes('digitador') ||
    text.includes('auxiliar administrativo') ||
    text.includes('operaciones') ||
    text.includes('coordinador administrativo') ||
    text.includes('secretaria') ||
    text.includes('recepci[oó]n') ||
    text.includes('logistica remota')
  ) {
    return { category: 'virtual_assistant_ops', categoryLabel: 'Operaciones & Asistente' };
  }

  // 8. Recursos Humanos & Reclutamiento
  if (
    text.includes('recursos humanos') ||
    text.includes('talento humano') ||
    text.includes('reclutad') ||
    text.includes('recruiter') ||
    text.includes('selecci[oó]n') ||
    text.includes('gesti[oó]n humana') ||
    text.includes('hr') ||
    text.includes('headhunter') ||
    text.includes('psic[oó]log')
  ) {
    return { category: 'hr_recruiting', categoryLabel: 'Recursos Humanos' };
  }

  // 8. Finanzas, Contabilidad & Facturacion
  if (
    text.includes('contad') ||
    text.includes('contable') ||
    text.includes('finanz') ||
    text.includes('financier') ||
    text.includes('facturaci[oó]n') ||
    text.includes('tesorer[ií]a') ||
    text.includes('n[oó]mina') ||
    text.includes('auditor') ||
    text.includes('cartera') ||
    text.includes('cobranzas')
  ) {
    return { category: 'finance_accounting', categoryLabel: 'Finanzas & Contabilidad' };
  }

  // 9. Redaccion, Traduccion & Contenido
  if (
    text.includes('redactor') ||
    text.includes('copywriter') ||
    text.includes('traductor') ||
    text.includes('writer') ||
    text.includes('periodista') ||
    text.includes('content') ||
    text.includes('corrector de estilo') ||
    text.includes('transcriptor')
  ) {
    return { category: 'writing_content', categoryLabel: 'Redacción & Contenido' };
  }

  return { category: 'general_remote', categoryLabel: 'Remoto General' };
}

const NON_TECH_REMOTE_QUERIES = [
  // Atencion al Cliente & BPO
  'atencion al cliente remoto colombia',
  'servicio al cliente remoto colombia',
  'customer support remote colombia',
  'customer service agent remote',
  'chat agent remote colombia',
  'agente bilingue remoto colombia',
  'call center remoto colombia',
  'soporte al cliente remoto',
  'bilingual customer service remote',
  // Ventas & Comercial
  'asesor comercial remoto colombia',
  'ventas remoto colombia',
  'sales representative remote colombia',
  'sales development representative remote',
  'bdr remote colombia',
  'sdr remote colombia',
  'ejecutivo de cuenta remoto colombia',
  'inside sales remote colombia',
  // Asistentes & Operaciones
  'asistente virtual remoto colombia',
  'asistente administrativo remoto colombia',
  'virtual assistant remote colombia',
  'digitador remoto colombia',
  'auxiliar administrativo remoto colombia',
  // Marketing & Contenido
  'marketing digital remoto colombia',
  'community manager remoto colombia',
  'social media manager remote colombia',
  'copywriter remoto colombia',
  'redactor remoto colombia',
  // Community Manager especifico
  'community manager junior colombia',
  'gestor redes sociales remoto colombia',
  'content creator remoto colombia',
  'creador de contenido remoto colombia',
  'social media junior remoto',
  // Editor de Video & Audiovisual
  'editor de video remoto colombia',
  'video editor remote colombia',
  'editor audiovisual remoto colombia',
  'editor video junior colombia',
  'motion graphics junior remoto',
  'produccion audiovisual remoto colombia',
  // Backend C# / .NET Junior
  'desarrollador c# junior colombia',
  'c# developer junior remoto colombia',
  'backend dotnet junior colombia',
  'asp net junior colombia remoto',
  // Recursos Humanos & Finanzas
  'reclutador remoto colombia',
  'analista contable remoto colombia',
  'auxiliar contable remoto colombia',
  'talento humano remoto colombia',
  'analista financiero remoto colombia',
  // Sin experiencia / Trainee Remoto No-Tech
  'practicante remoto colombia',
  'sin experiencia remoto colombia',
  'asistente sin experiencia remoto',
  'primer empleo remoto colombia',
  'aprendiz remoto colombia'
];

async function fetchWithTimeout(url: string, timeoutMs: number = 4000): Promise<string | null> {
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
  } catch {
    return null;
  }
}

export async function scrapeNonTechRemoteColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  console.log(`🏠 [NonTech Remote] Iniciando scraping de ${NON_TECH_REMOTE_QUERIES.length} queries remotas no-tech en Colombia...`);

  const chunkSize = 4;
  for (let i = 0; i < NON_TECH_REMOTE_QUERIES.length; i += chunkSize) {
    const chunk = NON_TECH_REMOTE_QUERIES.slice(i, i + chunkSize);
    await Promise.allSettled(chunk.map(async (query) => {
      const isZeroExpQuery = /sin[\s-]*experiencia|primer[\s-]*empleo|aprendiz|practicante|trainee/i.test(query);

      for (const offset of [0, 10]) {
        try {
          const encodedQuery = encodeURIComponent(query);
          const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedQuery}&location=Colombia&geoId=100876405&f_WT=2&start=${offset}`;

          const html = await fetchWithTimeout(url, 4500);
          if (!html) continue;

          const cardRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
          let cardMatch;

          while ((cardMatch = cardRegex.exec(html)) !== null) {
            const cardHtml = cardMatch[1];

            const titleMatch = cardHtml.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
            const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

            const compMatch = cardHtml.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
            const companyName = compMatch ? decodeHtmlEntities(compMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

            if (!title || !companyName) continue;

            // Exclude software engineering / deep tech if scraped here (belongs to tech scraper)
            if (isTechJob(title, cardHtml) && !title.toLowerCase().includes('soporte') && !title.toLowerCase().includes('help')) {
              continue;
            }

            const locMatch = cardHtml.match(/<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
            const rawLocation = locMatch ? decodeHtmlEntities(locMatch[1].replace(/<[^>]*>/g, '').trim()) : 'Colombia';

            const linkMatch = cardHtml.match(/<a[^>]*class="[^"]*base-card__full-link[^"]*"[^>]*href="([^"]+)"/i);
            let rawUrl = linkMatch ? linkMatch[1].split('?')[0] : '';
            const jobIdMatch = rawUrl.match(/(\d{7,})/);
            const sourceJobId = jobIdMatch ? jobIdMatch[1] : `li-nt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

            if (seenIds.has(sourceJobId)) continue;
            seenIds.add(sourceJobId);

            const imgMatch = cardHtml.match(/<img[^>]*data-delayed-url="([^"]+)"/i) || cardHtml.match(/<img[^>]*src="([^"]+)"/i);
            const logoUrl = imgMatch ? imgMatch[1] : undefined;

            // Time / Freshness check (within 30 days)
            const dateResult = extractPostedDate(cardHtml, title);
            const postedText = dateResult.postedDateText;
            const postedDate = dateResult.postedDate;

            // Location check
            const locationNorm = normalizeLocation(rawLocation, `${title} ${cardHtml}`);

            // Experience check with zero-experience query inheritance
            const expResult = detectExperience(title, cardHtml, { isZeroExpSearch: isZeroExpQuery, query });
            if (!expResult.isEligible) continue;

            const isZeroExpFinal = isZeroExpQuery || expResult.isZeroExperience;
            const maxExpFinal = isZeroExpFinal ? 0 : Math.min(2.0, expResult.maxYearsExperience || 1.0);

            const engResult = detectEnglishRequirement(title, `${companyName} ${rawLocation} ${cardHtml}`);
            const salResult = extractSalary(cardHtml, '');
            const contractRes = detectContractType(title, cardHtml, `${title} ${companyName}`);
            const nonTechCat = detectNonTechCategory(title, `${companyName} ${cardHtml}`);
            const applicantRes = extractApplicantCount(cardHtml, `${title} ${companyName}`);

            jobs.push({
              id: `nontech-${sourceJobId}`,
              source: 'linkedin',
              sourceUrl: rawUrl || `https://www.linkedin.com/jobs/search/?keywords=${encodedQuery}&location=Colombia`,
              sourceJobId: sourceJobId,
              title: title,
              companyName: companyName,
              companyLogo: logoUrl,
              description: `Oportunidad laboral 100% remota en Colombia para ${title} en ${companyName}. ${isZeroExpFinal ? 'Abierta a talentos sin experiencia previa / primer empleo.' : ''}`,
              locationCity: 'Remoto (Colombia)',
              locationCountry: 'CO',
              displayLocation: 'Remoto · Colombia',
              locationFilterKey: 'remoto_colombia',
              isRemote: true,
              workModality: 'remote_country',
              salaryDisclosed: salResult.isDisclosed,
              salaryMin: salResult.min,
              salaryMax: salResult.max,
              salaryCurrency: salResult.currency,
              salaryDisplayText: salResult.displayText || 'Salario a convenir',
              salaryMinUsdEquivalent: salResult.usdEquivalentMin,
              salaryMaxUsdEquivalent: salResult.usdEquivalentMax,
              requiresEnglish: engResult.requiresEnglish,
              englishLevel: engResult.englishLevel,
              englishBadgeText: engResult.badgeText,
              seniority: isZeroExpFinal ? (/practicante|aprendiz|pasant/i.test(title) ? 'intern' : 'trainee') : expResult.seniority,
              maxYearsExperience: maxExpFinal,
              minYearsExperience: isZeroExpFinal ? 0 : (expResult.minYears ?? 0),
              isZeroExperience: isZeroExpFinal,
              experienceTier: isZeroExpFinal ? 'zero_exp' : expResult.experienceTier,
              experienceLabel: isZeroExpFinal ? 'Sin experiencia previa' : expResult.experienceLabel,
              requiredSkills: [nonTechCat.categoryLabel, 'Comunicación', 'Remoto'],
              contractType: contractRes.contractType,
              contractTypeLabel: contractRes.contractTypeLabel,
              category: nonTechCat.category as any,
              categoryLabel: nonTechCat.categoryLabel,
              applicantCountText: applicantRes.applicantCountText,
              applicantTier: applicantRes.applicantTier,
              postedDateText: postedText,
              scrapedAt: postedDate.toISOString()
            });
          }
        } catch {
          // continue
        }
      }
    }));

    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`✅ [NonTech Remote] ${jobs.length} vacantes remotas no-tech recolectadas.`);
  return jobs;
}
