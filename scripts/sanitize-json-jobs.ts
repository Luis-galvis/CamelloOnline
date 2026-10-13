import fs from 'fs';
import path from 'path';
import { normalizeLocation } from '../src/lib/services/scrapers/location-normalizer';
import { detectContractType, getContractTypeLabel } from '../src/lib/services/scrapers/contract-detector';
import { detectExperience } from '../src/lib/services/scrapers/experience-detector';
import { detectEnglishRequirement } from '../src/lib/services/scrapers/english-detector';
import { decodeHtmlEntities } from '../src/lib/services/scrapers/clean-text';

async function sanitizeJsonJobs() {
  console.log('🧹 [REALJOBS] Iniciando saneamiento exhaustivo de scraped-colombia-jobs.json...');

  const jobsPath = path.resolve(process.cwd(), 'src/lib/scraped-colombia-jobs.json');
  const rawJobs: any[] = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));

  console.log(`📥 Total ofertas iniciales: ${rawJobs.length}`);

  let fakeAprendizajeFixed = 0;
  let remotePresencialFixed = 0;
  let zeroExpFixed = 0;
  let foreignRejected = 0;

  const sanitizedList: any[] = [];

  for (const job of rawJobs) {
    const title = decodeHtmlEntities(job.title || '').trim();
    const compName = decodeHtmlEntities(job.companyName || '').trim();
    let desc = decodeHtmlEntities(job.description || '').trim();

    // 1. Normalizar ubicación y modalidad
    const locRes = normalizeLocation(job.locationCity || job.displayLocation || 'Colombia', `${title} ${desc}`);
    if (!locRes.isColombiaValid) {
      foreignRejected++;
      continue;
    }

    if (job.isRemote && !locRes.isRemote) {
      remotePresencialFixed++;
    }

    job.title = title;
    job.companyName = compName;
    job.isRemote = locRes.isRemote;
    job.workModality = locRes.workModality;
    job.displayLocation = locRes.displayLocation;
    job.locationCity = locRes.city;
    job.locationFilterKey = locRes.filterKey;
    job.locationCountry = locRes.country || 'CO';

    // 2. Normalizar tipo de contrato
    const oldContract = job.contractType;
    const contractRes = detectContractType(title, desc, '');
    const finalContractType = contractRes.contractType;
    job.contractType = finalContractType;
    job.contractTypeLabel = getContractTypeLabel(finalContractType);

    if (oldContract === 'aprendizaje' && finalContractType !== 'aprendizaje') {
      fakeAprendizajeFixed++;
    }

    // 3. Normalizar experiencia requerida
    const oldZeroExp = job.isZeroExperience;
    const expRes = detectExperience(title, desc);
    job.isZeroExperience = expRes.isZeroExperience;
    job.maxYearsExperience = expRes.maxYearsExperience;
    job.experienceTier = expRes.experienceTier;
    job.experienceLabel = expRes.experienceLabel;
    job.seniority = expRes.seniority;

    if (oldZeroExp && !expRes.isZeroExperience) {
      zeroExpFixed++;
    }

    // 4. Normalizar inglés
    const engRes = detectEnglishRequirement(title, `${desc} ${compName}`);
    job.requiresEnglish = engRes.requiresEnglish;
    job.englishBadgeText = engRes.badgeText;
    job.englishLevel = engRes.englishLevel;

    sanitizedList.push(job);
  }

  fs.writeFileSync(jobsPath, JSON.stringify(sanitizedList, null, 2), 'utf8');

  console.log('✅ Saneamiento completado con éxito:');
  console.log(`- Total ofertas guardadas: ${sanitizedList.length}`);
  console.log(`- Contratos falsos de "Aprendizaje" corregidos: ${fakeAprendizajeFixed}`);
  console.log(`- Falsas ofertas "Remotas" corregidas a Presencial / Híbrido: ${remotePresencialFixed}`);
  console.log(`- Falsos "Sin Experiencia" corregidos a sus años reales: ${zeroExpFixed}`);
  console.log(`- Ofertas extranjeras descartadas: ${foreignRejected}`);
}

sanitizeJsonJobs().catch(console.error);
