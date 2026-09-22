import fs from 'fs';
import path from 'path';
import { normalizeLocation } from '../src/lib/services/scrapers/location-normalizer';
import { detectEnglishRequirement } from '../src/lib/services/scrapers/english-detector';
import { detectExperience } from '../src/lib/services/scrapers/experience-detector';
import { detectContractType } from '../src/lib/services/scrapers/contract-detector';
import { scrapeLinkedInPosts } from '../src/lib/services/scrapers/linkedin-posts';
import { decodeHtmlEntities } from '../src/lib/services/scrapers/clean-text';

async function reprocessAndCleanJobs() {
  console.log('🧹 [REALJOBS] Iniciando limpieza, deduplicación y saneamiento del dataset...');

  const jobsPath = path.resolve(process.cwd(), 'src/lib/scraped-colombia-jobs.json');
  const rawJobs: any[] = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));

  console.log(`📥 Total vacantes iniciales: ${rawJobs.length}`);

  // 1. Filtrar registros sintéticos/rotos y enlaces inválidos
  const cleanList: any[] = [];
  const rejectedReasons: Record<string, number> = {};

  for (const job of rawJobs) {
    const url = (job.sourceUrl || '').trim();
    const title = (job.title || '').trim();

    // Descartar placeholders falsos de LinkedIn sin ID numérico
    if (url.includes('linkedin.com/jobs/view/') && !url.match(/\d{7,}/)) {
      rejectedReasons['fake_linkedin_slug'] = (rejectedReasons['fake_linkedin_slug'] || 0) + 1;
      continue;
    }

    // Descartar variables sin compilar de plantillas
    if (url.includes('{{') || url.includes('undefined') || title.includes('{{')) {
      rejectedReasons['template_variable'] = (rejectedReasons['template_variable'] || 0) + 1;
      continue;
    }

    // Descartar enlace 404 conocido de WeRemoto
    if (job.id === 'weremoto-ykk617fe') {
      rejectedReasons['weremoto_dead_link'] = (rejectedReasons['weremoto_dead_link'] || 0) + 1;
      continue;
    }

    // Descartar vacantes extranjeras que se hayan filtrado (ej. Beijing, Bangalore)
    const locNorm = normalizeLocation(job.locationCity || job.displayLocation || '', `${title} ${job.description || ''}`);
    if (!locNorm.isColombiaValid) {
      rejectedReasons['foreign_location'] = (rejectedReasons['foreign_location'] || 0) + 1;
      continue;
    }

    // 2. Re-evaluar con los detectores mejorados
    const expRes = detectExperience(title, job.description || '');
    job.isZeroExperience = expRes.isZeroExperience;
    job.maxYearsExperience = expRes.maxYearsExperience;
    job.experienceTier = expRes.experienceTier;
    job.experienceLabel = expRes.experienceLabel;
    job.experienceLevelLabel = expRes.experienceLabel;
    job.seniority = expRes.seniority;

    const contractRes = detectContractType(title, job.description || '', '');
    job.contractType = contractRes.contractType;
    job.contractTypeLabel = contractRes.contractTypeLabel;

    const engRes = detectEnglishRequirement(title, `${job.description || ''} ${job.companyName || ''}`);
    job.requiresEnglish = engRes.requiresEnglish;
    job.englishLevel = engRes.englishLevel;
    job.englishBadgeText = engRes.badgeText;
    if (engRes.levelLabel) job.englishLevelLabel = engRes.levelLabel;

    // Normalizar textos
    job.title = decodeHtmlEntities(job.title);
    job.companyName = decodeHtmlEntities(job.companyName);
    job.description = decodeHtmlEntities(job.description);

    cleanList.push(job);
  }

  console.log(`✅ Vacantes filtradas y re-evaluadas: ${cleanList.length}`);
  console.log('   Descartes realizados:', rejectedReasons);

  // 3. Inyectar Publicaciones Verificadas de LinkedIn (LinkedIn Posts)
  const liPosts = await scrapeLinkedInPosts();
  console.log(`📢 Agregando ${liPosts.length} publicaciones verificadas de reclutadores de LinkedIn...`);

  // Asegurar que no haya duplicados de IDs
  const finalMap = new Map<string, any>();
  
  // Agregar Posts al inicio para máxima visibilidad
  for (const post of liPosts) {
    finalMap.set(post.id, post);
  }

  // Agregar el resto de vacantes
  for (const job of cleanList) {
    if (!finalMap.has(job.id)) {
      finalMap.set(job.id, job);
    }
  }

  const finalJobs = Array.from(finalMap.values());

  // 4. Guardar archivo final
  fs.writeFileSync(jobsPath, JSON.stringify(finalJobs, null, 2), 'utf8');
  console.log(`💾 Dataset guardado exitosamente en: ${jobsPath} (${finalJobs.length} vacantes)`);

  // 5. Estadísticas de control de calidad
  let zeroExpCount = 0;
  let remoteCount = 0;
  let remoteZeroExpCount = 0;
  let liPostsCount = 0;
  let brokenUrlsCount = 0;

  for (const j of finalJobs) {
    if (j.isZeroExperience) zeroExpCount++;
    if (j.isRemote) remoteCount++;
    if (j.isZeroExperience && j.isRemote) remoteZeroExpCount++;
    if (j.isLinkedInPost) liPostsCount++;

    const u = j.sourceUrl || '';
    if (!u.startsWith('http') || u.includes('{{') || (u.includes('linkedin.com/jobs/view/') && !u.match(/\d{7,}/))) {
      brokenUrlsCount++;
      console.warn('⚠️ URL sospechosa detectada:', j.id, u);
    }
  }

  console.log('\n📊 MÉTRICAS FINALES DE CALIDAD:');
  console.log(`   - Total Vacantes: ${finalJobs.length}`);
  console.log(`   - Publicaciones de Reclutadores LinkedIn: ${liPostsCount}`);
  console.log(`   - Vacantes 100% Remotas: ${remoteCount}`);
  console.log(`   - Vacantes Sin Experiencia Previa (0 YoE / Trainee / Semillero): ${zeroExpCount}`);
  console.log(`   - ✨ Vacantes 100% Remotas Sin Experiencia: ${remoteZeroExpCount}`);
  console.log(`   - 🛡️ URLs Rotas / Sintéticas: ${brokenUrlsCount} (debe ser 0)`);
}

reprocessAndCleanJobs().catch(console.error);
