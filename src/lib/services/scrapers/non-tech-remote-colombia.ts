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

  // 3. Marketing Digital & Redes Sociales
  if (
    text.includes('marketing') ||
    text.includes('mercadeo') ||
    text.includes('community manager') ||
    text.includes('social media') ||
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

  // 4. Asistente Virtual & Operaciones
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

  // 5. Recursos Humanos & Reclutamiento
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

  // 6. Finanzas, Contabilidad & Facturación
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

  // 7. Redacción, Traducción & Contenido
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
  // Atención al Cliente & BPO
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

export async function scrapeNonTechRemoteColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  console.log('🏠 [REALJOBS] Iniciando scraping masivo de empleos REMOTOS NO-TECH en Colombia...');

  for (const query of NON_TECH_REMOTE_QUERIES) {
    for (const offset of [0, 10, 20]) {
      try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedQuery}&location=Colombia&geoId=100876405&f_WT=2&start=${offset}`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8'
          }
        });

        if (!res.ok) continue;

        const html = await res.text();
        const cardRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let cardMatch;

        while ((cardMatch = cardRegex.exec(html)) !== null) {
          const cardHtml = cardMatch[1];

          const titleMatch = cardHtml.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
          const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

          const compMatch = cardHtml.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
          const companyName = compMatch ? decodeHtmlEntities(compMatch[1].replace(/<[^>]*>/g, '').trim()) : '';

          if (!title || !companyName) continue;

          // CRITICAL: MUST EXCLUDE TECH JOBS (Software, Data, QA, Cloud belong to the main Tech board)
          if (isTechJob(title, cardHtml)) {
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

          // Time / Freshness check (within 21 days)
          const dateResult = extractPostedDate(cardHtml, title);
          const postedText = dateResult.postedDateText;
          const postedDate = dateResult.postedDate;

          if (dateResult.ageDays > 21) continue;

          // Location check
          const locationNorm = normalizeLocation(rawLocation, `${title} ${cardHtml}`);
          if (!locationNorm.isColombiaValid) continue;

          // Experience check
          const expResult = detectExperience(title, cardHtml);
          if (!expResult.isEligible) continue;

          const engResult = detectEnglishRequirement(title, `${companyName} ${rawLocation} ${cardHtml}`);
          const salResult = extractSalary(cardHtml, '');
          const contractRes = detectContractType(title, `${title} ${companyName}`, '');
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
            description: `Oportunidad de trabajo 100% remoto para el cargo de ${title} en ${companyName} (Colombia). Modalidad Teletrabajo / Remoto.`,
            locationCity: 'Remoto (Colombia)',
            locationCountry: 'CO',
            displayLocation: '🏠 Remoto (Colombia)',
            locationFilterKey: 'remoto_colombia',
            isRemote: true,
            workModality: 'remote_country',
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
            seniority: expResult.seniority,
            maxYearsExperience: expResult.isZeroExperience ? 0 : expResult.maxYearsExperience,
            isZeroExperience: expResult.isZeroExperience,
            experienceTier: expResult.experienceTier,
            experienceLabel: expResult.experienceLabel,
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
      } catch (e) {
        console.warn(`[NonTech Remote] Error en "${query}" offset ${offset}`);
      }
    }
  }

  console.log(`✅ [NonTech Remote] ${jobs.length} vacantes remotas no-tech recolectadas.`);
  return jobs;
}
