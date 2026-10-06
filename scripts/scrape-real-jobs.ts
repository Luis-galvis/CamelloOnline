import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { 
  evaluateJobEligibility, 
  detectModality, 
  extractSkills 
} from '../src/lib/services/ats-ingestion.ts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tapusiqdotxhtnyxavta.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in environment');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Empresas reales con tableros públicos en Greenhouse y Lever
const REAL_TARGET_BOARDS = [
  // Greenhouse Public Boards (https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true)
  { ats: 'greenhouse' as const, token: 'brex', companyName: 'Brex', domain: 'brex.com', industry: 'FinTech & SaaS' },
  { ats: 'greenhouse' as const, token: 'cloudflare', companyName: 'Cloudflare', domain: 'cloudflare.com', industry: 'Cloud & Security' },
  { ats: 'greenhouse' as const, token: 'github', companyName: 'GitHub', domain: 'github.com', industry: 'Developer Tools' },
  { ats: 'greenhouse' as const, token: 'datadog', companyName: 'Datadog', domain: 'datadoghq.com', industry: 'Observability & Cloud' },
  { ats: 'greenhouse' as const, token: 'automattic', companyName: 'Automattic', domain: 'automattic.com', industry: 'Open Source & Web' },
  { ats: 'greenhouse' as const, token: 'canonical', companyName: 'Canonical (Ubuntu)', domain: 'canonical.com', industry: 'Open Source & Linux' },
  { ats: 'greenhouse' as const, token: 'gitlab', companyName: 'GitLab', domain: 'gitlab.com', industry: 'DevOps Platform' },
  { ats: 'greenhouse' as const, token: 'mongodb', companyName: 'MongoDB', domain: 'mongodb.com', industry: 'Database & Cloud' },
  { ats: 'greenhouse' as const, token: 'twilio', companyName: 'Twilio', domain: 'twilio.com', industry: 'Communications API' },
  { ats: 'greenhouse' as const, token: 'hashicorp', companyName: 'HashiCorp', domain: 'hashicorp.com', industry: 'Infrastructure & Cloud' },
  
  // Lever Public Postings (https://api.lever.co/v0/postings/{token}?mode=json)
  { ats: 'lever' as const, token: 'vercel', companyName: 'Vercel', domain: 'vercel.com', industry: 'Cloud & Frontend' },
  { ats: 'lever' as const, token: 'figma', companyName: 'Figma', domain: 'figma.com', industry: 'Design & Collaboration' },
  { ats: 'lever' as const, token: 'netflix', companyName: 'Netflix', domain: 'netflix.com', industry: 'Streaming & Media' },
  { ats: 'lever' as const, token: 'spotify', companyName: 'Spotify', domain: 'spotify.com', industry: 'Audio & Music' },
  { ats: 'lever' as const, token: 'palantir', companyName: 'Palantir Technologies', domain: 'palantir.com', industry: 'Enterprise Data & AI' }
];

async function fetchGreenhouseJobs(boardToken: string) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      console.log(`⚠️ Greenhouse [${boardToken}]: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.jobs || []).map((j: any) => ({
      id: String(j.id),
      title: j.title || '',
      content: j.content || '',
      url: j.absolute_url || '',
      location: j.location?.name || 'Remote'
    }));
  } catch (err: any) {
    console.log(`⚠️ Error fetching Greenhouse [${boardToken}]: ${err.message}`);
    return [];
  }
}

async function fetchLeverJobs(companyToken: string) {
  const url = `https://api.lever.co/v0/postings/${companyToken}?mode=json`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      console.log(`⚠️ Lever [${companyToken}]: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data || []).map((j: any) => ({
      id: String(j.id),
      title: j.text || '',
      content: j.descriptionPlain || j.description || '',
      url: j.hostedUrl || '',
      location: j.categories?.location || j.workplaceType || 'Remote'
    }));
  } catch (err: any) {
    console.log(`⚠️ Error fetching Lever [${companyToken}]: ${err.message}`);
    return [];
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
}

async function runRealScrapingPipeline() {
  console.log('🚀 ========================================================');
  console.log('   INICIANDO SCRAPING EN VIVO DE VACANTES ATS REALES');
  console.log('   (Greenhouse & Lever Public APIs - Filtro Junior Tech)');
  console.log('========================================================\n');

  let totalScanned = 0;
  let totalRejectedSeniorOrMid = 0;
  let totalRejectedOverExperience = 0;
  let totalRejectedNonTech = 0;
  let totalJuniorAccepted = 0;
  let totalInsertedInDb = 0;

  for (const target of REAL_TARGET_BOARDS) {
    console.log(`\n🔎 [${target.companyName}] Scrapeando tablero público (${target.ats.toUpperCase()} / token: ${target.token})...`);

    // 1. Fetch raw jobs
    let rawJobs: any[] = [];
    if (target.ats === 'greenhouse') {
      rawJobs = await fetchGreenhouseJobs(target.token);
    } else {
      rawJobs = await fetchLeverJobs(target.token);
    }

    totalScanned += rawJobs.length;
    console.log(`   📦 Encontradas ${rawJobs.length} vacantes brutas en el ATS.`);

    if (rawJobs.length === 0) continue;

    // 2. Ensure company exists in Supabase
    const { data: company, error: compErr } = await supabase
      .from('companies')
      .upsert({
        name: target.companyName,
        slug: slugify(target.companyName),
        domain_email: target.domain,
        website: `https://${target.domain}`,
        industry: target.industry,
        is_verified: true,
        is_auto_ingested: true,
        ats_source: target.ats,
        ats_board_token: target.token
      }, { onConflict: 'slug' })
      .select()
      .single();

    if (compErr || !company) {
      console.error(`   ❌ Error upserting company ${target.companyName}:`, compErr);
      continue;
    }

    // 3. Process and filter each job
    for (const job of rawJobs) {
      const evalResult = evaluateJobEligibility(job.title, job.content);

      if (!evalResult.isEligible) {
        if (evalResult.rejectionReason?.includes('Title contains senior') || evalResult.rejectionReason?.includes('executive')) {
          totalRejectedSeniorOrMid++;
        } else if (evalResult.rejectionReason?.includes('years of experience') || evalResult.rejectionReason?.includes('Maximum allowed')) {
          totalRejectedOverExperience++;
        } else if (evalResult.rejectionReason?.includes('Non-tech')) {
          totalRejectedNonTech++;
        }
        continue;
      }

      // Accepted Junior / Entry-level role!
      totalJuniorAccepted++;
      const boostBadge = evalResult.isZeroExperience ? '⚡ [0-YoE BOOST]' : '🔹 [JUNIOR]';
      console.log(`   ${boostBadge} ACEPTADA: "${job.title}" (Max YoE: ${evalResult.maxYearsExperienceRequired})`);

      const modality = detectModality(`${job.location} ${job.title}`);
      const skills = extractSkills(`${job.title} ${job.content}`);
      const baseSlug = slugify(`${job.title}-${target.companyName}-${job.id.slice(0, 8)}`);

      // Persist in Supabase job_posts
      const { data: inserted, error: insertErr } = await supabase
        .from('job_posts')
        .upsert({
          company_id: company.id,
          title: job.title.trim(),
          slug: baseSlug,
          description: job.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').slice(0, 800) || `Vacante ${job.title} en ${target.companyName}.`,
          work_modality: modality,
          salary_min_usd: evalResult.isZeroExperience ? 1400 : 1800,
          salary_max_usd: evalResult.isZeroExperience ? 2200 : 2800,
          currency: 'USD',
          seniority_required: evalResult.seniority,
          english_required: 'b2_upper_intermediate',
          max_years_experience_required: evalResult.maxYearsExperienceRequired,
          is_zero_experience: evalResult.isZeroExperience,
          status: 'active',
          is_auto_ingested: true,
          source_ats: target.ats,
          source_url: job.url,
          source_job_id: job.id,
          is_claimed: false
        }, { onConflict: 'source_ats, source_job_id' })
        .select()
        .single();

      if (insertErr) {
        // If conflict on slug or other, log
        console.log(`   ⚠️ Nota al insertar "${job.title}": ${insertErr.message}`);
      } else {
        totalInsertedInDb++;
      }
    }
  }

  console.log('\n========================================================');
  console.log('🎉 RESUMEN DE EJECUCIÓN DEL PIPELINE DE SCRAPING ATS:');
  console.log('========================================================');
  console.log(`📊 Total Vacantes Analizadas en Vivo: ${totalScanned}`);
  console.log(`🚫 Descartadas por Senior / Lead / Staff / Manager: ${totalRejectedSeniorOrMid}`);
  console.log(`🚫 Descartadas por Requerir > 2 Años de Experiencia: ${totalRejectedOverExperience}`);
  console.log(`🚫 Descartadas por No ser roles Tech / Software: ${totalRejectedNonTech}`);
  console.log(`✅ Vacantes Junior / Entry-Level Aceptadas: ${totalJuniorAccepted}`);
  console.log(`💾 Vacantes Reales Persistidas en Supabase: ${totalInsertedInDb}`);
  console.log('========================================================\n');
}

runRealScrapingPipeline();
