import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { detectNonTechCategory } from './non-tech-remote-colombia';
import { detectExperience } from './experience-detector';

const TORRE_SKILLS = [
  // Tech
  { term: 'Python', experience: 'potential-to-develop' },
  { term: 'JavaScript', experience: 'potential-to-develop' },
  { term: 'React', experience: 'potential-to-develop' },
  { term: 'Software development', experience: 'potential-to-develop' },
  { term: 'Social media', experience: 'potential-to-develop' },
  { term: 'Virtual assistant', experience: 'potential-to-develop' },
  // Sales / CS (biggest pools)
  { term: 'Customer service', experience: 'potential-to-develop' },
  { term: 'Technical support', experience: 'potential-to-develop' },
  { term: 'Cold calling', experience: 'potential-to-develop' },
  { term: 'Inbound sales', experience: 'potential-to-develop' },
  { term: 'Sales', experience: 'potential-to-develop' },
  { term: 'Appointment setting', experience: 'potential-to-develop' },
  { term: 'Lead generation', experience: 'potential-to-develop' },
];

const MAX_PAGES_PER_SKILL = 8; // 8 * 25 = 200 per skill max
const SIZE = 25;

async function fetchTorrePage(
  skill: { term: string; experience: string },
  cursor?: string
): Promise<{ results: any[]; nextCursor?: string; total: number }> {
  let url = `https://search.torre.co/opportunities/_search/?size=${SIZE}`;
  if (cursor) {
    url += `&after=${encodeURIComponent(cursor)}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; REALJOBS/1.0)',
    },
    body: JSON.stringify({
      and: [{ skill: { term: skill.term, experience: skill.experience } }],
    }),
  });

  if (!res.ok) return { results: [], total: 0 };

  const data = await res.json();
  return {
    results: data.results || [],
    nextCursor: data.pagination?.next || undefined,
    total: data.total || 0,
  };
}

function isColombiaEligible(place: any): boolean {
  if (!place) return false;

  // ✅ Worldwide / anywhere = valid for Colombia
  if (place.anywhere === true) return true;
  if (place.locationType === 'remote_anywhere') return true;

  // ✅ Explicit Colombia location
  const locs: any[] = place.location || [];
  const hasColombia = locs.some(
    (l) =>
      String(l.id || '').toLowerCase().includes('colombia') ||
      String(l.countryCode || '').toLowerCase() === 'co'
  );
  if (hasColombia) return true;

  // ✅ remote_countries with Latam neighbours (often open to Colombia)
  if (place.remote && place.locationType === 'remote_countries') {
    const latamCodes = new Set(['CO', 'MX', 'AR', 'CL', 'PE', 'EC', 'VE', 'BO', 'BR', 'PY', 'UY', 'CR', 'PA', 'SV', 'GT', 'HN', 'DO', 'CU', 'PR']);
    const onlyLatam = locs.every((l) => latamCodes.has(String(l.countryCode || '').toUpperCase()));
    const hasLatam = locs.some((l) => latamCodes.has(String(l.countryCode || '').toUpperCase()));
    if (hasLatam && onlyLatam) return true;
    // If 3 or fewer countries and none specifically excluding Colombia, accept
    if (locs.length > 0 && locs.length <= 3 && hasLatam) return true;
  }

  // ✅ Non-remote but explicitly Colombia
  if (!place.remote) {
    return locs.some(
      (l) =>
        String(l.id || '').toLowerCase().includes('colombia') ||
        String(l.countryCode || '').toLowerCase() === 'co'
    );
  }

  return false;
}

export async function scrapeTorreColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  for (const skill of TORRE_SKILLS) {
    try {
      let cursor: string | undefined;
      let pagesRead = 0;

      while (pagesRead < MAX_PAGES_PER_SKILL) {
        const { results, nextCursor, total } = await fetchTorrePage(skill, cursor);
        pagesRead++;

        if (results.length === 0) break;

        for (const item of results) {
          const id = String(item.id || '');
          if (!id || seenIds.has(id)) continue;

          const title = (item.objective || '').trim();
          if (!title) continue;

          // ── Title sanity check ────────────────────────────────────
          // Skip garbage entries: too short, only dashes/symbols, or looks like a company name
          if (title.length < 6) continue;
          if (/^[-–—_=*#.]{2,}$/.test(title)) continue; // e.g. "------"
          if (/^\w{3,25}(Creative|Studio|Labs|Group|Tech|Corp|Inc|LLC|SAS|S\.A\.S|BV|GmbH)$/.test(title)) continue;
          if (!/\s/.test(title) && title.length < 20) continue; // single-word titles under 20 chars are usually company names
          if (/^\d+$/.test(title)) continue; // pure numbers

          // Senior/Lead titles are not eligible
          const titleLower = title.toLowerCase();
          if (
            titleLower.includes('senior') ||
            titleLower.includes(' sr.') ||
            titleLower.includes(' sr ') ||
            titleLower.includes('lead') ||
            titleLower.includes('principal') ||
            titleLower.includes('director') ||
            titleLower.includes('manager') ||
            titleLower.includes('head of') ||
            titleLower.includes('vp ') ||
            titleLower.includes('chief')
          ) {
            continue;
          }

          const place = item.place || {};
          if (!isColombiaEligible(place)) continue;

          seenIds.add(id);

          const isRemote = Boolean(place.remote);
          const isAnywhere = Boolean(place.anywhere);
          const locationName =
            isAnywhere
              ? 'Remoto (Colombia)'
              : place.location?.[0]?.id === 'Colombia'
              ? 'Colombia'
              : isRemote
              ? 'Remoto (Colombia)'
              : 'Colombia';

          const locNorm = normalizeLocation(locationName, `${title} Colombia`);

          const compObj = item.organizations?.[0] || {};
          const companyName = compObj.name || 'Empresa en Torre.ai';
          const companyLogo = compObj.picture || undefined;
          const publicUrl = `https://torre.ai/jobs/${id}`;

          const expResult = detectExperience(title, '', {
            isZeroExpSearch: true,
            query: skill.term,
          });
          if (!expResult.isEligible) continue;

          const engResult = detectEnglishRequirement(title, `${companyName} ${locationName}`);

          let salResult = extractSalary('', '');
          const comp = item.compensation?.data;
          if (comp && comp.minAmount > 0) {
            const curr = comp.currency || 'USD';
            const periodicity = comp.periodicity || 'monthly';
            // Convert yearly to monthly
            const factor = periodicity === 'yearly' ? 1 / 12 : 1;
            const minM = Math.round(comp.minAmount * factor);
            const maxM = comp.maxAmount ? Math.round(comp.maxAmount * factor) : minM;
            salResult = {
              isDisclosed: true,
              min: minM,
              max: maxM,
              currency: curr === 'USD' ? 'USD' : 'COP',
              displayText: `$${minM.toLocaleString()} - $${maxM.toLocaleString()} ${curr} / mes`,
              usdEquivalentMin: curr === 'USD' ? minM : Math.round(minM / 4100),
              usdEquivalentMax: curr === 'USD' ? maxM : Math.round(maxM / 4100),
            };
          }

          const skills = (item.skills || []).map((s: any) => s.name || s).filter(Boolean);
          const contractRes = detectContractType(title, '', '');

          const isCommercialOrFinance =
            titleLower.includes('sales') ||
            titleLower.includes('comercial') ||
            titleLower.includes('ventas') ||
            titleLower.includes('account') ||
            titleLower.includes('financ') ||
            titleLower.includes('customer') ||
            titleLower.includes('support') ||
            titleLower.includes('calling') ||
            titleLower.includes('appointment') ||
            titleLower.includes('agent') ||
            titleLower.includes('virtual assistant');

          const catRes = isCommercialOrFinance
            ? detectNonTechCategory(title, '')
            : detectTechCategory(title, `${companyName} ${locNorm.displayLocation}`);

          jobs.push({
            id: `torre-${id}`,
            source: 'lever',
            sourceUrl: publicUrl,
            sourceJobId: id,
            title,
            companyName,
            companyLogo,
            description: `Oportunidad verificada para el cargo de ${title} en ${companyName} (${locNorm.displayLocation}). Modalidad ${isRemote ? '100% Remota' : 'Presencial / Híbrida'}.`,
            locationCity: isRemote ? 'Remoto (Colombia)' : locNorm.city,
            locationDepartment: locNorm.department,
            locationCountry: 'CO',
            displayLocation: isRemote ? 'Remoto (Colombia)' : locNorm.displayLocation,
            locationFilterKey: isRemote ? 'remoto_colombia' : locNorm.filterKey,
            isRemote,
            workModality: isRemote ? 'remote_country' : locNorm.workModality,
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
            seniority: expResult.seniority === 'senior' ? 'junior' : expResult.seniority,
            maxYearsExperience: expResult.isZeroExperience ? 0 : expResult.maxYearsExperience,
            isZeroExperience: expResult.isZeroExperience,
            experienceTier: expResult.experienceTier,
            experienceLabel: expResult.experienceLabel,
            requiredSkills: skills.length > 0 ? skills : ['Trabajo en equipo', 'Orientación a resultados'],
            contractType: contractRes.contractType,
            contractTypeLabel: contractRes.contractTypeLabel,
            category: catRes.category as any,
            categoryLabel: catRes.categoryLabel,
            postedDateText: 'Reciente',
            scrapedAt: new Date().toISOString(),
          });
        }

        if (!nextCursor || results.length < SIZE) break;
        cursor = nextCursor;

        // Small delay between pages to avoid rate limiting
        await new Promise((r) => setTimeout(r, 300));
      }

      console.log(`[Torre] Skill "${skill.term}" → ${pagesRead} pages crawled`);
    } catch (err: any) {
      console.warn('[Torre] Error scraping skill:', skill.term, err.message);
    }
  }

  console.log(`[Torre] Total eligible jobs collected: ${jobs.length}`);
  return jobs;
}
