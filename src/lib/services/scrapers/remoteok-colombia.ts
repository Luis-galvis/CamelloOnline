import { ColombiaScrapedJob } from './types';
import { detectExperience } from './experience-detector';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectJobCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';

const URL = 'https://remoteok.com/api';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function scrapeRemoteOk(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  try {
    const res = await fetch(URL, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.warn('[RemoteOK] HTTP', res.status);
      return [];
    }
    const data = await res.json();
    const list: any[] = Array.isArray(data) ? data.slice(1) : []; // el primer elemento es aviso legal

    for (const j of list) {
      const title = (j.position || '').trim();
      if (!title) continue;

      const tags = (j.tags || []).map((t: any) => String(t).toLowerCase());
      const haystack = `${tags.join(' ')} ${title.toLowerCase()}`;
      if (/\b(senior|sr\.?|lead|principal|staff|director|architect|head\s*of|vp|chief)\b/.test(haystack)) continue;

      // RemoteOK es remoto; descartar solo los claramente US-only
      const loc = (j.location || '').trim();
      const isUsOnly = /united states|usa|u\.s\.|us only|america/i.test(loc) && !/worldwide|anywhere|global|remote|latam|latin america|colombia/i.test(loc);
      if (isUsOnly) continue;

      const desc = stripHtml(j.description || '').slice(0, 1500);
      const exp = detectExperience(title, desc);
      const eng = detectEnglishRequirement(title, desc);
      const contract = detectContractType(title, desc, '');
      const cat = detectJobCategory(title, desc);
      const skills = extractSkills(`${title} ${desc}`);
      const company = j.company || 'Empresa Remota';

      const salMin = Number(j.salary_min) > 0 ? Number(j.salary_min) : undefined;
      const salMax = Number(j.salary_max) > 0 ? Number(j.salary_max) : salMin;

      jobs.push({
        id: `remoteok-${j.id || j.slug || Math.random().toString(36).slice(2, 10)}`,
        source: 'remoteok',
        sourceUrl: j.url || j.apply_url || '',
        sourceJobId: String(j.id || j.slug || `${company}-${title}`).slice(0, 80),
        title,
        companyName: company,
        companyDomain: `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        companyLogo: j.company_logo || j.logo || undefined,
        description: desc || `Vacante remota: ${title} en ${company}.`,
        locationCity: 'Remoto (Global)',
        locationCountry: 'CO',
        displayLocation: '🌎 Remoto · Global',
        locationFilterKey: 'remoto_colombia',
        isRemote: true,
        workModality: 'remote_worldwide',
        salaryDisclosed: salMin != null,
        salaryMinUsd: salMin,
        salaryMaxUsd: salMax,
        salaryMinUsdEquivalent: salMin,
        salaryMaxUsdEquivalent: salMax,
        salaryCurrency: 'USD',
        salaryDisplayText: salMin != null ? `$${Math.round(salMin)} - $${Math.round(salMax ?? salMin)} USD / mes` : 'Salario a convenir',
        salaryPeriod: 'monthly',
        requiresEnglish: eng.requiresEnglish || true,
        englishLevel: (eng.englishLevel === 'no_english_required' ? 'b2_upper_intermediate' : eng.englishLevel) as any,
        englishLevelLabel: eng.levelLabel,
        englishBadgeText: eng.badgeText,
        seniority: exp.seniority === 'senior' ? 'junior' : exp.seniority,
        maxYearsExperience: Math.min(2, exp.maxYearsExperience || 1),
        minYearsExperience: exp.minYears ?? 0,
        isZeroExperience: exp.isZeroExperience,
        experienceTier: exp.experienceTier,
        experienceLabel: exp.experienceLabel,
        experienceLevelLabel: exp.experienceLabel,
        requiredSkills: skills.length > 0 ? skills : [cat.categoryLabel || 'Remoto', 'Inglés'],
        contractType: contract.contractType,
        contractTypeLabel: contract.contractTypeLabel,
        category: cat.category,
        categoryLabel: cat.categoryLabel,
        postedDateText: 'Reciente',
        scrapedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('[RemoteOK] error:', e);
  }

  console.log(`[RemoteOK] ${jobs.length} vacantes remotas recolectadas.`);
  return jobs;
}
