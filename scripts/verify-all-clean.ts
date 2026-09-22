import fs from 'fs';
import path from 'path';

const jobsPath = path.resolve(process.cwd(), 'src/lib/scraped-colombia-jobs.json');
const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));

console.log('=== VERIFICACIÓN EXHAUSTIVA DE CALIDAD DE VACANTES ===');
console.log(`Total de vacantes en el sistema: ${jobs.length}`);

// 1. Revisar URLs
const brokenUrls: any[] = [];
for (const j of jobs) {
  const u = j.sourceUrl || '';
  if (!u.startsWith('http')) {
    brokenUrls.push({ id: j.id, title: j.title, url: u, reason: 'Protocolo inválido' });
  } else if (u.includes('{{') || u.includes('undefined')) {
    brokenUrls.push({ id: j.id, title: j.title, url: u, reason: 'Placeholder sin renderizar' });
  } else if (u.includes('linkedin.com/jobs/view/') && !u.match(/\d{7,}/)) {
    brokenUrls.push({ id: j.id, title: j.title, url: u, reason: 'LinkedIn sin ID numérico' });
  }
}

console.log(`\n1. URLs con formato inválido o rotas: ${brokenUrls.length}`);
if (brokenUrls.length > 0) {
  console.log('Detalle de URLs rotas:', brokenUrls);
} else {
  console.log('   ✅ 100% de las URLs tienen protocolo legítimo y estructura válida.');
}

// 2. Revisar publicaciones de LinkedIn
const liPosts = jobs.filter((j: any) => j.isLinkedInPost);
console.log(`\n2. Publicaciones de Reclutadores en LinkedIn (Posts): ${liPosts.length}`);
for (const p of liPosts) {
  console.log(`   - [${p.companyName}] "${p.title}" | Reclutador: ${p.postAuthor} | Email: ${p.contactEmail || 'N/A'}`);
}

// 3. Revisar vacantes 100% remotas sin experiencia (Zero Experience)
const zeroExpRemote = jobs.filter((j: any) => j.isZeroExperience && j.isRemote);
console.log(`\n3. Vacantes 100% Remotas SIN EXPERIENCIA PREVIA (Zero Exp / Trainee / Semillero): ${zeroExpRemote.length}`);
for (const z of zeroExpRemote) {
  console.log(`   - [${z.source.toUpperCase()}] [${z.companyName}] "${z.title}" | Seniority: ${z.seniority} | URL: ${z.sourceUrl.slice(0, 65)}`);
}

// 4. Revisar que SURA o NuBank no tengan URLs rotas
const sura = jobs.filter((j: any) => (j.companyName || '').toLowerCase().includes('sura'));
console.log(`\n4. Vacantes de SURA en el sistema: ${sura.length}`);
for (const s of sura) {
  console.log(`   - "${s.title}" | URL: ${s.sourceUrl}`);
}

const nubank = jobs.filter((j: any) => (j.companyName || '').toLowerCase().includes('nubank'));
console.log(`\n5. Vacantes de Nubank en el sistema: ${nubank.length}`);
for (const n of nubank) {
  console.log(`   - "${n.title}" | URL: ${n.sourceUrl}`);
}
