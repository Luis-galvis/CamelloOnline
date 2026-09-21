import fs from 'fs';
import path from 'path';
import { normalizeLocation } from '../src/lib/services/scrapers/location-normalizer';
import { detectEnglishRequirement } from '../src/lib/services/scrapers/english-detector';

const jobsPath = path.resolve(process.cwd(), 'src/lib/scraped-colombia-jobs.json');
const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));

console.log('Total input jobs:', jobs.length);

// 1. Filter out invalid/category URLs
const validJobs = jobs.filter((j: any) => {
  const u = j.sourceUrl || '';
  if (u.includes('weremoto.com/categories/')) return false;
  if (j.id && j.id.startsWith('weremoto-curated')) return false;
  return true;
});

console.log('Valid jobs after filtering broken category URLs:', validJobs.length);

// 2. Re-evaluate location and english
for (const job of validJobs) {
  const title = job.title || '';
  let rawCity = (job.locationCity || '')
    .replace(/^Remoto\s*·\s*/i, '')
    .replace(/^🏠\s*Remoto\s*·\s*/i, '')
    .replace(/^📍\s*/, '')
    .trim();
  
  const desc = job.description || '';
  
  // Re-run English detector
  const eng = detectEnglishRequirement(title, `${desc} ${job.companyName || ''}`);
  job.requiresEnglish = eng.requiresEnglish;
  job.englishLevel = eng.englishLevel;
  job.englishBadgeText = eng.badgeText;
  if (job.englishLevelLabel) job.englishLevelLabel = eng.levelLabel || eng.badgeText;

  // Re-run location normalizer
  const hasRemoteInTitleOrCity = /remot[oa]|remote|teletrabajo|desde\s*casa|wfh/i.test(`${title} ${rawCity}`);
  const locNorm = normalizeLocation(rawCity, title);

  if (locNorm.isColombiaValid) {
    job.isRemote = hasRemoteInTitleOrCity;
    job.workModality = hasRemoteInTitleOrCity ? 'remote_country' : (locNorm.workModality === 'remote_country' ? 'on_site' : locNorm.workModality);
    job.locationCity = locNorm.city;
    job.displayLocation = hasRemoteInTitleOrCity ? `Remoto · ${locNorm.city}` : `Presencial · ${locNorm.city}`;
    job.locationFilterKey = hasRemoteInTitleOrCity ? 'remoto_colombia' : locNorm.filterKey;
    if (job.description && job.description.includes('Modalidad: Remoto') && !job.isRemote) {
      job.description = job.description.replace('Modalidad: Remoto', 'Modalidad: Presencial / Híbrido');
    }
  }
}

fs.writeFileSync(jobsPath, JSON.stringify(validJobs, null, 2), 'utf8');
console.log('Successfully reprocessed and saved scraped-colombia-jobs.json');

// Check Michael Page job
const mp = validJobs.find((j: any) => j.id.includes('4468034605') || (j.companyName === 'Michael Page' && j.title.includes('System & Cloud Engineer')));
console.log('Michael Page job re-evaluated:', {
  id: mp?.id,
  title: mp?.title,
  company: mp?.companyName,
  displayLocation: mp?.displayLocation,
  isRemote: mp?.isRemote,
  workModality: mp?.workModality,
  locationFilterKey: mp?.locationFilterKey,
  requiresEnglish: mp?.requiresEnglish,
  englishBadgeText: mp?.englishBadgeText
});
