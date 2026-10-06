import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { aggregateAllColombiaJobs } from '../src/lib/services/scrapers/index';
import { decodeHtmlEntities } from '../src/lib/services/scrapers/clean-text';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://tapusiqdotxhtnyxavta.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in environment');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function shortHash(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex').slice(0, 24);
}

async function runColombiaScraperPipeline() {
  console.log('🚀 ========================================================');
  console.log('   REALJOBS COLOMBIA - MOTOR DE SCRAPING MULTIFUENTE EXPANDIDO');
  console.log('   (LinkedIn + Recruiter Posts + WeRemoto/WorkRemoto + Computrabajo +');
  console.log('    ElEmpleo + Torre + Jooble + ATSs + Ventas, TAT & Contabilidad)');
  console.log('========================================================\n');

  const report = await aggregateAllColombiaJobs();

  // Clean HTML entities on all jobs
  for (const j of report.jobs) {
    j.title = decodeHtmlEntities(j.title);
    j.companyName = decodeHtmlEntities(j.companyName);
    j.description = decodeHtmlEntities(j.description);
    j.displayLocation = decodeHtmlEntities(j.displayLocation);
  }

  console.log(`\n📊 REPORTE DE EXTRACCIÓN Y DEDUPLICACIÓN EN COLOMBIA:`);
  console.log(`   - Total Bruto Encontrado: ${report.totalRawFound}`);
  console.log(`   - LinkedIn Colombia (Jobs): ${report.sourcesBreakdown.linkedin}`);
  console.log(`   - LinkedIn Posts (Reclutadores & Feed): ${report.sourcesBreakdown.linkedinPosts}`);
  console.log(`   - WeRemoto / WorkRemoto (Remoto Latam): ${report.sourcesBreakdown.weremoto}`);
  console.log(`   - Computrabajo Colombia: ${report.sourcesBreakdown.computrabajo}`);
  console.log(`   - ElEmpleo Colombia: ${report.sourcesBreakdown.elempleo}`);
  console.log(`   - Get on Board Latam/CO: ${report.sourcesBreakdown.getonbrd}`);
  console.log(`   - Remotive Global/Latam (Remoto): ${report.sourcesBreakdown.remotive}`);
  console.log(`   - Torre.ai Colombia/Remote: ${report.sourcesBreakdown.torre}`);
  console.log(`   - Empleos Remotos No-Tech: ${report.sourcesBreakdown.nonTechRemote}`);
  console.log(`   - ATSs Directos (Rappi, Nubank, EPAM, Bitso, Scotiabank, etc.): ${report.sourcesBreakdown.ats}`);
  console.log(`   - Ventas, TAT, Puntos de Venta & Contabilidad: ${report.sourcesBreakdown.salesCommercial}`);
  console.log(`   - Jooble Colombia: ${report.sourcesBreakdown.jooble}`);
  console.log(`   - Luk Colombia (takealuk.com): ${report.sourcesBreakdown.luk || 0}`);
  console.log(`   - Cajas Locales (Comfatolima, Comfenalco, Sena APE): ${report.sourcesBreakdown.localBoards}`);
  console.log(`   - ✨ Total Deduplicado en Colombia: ${report.totalDeduplicatedColombiaJobs}`);
  console.log(`   - 🏠 Vacantes 100% Remotas: ${report.remoteCount}`);
  console.log(`   - ⚡ Vacantes Sin Experiencia (0 YoE): ${report.zeroExpCount}`);
  console.log(`   - 🚀 Remotas Sin Experiencia (0 YoE + Remoto): ${report.remoteZeroExpCount}`);
  console.log(`   - 📍 Vacantes en Ibagué / Tolima: ${report.ibagueCount}`);
  console.log(`   - 🇬🇧 Piden Inglés: ${report.englishBreakdown.requiresEnglish}`);
  console.log(`   - 🇨🇴 No Requieren Inglés (Español): ${report.englishBreakdown.noEnglishRequired}\n`);

  // 1. Guardar archivo local de respaldo JSON de inmediato
  const dataPath = path.resolve(process.cwd(), 'src/lib/scraped-colombia-jobs.json');
  fs.writeFileSync(dataPath, JSON.stringify(report.jobs, null, 2), 'utf-8');
  console.log(`💾 Respaldo JSON actualizado con ${report.jobs.length} vacantes en: ${dataPath}`);

  if (process.env.SKIP_DB === '1') {
    console.log('⏭️  SKIP_DB=1: se omite la sincronización con Supabase (solo JSON local).');
    return;
  }

  // 2. Limpiar vacantes anteriores en Supabase
  console.log('🧹 Sincronizando vacantes en Supabase...');
  try {
    await supabase.from('job_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (err: any) {
    console.warn('Nota al limpiar job_posts:', err.message);
  }

  // 3. Obtener o crear mapa de empresas
  const uniqueCompanies = new Map<string, any>();
  for (const job of report.jobs) {
    const compSlug = slugify(job.companyName) || `empresa-${shortHash(job.companyName)}`;
    if (!uniqueCompanies.has(compSlug)) {
      uniqueCompanies.set(compSlug, {
        name: job.companyName,
        slug: compSlug,
        domain_email: job.companyDomain || `${compSlug}.com`,
        website: job.companyDomain ? `https://${job.companyDomain}` : `https://www.google.com/search?q=${encodeURIComponent(job.companyName)}`,
        industry: job.category === 'sales_commercial' || job.category === 'finance_accounting' ? 'Consumo Masivo & Comercial' : 'Tecnología & Software',
        country_code: 'CO',
        city: job.locationCity,
        is_verified: true,
        is_auto_ingested: true,
        ats_source: ['greenhouse', 'lever', 'ashby', 'workable'].includes(job.source) ? (job.source as any) : 'manual'
      });
    }
  }

  console.log(`🏢 Sincronizando ${uniqueCompanies.size} empresas en Supabase...`);
  const companyList = Array.from(uniqueCompanies.values());
  const companyIdMap = new Map<string, string>();

  // Upsert companies in chunks of 50
  const allSlugsInserted: string[] = companyList.map(c => c.slug);
  for (let i = 0; i < companyList.length; i += 50) {
    const chunk = companyList.slice(i, i + 50);
    const { data: inserted, error: cErr } = await supabase
      .from('companies')
      .upsert(chunk, { onConflict: 'slug' })
      .select('id, slug');

    if (inserted && inserted.length > 0) {
      for (const c of inserted) {
        companyIdMap.set(c.slug, c.id);
      }
    } else if (cErr) {
      console.warn(`[Companies] Error en upsert lote ${Math.floor(i/50)+1}:`, cErr.message);
    }
  }

  // Si algún company_id no fue recuperado por el upsert (conflicto sin .select()),
  // hacer un SELECT adicional por slugs para garantizar 100% de cobertura (crucial para LUK y seed data)
  const missingSlugs = allSlugsInserted.filter(slug => !companyIdMap.has(slug));
  if (missingSlugs.length > 0) {
    console.log(`⚡ Recuperando ${missingSlugs.length} company IDs faltantes por SELECT directo...`);
    for (let i = 0; i < missingSlugs.length; i += 50) {
      const slugChunk = missingSlugs.slice(i, i + 50);
      const { data: existing } = await supabase
        .from('companies')
        .select('id, slug')
        .in('slug', slugChunk);
      if (existing) {
        for (const c of existing) {
          companyIdMap.set(c.slug, c.id);
        }
      }
    }
    console.log(`✅ Company map completo: ${companyIdMap.size}/${allSlugsInserted.length} empresas con ID`);
  }

  // 4. Batch insert job posts in chunks of 50
  const jobPostsToInsert: any[] = [];
  for (const job of report.jobs) {
    // Exclude senior / lead roles for Junior platform
    if (job.seniority === 'senior' || /\b(senior|sr\.?|lead|principal|staff|director|gerente)\b/i.test(job.title)) {
      continue;
    }

    const compSlug = slugify(job.companyName) || `empresa-${shortHash(job.companyName)}`;
    const companyId = companyIdMap.get(compSlug);
    if (!companyId) continue;

    const isLiPost = Boolean(job.isLinkedInPost || (job as any).isDirectRecruiterPost || (job.sourceUrl || '').includes('/posts/') || (job.sourceUrl || '').includes('/feed/update/'));
    const uniqueJobIdHash = isLiPost 
      ? `lipost-${shortHash(job.title + job.companyName)}`
      : shortHash(`${job.source}:${job.sourceJobId || job.sourceUrl}:${job.title}:${job.displayLocation}`);
    const baseSlug = `${slugify(job.title).slice(0, 50)}-${compSlug.slice(0, 30)}-${uniqueJobIdHash.slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}`;

    // Strict ATS enum compliance: only valid enum values allowed in Postgres enum ats_source
    const mappedAts = ['greenhouse', 'lever', 'ashby', 'workable'].includes(job.source) ? job.source : 'manual';

    const englishEnum = job.requiresEnglish
      ? (job.englishLevel === 'c1_advanced' ? 'c1_advanced' : 'b2_upper_intermediate')
      : 'no_english';

    const minSal = Math.max(300, Number(job.salaryMinUsdEquivalent || job.salaryMinUsd) || 700);
    const maxSal = Math.max(minSal, Number(job.salaryMaxUsdEquivalent || job.salaryMaxUsd) || 1500);

    const isZeroExp = Boolean(job.isZeroExperience || job.experienceTier === 'zero_exp' || Number(job.maxYearsExperience) === 0);
    const rawExp = Number(job.minYearsExperience ?? job.maxYearsExperience);
    // Clamp 0.0-2.0 (check constraint job_posts_max_years_experience_required_check). Las vacantes que piden >2 años ya se descartaron en el verificador.
    const expReq = isZeroExp ? 0 : Math.min(2.0, Math.max(0, isNaN(rawExp) ? 1.0 : rawExp));

    let mappedSeniority = 'junior';
    if (job.seniority === 'trainee' || job.seniority === 'intern' || isZeroExp) {
      mappedSeniority = 'trainee';
    } else if (job.seniority === 'early_mid') {
      mappedSeniority = 'early_mid';
    }

    jobPostsToInsert.push({
      company_id: companyId,
      title: job.title.trim().slice(0, 140),
      slug: baseSlug.slice(0, 180),
      description: job.description.slice(0, 1500),
      work_modality: job.workModality,
      location_country: 'CO',
      location_city: job.locationCity,
      salary_min_usd: minSal,
      salary_max_usd: maxSal,
      currency: job.salaryCurrency || 'COP',
      seniority_required: mappedSeniority,
      english_required: englishEnum,
      max_years_experience_required: expReq,
      is_zero_experience: isZeroExp,
      status: 'active',
      is_auto_ingested: true,
      source_ats: mappedAts,
      source_url: job.sourceUrl,
      source_job_id: uniqueJobIdHash,
      is_claimed: false
    });
  }

  console.log(`📥 Insertando ${jobPostsToInsert.length} vacantes junior / entry-level en Supabase por lotes...`);
  let totalInserted = 0;
  for (let i = 0; i < jobPostsToInsert.length; i += 50) {
    const chunk = jobPostsToInsert.slice(i, i + 50);
    const { data: res, error: jErr } = await supabase
      .from('job_posts')
      .insert(chunk)
      .select('id');

    if (!jErr && res) {
      totalInserted += res.length;
    } else if (jErr) {
      console.warn(`Nota en lote ${i / 50 + 1}: ${jErr.message}. Reintentando inserción resiliente fila por fila...`);
      for (const item of chunk) {
        const { data: singleRes, error: sErr } = await supabase
          .from('job_posts')
          .insert([item])
          .select('id');
        if (!sErr && singleRes) {
          totalInserted += singleRes.length;
        } else if (sErr) {
          console.warn(`  ⚠️ Fila fallida "${item.title}":`, sErr.message);
        }
      }
    }
  }

  console.log(`\n🎉 ========================================================`);
  console.log(`   ✅ ${totalInserted} VACANTES REALES DE COLOMBIA PERSISTIDAS EN SUPABASE`);
  console.log(`   ✅ RESPALDO JSON LOCAL EN src/lib/scraped-colombia-jobs.json (${report.jobs.length} vacantes)`);
  console.log(`========================================================\n`);
}

runColombiaScraperPipeline().catch(console.error);
