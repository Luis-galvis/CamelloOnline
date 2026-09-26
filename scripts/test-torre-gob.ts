import { scrapeGetOnBoardColombia } from '../src/lib/services/scrapers/getonboard-colombia';
import { scrapeTorreColombia } from '../src/lib/services/scrapers/torre-colombia';

async function main() {
  console.log('Testing GetOnBoard + Torre scrapers in parallel...\n');

  const [gob, torre] = await Promise.all([
    scrapeGetOnBoardColombia(),
    scrapeTorreColombia(),
  ]);

  const gobZero = gob.filter((j) => j.isZeroExperience).length;
  const gobRemote = gob.filter((j) => j.isRemote).length;
  const gobRemoteZero = gob.filter((j) => j.isRemote && j.isZeroExperience).length;

  const torreZero = torre.filter((j) => j.isZeroExperience).length;
  const torreRemote = torre.filter((j) => j.isRemote).length;
  const torreRemoteZero = torre.filter((j) => j.isRemote && j.isZeroExperience).length;

  console.log('═══════════════════════════════════════════════');
  console.log('GetOnBoard:');
  console.log(`  Total:           ${gob.length}`);
  console.log(`  Sin experiencia: ${gobZero}`);
  console.log(`  Remotas:         ${gobRemote}`);
  console.log(`  Remoto+SinExp:   ${gobRemoteZero}`);
  if (gob.length > 0) {
    console.log('  Sample titles:');
    gob.slice(0, 8).forEach((j) =>
      console.log(
        `    - ${j.title} [${j.isZeroExperience ? '0exp' : j.maxYearsExperience + 'yoe'}] ${j.isRemote ? '🌐REMOTO' : '📍local'}`
      )
    );
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('Torre.ai:');
  console.log(`  Total:           ${torre.length}`);
  console.log(`  Sin experiencia: ${torreZero}`);
  console.log(`  Remotas:         ${torreRemote}`);
  console.log(`  Remoto+SinExp:   ${torreRemoteZero}`);
  if (torre.length > 0) {
    console.log('  Sample titles:');
    torre.slice(0, 8).forEach((j) =>
      console.log(
        `    - ${j.title} [${j.isZeroExperience ? '0exp' : j.maxYearsExperience + 'yoe'}] ${j.isRemote ? '🌐REMOTO' : '📍local'}`
      )
    );
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('TOTAL COMBINED:', gob.length + torre.length);
}

main().catch(console.error);
