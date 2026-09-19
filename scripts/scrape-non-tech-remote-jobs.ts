import { scrapeNonTechRemoteColombia } from '../src/lib/services/scrapers/non-tech-remote-colombia';
import { decodeHtmlEntities } from '../src/lib/services/scrapers/clean-text';
import fs from 'fs';
import path from 'path';

async function runNonTechRemoteScraper() {
  console.log('🚀 ========================================================');
  console.log('   REALJOBS - MOTOR REMOTO NO-TECH (COLOMBIA)');
  console.log('   (Atención al Cliente, Ventas, Marketing, Asistentes, RRHH, Finanzas)');
  console.log('========================================================\n');

  const jobs = await scrapeNonTechRemoteColombia();

  for (const j of jobs) {
    j.title = decodeHtmlEntities(j.title);
    j.companyName = decodeHtmlEntities(j.companyName);
    j.description = decodeHtmlEntities(j.description);
    j.displayLocation = decodeHtmlEntities(j.displayLocation);
  }

  const dataPath = path.resolve(process.cwd(), 'src/lib/scraped-colombia-remote-general.json');
  fs.writeFileSync(dataPath, JSON.stringify(jobs, null, 2), 'utf-8');

  console.log(`\n🎉 Total Vacantes Remotas No-Tech recolectadas: ${jobs.length}`);
  console.log(`💾 Guardado en: ${dataPath}`);
}

runNonTechRemoteScraper().catch(console.error);
