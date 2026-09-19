import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { detectNonTechCategory } from './non-tech-remote-colombia';
import { detectExperience } from './experience-detector';

export async function scrapeTorreColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const searchQueries = [
    { term: 'software', experience: 'potential-to-develop' },
    { term: 'sales', experience: 'potential-to-develop' },
    { term: 'marketing', experience: 'potential-to-develop' },
    { term: 'project manager', experience: 'potential-to-develop' },
    { term: 'finance', experience: 'potential-to-develop' }
  ];

  for (const query of searchQueries) {
    try {
      const url = 'https://torre.ai/api/entities/opportunities/_search/?page=0&size=25';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: JSON.stringify({
          and: [
            { skill: { term: query.term, experience: query.experience } }
          ]
        })
      });

      if (!res.ok) continue;

      const data = await res.json();
      const results = data.results || [];

      for (const item of results) {
        const title = item.objective || '';
        const compObj = item.organizations?.[0] || {};
        const companyName = compObj.name || 'Empresa en Torre.ai';
        const companyLogo = compObj.picture || undefined;
        const id = item.id || `torre-${Date.now()}`;
        const publicUrl = `https://torre.ai/jobs/${id}`;
        
        if (!title) continue;

        const isRemote = Boolean(item.place?.remote);
        const locationName = item.place?.location?.[0]?.name || (isRemote ? 'Remoto (Colombia)' : 'Colombia');

        const locNorm = normalizeLocation(locationName, `${title} Colombia`);
        if (!locNorm.isColombiaValid && !isRemote) continue;

        const expResult = detectExperience(title, '');
        if (!expResult.isEligible) continue;

        const engResult = detectEnglishRequirement(title, `${companyName} ${locationName}`);
        
        let salResult = extractSalary('', '');
        if (item.compensation?.data?.minAmount && item.compensation?.data?.maxAmount) {
          const minVal = item.compensation.data.minAmount;
          const maxVal = item.compensation.data.maxAmount;
          const curr = item.compensation.data.currency || 'USD';
          salResult = {
            isDisclosed: true,
            min: minVal,
            max: maxVal,
            currency: curr === 'USD' ? 'USD' : 'COP',
            displayText: `$${minVal} - $${maxVal} ${curr} / mes`,
            usdEquivalentMin: curr === 'USD' ? minVal : Math.round(minVal / 4100),
            usdEquivalentMax: curr === 'USD' ? maxVal : Math.round(maxVal / 4100)
          };
        }

        const skills = (item.skills || []).map((s: any) => s.name || s).filter(Boolean);
        const contractRes = detectContractType(title, '', '');
        
        const isCommercialOrFinance = 
          title.toLowerCase().includes('sales') || 
          title.toLowerCase().includes('comercial') || 
          title.toLowerCase().includes('ventas') || 
          title.toLowerCase().includes('account') ||
          title.toLowerCase().includes('financ') ||
          title.toLowerCase().includes('project');

        const catRes = isCommercialOrFinance 
          ? detectNonTechCategory(title, '') 
          : detectTechCategory(title, `${companyName} ${locNorm.displayLocation}`);

        jobs.push({
          id: `torre-${id}`,
          source: 'lever',
          sourceUrl: publicUrl,
          sourceJobId: String(id),
          title: title,
          companyName: companyName,
          companyLogo: companyLogo,
          description: `Oportunidad verificada para el cargo de ${title} en ${companyName} (${locNorm.displayLocation}). Modalidad ${isRemote ? '100% Remota' : 'Presencial / Híbrida'}.`,
          locationCity: isRemote ? 'Remoto (Colombia)' : locNorm.city,
          locationDepartment: locNorm.department,
          locationCountry: 'CO',
          displayLocation: isRemote ? 'Remoto (Colombia)' : locNorm.displayLocation,
          locationFilterKey: isRemote ? 'remoto_colombia' : locNorm.filterKey,
          isRemote: isRemote,
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
          scrapedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.warn('Error scraping Torre Colombia query:', query.term, err.message);
    }
  }

  return jobs;
}
