import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { extractSkills } from '../ats-ingestion';
import { detectExperience } from './experience-detector';
import { detectNonTechCategory } from './non-tech-remote-colombia';

interface TargetAtsBoard {
  ats: 'greenhouse' | 'lever' | 'ashby' | 'workable';
  token: string;
  companyName: string;
  domain: string;
  isColombiaNative: boolean;
}

export const TARGET_COLOMBIA_ATS_BOARDS: TargetAtsBoard[] = [
  // Native Colombian & Regional Tech / Fintech / Banking Companies
  { ats: 'greenhouse', token: 'rappi', companyName: 'Rappi', domain: 'rappi.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'nubank', companyName: 'Nubank Colombia', domain: 'nubank.com.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'addi', companyName: 'Addi', domain: 'addi.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'truora', companyName: 'Truora', domain: 'truora.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'simetrik', companyName: 'Simetrik', domain: 'simetrik.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'lumu', companyName: 'Lumu Technologies', domain: 'lumu.io', isColombiaNative: true },
  { ats: 'greenhouse', token: 'bold', companyName: 'Bold.co', domain: 'bold.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'bitso', companyName: 'Bitso Colombia', domain: 'bitso.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'mercadolibre', companyName: 'Mercado Libre Colombia', domain: 'mercadolibre.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'habi', companyName: 'Habi', domain: 'habi.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'globant', companyName: 'Globant Colombia', domain: 'globant.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'epam', companyName: 'EPAM Systems Colombia', domain: 'epam.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'gorillalogic', companyName: 'Gorilla Logic Colombia', domain: 'gorillalogic.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'encora', companyName: 'Encora Colombia', domain: 'encora.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'endava', companyName: 'Endava Colombia', domain: 'endava.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'perficient', companyName: 'Perficient Colombia', domain: 'perficient.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'scotiabank-colpatria', companyName: 'Scotiabank Colpatria Tech', domain: 'scotiabankcolpatria.com', isColombiaNative: true },
  { ats: 'greenhouse', token: 'sofka', companyName: 'Sofka Technologies', domain: 'sofka.com.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'pragma', companyName: 'Pragma', domain: 'pragma.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'ceiba', companyName: 'Ceiba Software', domain: 'ceiba.com.co', isColombiaNative: true },
  { ats: 'greenhouse', token: 'canonical', companyName: 'Canonical (Ubuntu)', domain: 'canonical.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'gitlab', companyName: 'GitLab', domain: 'gitlab.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'automattic', companyName: 'Automattic (WordPress)', domain: 'automattic.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'brex', companyName: 'Brex', domain: 'brex.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'cloudflare', companyName: 'Cloudflare', domain: 'cloudflare.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'github', companyName: 'GitHub', domain: 'github.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'datadog', companyName: 'Datadog', domain: 'datadoghq.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'mongodb', companyName: 'MongoDB', domain: 'mongodb.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'twilio', companyName: 'Twilio', domain: 'twilio.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'hashicorp', companyName: 'HashiCorp', domain: 'hashicorp.com', isColombiaNative: false },
  { ats: 'lever', token: 'platzi', companyName: 'Platzi', domain: 'platzi.com', isColombiaNative: true },
  { ats: 'lever', token: 'torre', companyName: 'Torre', domain: 'torre.ai', isColombiaNative: true },
  { ats: 'lever', token: 'melonn', companyName: 'Melonn', domain: 'melonn.com', isColombiaNative: true },
  { ats: 'lever', token: 'kushki', companyName: 'Kushki', domain: 'kushkipagos.com', isColombiaNative: true },
  { ats: 'lever', token: 'clara', companyName: 'Clara', domain: 'clara.com', isColombiaNative: false },
  { ats: 'lever', token: 'ontop', companyName: 'Ontop', domain: 'getontop.com', isColombiaNative: true },
  { ats: 'lever', token: 'vercel', companyName: 'Vercel', domain: 'vercel.com', isColombiaNative: false },
  { ats: 'lever', token: 'figma', companyName: 'Figma', domain: 'figma.com', isColombiaNative: false },
  { ats: 'lever', token: 'netflix', companyName: 'Netflix', domain: 'netflix.com', isColombiaNative: false },
  { ats: 'lever', token: 'spotify', companyName: 'Spotify', domain: 'spotify.com', isColombiaNative: false },
  { ats: 'lever', token: 'palantir', companyName: 'Palantir', domain: 'palantir.com', isColombiaNative: false },

  // ===================== EXPANSIÓN REMOTO / GLOBAL (contrata LATAM) =====================
  // Empresas remote-first y globales con tableros públicos. Si un token cambia, el fetch
  // devuelve 404 y simplemente se omite (sin romper el pipeline).

  // Greenhouse — remote-first / LATAM
  { ats: 'greenhouse', token: 'andela', companyName: 'Andela', domain: 'andela.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'deel', companyName: 'Deel', domain: 'deel.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'toggl', companyName: 'Toggl', domain: 'toggl.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'hotjar', companyName: 'Hotjar', domain: 'hotjar.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'buffer', companyName: 'Buffer', domain: 'buffer.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'zapier', companyName: 'Zapier', domain: 'zapier.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'doist', companyName: 'Doist', domain: 'doist.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'close', companyName: 'Close', domain: 'close.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'intercom', companyName: 'Intercom', domain: 'intercom.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'zendesk', companyName: 'Zendesk', domain: 'zendesk.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'atlassian', companyName: 'Atlassian', domain: 'atlassian.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'canva', companyName: 'Canva', domain: 'canva.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'notion', companyName: 'Notion', domain: 'notion.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'airtable', companyName: 'Airtable', domain: 'airtable.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'webflow', companyName: 'Webflow', domain: 'webflow.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'wrike', companyName: 'Wrike', domain: 'wrike.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'typeform', companyName: 'Typeform', domain: 'typeform.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'databricks', companyName: 'Databricks', domain: 'databricks.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'snowflake', companyName: 'Snowflake', domain: 'snowflake.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'confluent', companyName: 'Confluent', domain: 'confluent.io', isColombiaNative: false },
  { ats: 'greenhouse', token: 'elastic', companyName: 'Elastic', domain: 'elastic.co', isColombiaNative: false },
  { ats: 'greenhouse', token: 'crowdstrike', companyName: 'CrowdStrike', domain: 'crowdstrike.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'splunk', companyName: 'Splunk', domain: 'splunk.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'fullstory', companyName: 'FullStory', domain: 'fullstory.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'braze', companyName: 'Braze', domain: 'braze.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'amplitude', companyName: 'Amplitude', domain: 'amplitude.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'miro', companyName: 'Miro', domain: 'miro.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'shopify', companyName: 'Shopify', domain: 'shopify.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'stripe', companyName: 'Stripe', domain: 'stripe.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'duolingo', companyName: 'Duolingo', domain: 'duolingo.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'reddit', companyName: 'Reddit', domain: 'reddit.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'dropbox', companyName: 'Dropbox', domain: 'dropbox.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'grammarly', companyName: 'Grammarly', domain: 'grammarly.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'hubspot', companyName: 'HubSpot', domain: 'hubspot.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'affirm', companyName: 'Affirm', domain: 'affirm.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'robinhood', companyName: 'Robinhood', domain: 'robinhood.com', isColombiaNative: false },
  { ats: 'greenhouse', token: 'coinbase', companyName: 'Coinbase', domain: 'coinbase.com', isColombiaNative: false },

  // Lever — remote / global
  { ats: 'lever', token: 'remote', companyName: 'Remote.com', domain: 'remote.com', isColombiaNative: false },
  { ats: 'lever', token: 'plaid', companyName: 'Plaid', domain: 'plaid.com', isColombiaNative: false },
  { ats: 'lever', token: 'twitch', companyName: 'Twitch', domain: 'twitch.tv', isColombiaNative: false },
  { ats: 'lever', token: 'khanacademy', companyName: 'Khan Academy', domain: 'khanacademy.org', isColombiaNative: false },
  { ats: 'lever', token: 'flexport', companyName: 'Flexport', domain: 'flexport.com', isColombiaNative: false },
  { ats: 'lever', token: 'instacart', companyName: 'Instacart', domain: 'instacart.com', isColombiaNative: false },
  { ats: 'lever', token: 'nextdoor', companyName: 'Nextdoor', domain: 'nextdoor.com', isColombiaNative: false },
  { ats: 'lever', token: 'cohere', companyName: 'Cohere', domain: 'cohere.com', isColombiaNative: false },

  // Ashby — AI / startups remote-friendly
  { ats: 'ashby', token: 'openai', companyName: 'OpenAI', domain: 'openai.com', isColombiaNative: false },
  { ats: 'ashby', token: 'anthropic', companyName: 'Anthropic', domain: 'anthropic.com', isColombiaNative: false },
  { ats: 'ashby', token: 'ramp', companyName: 'Ramp', domain: 'ramp.com', isColombiaNative: false },
  { ats: 'ashby', token: 'linear', companyName: 'Linear', domain: 'linear.app', isColombiaNative: false },
  { ats: 'ashby', token: 'scaleai', companyName: 'Scale AI', domain: 'scale.com', isColombiaNative: false },
  { ats: 'ashby', token: 'perplexity', companyName: 'Perplexity', domain: 'perplexity.ai', isColombiaNative: false },
  { ats: 'ashby', token: 'elevenlabs', companyName: 'ElevenLabs', domain: 'elevenlabs.io', isColombiaNative: false },
  { ats: 'ashby', token: 'character', companyName: 'Character.AI', domain: 'character.ai', isColombiaNative: false },

  // Workable — remote-friendly
  { ats: 'workable', token: 'remote-first', companyName: 'Remote-First', domain: 'remote-first.com', isColombiaNative: false }
];

async function fetchGreenhouseJobsRaw(token: string) {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: any) => ({
      id: String(j.id),
      title: j.title || '',
      content: (j.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      url: j.absolute_url || '',
      location: j.location?.name || ''
    }));
  } catch {
    return [];
  }
}

async function fetchLeverJobsRaw(token: string) {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${token}?mode=json`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((j: any) => ({
      id: String(j.id),
      title: j.text || '',
      content: ((j.descriptionPlain || j.description || '')).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      url: j.hostedUrl || '',
      location: j.categories?.location || j.workplaceType || ''
    }));
  } catch {
    return [];
  }
}

async function fetchAshbyJobsRaw(org: string) {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${org}?includeCompensation=true`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: any) => ({
      id: String(j.id),
      title: j.title || '',
      content: ((j.descriptionHtml || j.description || '')).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      url: j.jobUrl || `https://jobs.ashbyhq.com/${org}/${j.id}`,
      location: j.location || (j.isRemote ? 'Remote' : '')
    }));
  } catch {
    return [];
  }
}

async function fetchWorkableJobsRaw(account: string) {
  try {
    const res = await fetch(`https://apply.workable.com/api/v3/accounts/${account}/jobs?details=true`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: any) => {
      const loc = j.location
        ? [j.location.city, j.location.region, j.location.country].filter(Boolean).join(', ')
        : (j.remote ? 'Remote' : '');
      return {
        id: String(j.shortcode || j.id),
        title: j.title || j.full_title || '',
        content: ((j.description || j.summary || '')).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        url: j.url || `https://apply.workable.com/${account}/j/${j.shortcode}/`,
        location: loc
      };
    });
  } catch {
    return [];
  }
}

export async function scrapeAtsColombiaJobs(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenIds = new Set<string>();

  for (const target of TARGET_COLOMBIA_ATS_BOARDS) {
    let rawJobs: any[] = [];
    if (target.ats === 'greenhouse') {
      rawJobs = await fetchGreenhouseJobsRaw(target.token);
    } else if (target.ats === 'lever') {
      rawJobs = await fetchLeverJobsRaw(target.token);
    } else if (target.ats === 'ashby') {
      rawJobs = await fetchAshbyJobsRaw(target.token);
    } else {
      rawJobs = await fetchWorkableJobsRaw(target.token);
    }

    for (const raw of rawJobs) {
      const title = raw.title;
      const content = raw.content;
      const rawLoc = raw.location;

      if (!title) continue;

      // 1. Location Check: acepta Colombia y vacantes REMOTAS (Colombia / Latam / Worldwide),
      //    descarta solo las presenciales/híbridas fuera de Colombia.
      const locNorm = normalizeLocation(rawLoc, `${title} ${target.companyName} ${content}`);
      const rawLocLower = (rawLoc || '').toLowerCase();

      if (!locNorm.isColombiaValid) {
        // Señal remota explícita en la ubicación (o sin ubicación) => remoto global/latam.
        // Se acepta independientemente de si la empresa es "nativa colombiana" o no:
        // antes solo las empresas nativas pasaban, descartando vacantes remotas de empresas
        // de EE.UU./globales que contratan talento en Colombia/Latam.
        const hasRemoteSignal = /remote|remot[oa]|anywhere|worldwide|global|latam|latin\s*america|colombia|americas|emea/i.test(rawLocLower) || !rawLoc;
        const isUsOnly = /united\s*states|usa|u\.s\.a?|us\s*only|canada|toronto|vancouver|montreal|europe|uk\b|u\.k\.|london|berlin|paris|madrid|india|bangalore|singapore|japan|australia|apac\b/i.test(rawLocLower) && !/worldwide|global|anywhere|latam|latin\s*america|americas|emea|colombia/i.test(rawLocLower);

        if (hasRemoteSignal && !isUsOnly) {
          const worldwide = /worldwide|global|anywhere|emea|americas/i.test(rawLocLower);
          locNorm.isColombiaValid = true;
          locNorm.city = 'Remoto (Colombia)';
          locNorm.country = 'CO';
          locNorm.displayLocation = worldwide ? '🌎 Remoto · Mundial' : '🏠 Remoto · Colombia / Latam';
          locNorm.filterKey = 'remoto_colombia';
          locNorm.isRemote = true;
          locNorm.workModality = worldwide ? 'remote_worldwide' : 'remote_country';
        } else {
          continue;
        }
      }

      // 2. Experience check
      const expRes = detectExperience(title, content);
      if (!expRes.isEligible) {
        continue;
      }

      const uniqueId = `${target.ats}-${raw.id}`;
      if (seenIds.has(uniqueId)) continue;
      seenIds.add(uniqueId);

      // 3. English requirement detection
      const engResult = detectEnglishRequirement(title, content);

      // 4. Salary extraction
      const salResult = extractSalary(content, '');

      // 5. Skills & category extraction
      const skills = extractSkills(`${title} ${content}`);
      const contractRes = detectContractType(title, content, '');
      
      // Determine category (tech or commercial/finance/ops)
      const nonTechRes = detectNonTechCategory(title, content);
      const techRes = detectTechCategory(title, content);

      const isCommercialOrFinance = 
        title.toLowerCase().includes('sales') || 
        title.toLowerCase().includes('comercial') || 
        title.toLowerCase().includes('ventas') || 
        title.toLowerCase().includes('account') ||
        title.toLowerCase().includes('contab') ||
        title.toLowerCase().includes('financ') ||
        title.toLowerCase().includes('project');

      const category = isCommercialOrFinance 
        ? nonTechRes.category 
        : techRes.category;
      
      const categoryLabel = isCommercialOrFinance 
        ? nonTechRes.categoryLabel 
        : techRes.categoryLabel;

      jobs.push({
        id: uniqueId,
        source: target.ats,
        sourceUrl: raw.url,
        sourceJobId: raw.id,
        title: title,
        companyName: target.companyName,
        companyDomain: target.domain,
        description: content.slice(0, 800) || `Oportunidad para ${title} en ${target.companyName}.`,
        locationCity: locNorm.city,
        locationDepartment: locNorm.department,
        locationCountry: 'CO',
        displayLocation: locNorm.displayLocation,
        locationFilterKey: locNorm.filterKey,
        isRemote: locNorm.isRemote,
        workModality: locNorm.workModality,
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
        seniority: expRes.seniority,
        maxYearsExperience: expRes.maxYearsExperience,
        isZeroExperience: expRes.isZeroExperience,
        experienceTier: expRes.experienceTier,
        experienceLabel: expRes.experienceLabel,
        requiredSkills: skills.length > 0 ? skills : ['Trabajo en equipo', 'Orientación a resultados'],
        contractType: contractRes.contractType,
        contractTypeLabel: contractRes.contractTypeLabel,
        category: category as any,
        categoryLabel: categoryLabel,
        applicantCountText: 'Menos de 25 postulantes',
        applicantTier: 'low',
        postedDateText: 'Reciente',
        scrapedAt: new Date().toISOString()
      });
    }
  }

  return jobs;
}
