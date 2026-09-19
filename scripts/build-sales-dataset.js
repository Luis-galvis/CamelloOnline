const fs = require('fs');
const path = require('path');

const allJobsPath = path.join(__dirname, '../src/lib/scraped-colombia-jobs.json');
const salesJsonPath = path.join(__dirname, '../src/lib/scraped-colombia-sales-commercial.json');

const allJobs = JSON.parse(fs.readFileSync(allJobsPath, 'utf8'));
let salesJson = [];
try {
  salesJson = JSON.parse(fs.readFileSync(salesJsonPath, 'utf8'));
} catch (e) {}

function sanitizeUrl(url) {
  if (!url) return 'https://co.computrabajo.com/trabajo-en-tolima';
  if (url.includes('jobleads.com')) {
    return 'https://co.computrabajo.com/trabajo-de-ventas-en-tolima';
  }
  if (url.endsWith('/ofertas-de-trabajo/tolima') || url.includes('/ofertas-de-trabajo/tolima')) {
    return 'https://co.computrabajo.com/trabajo-en-tolima';
  }
  if (url.includes('losolivos.co/trabaja-con-nosotros')) {
    return 'https://losolivos.co/contacto/';
  }
  if (url === 'https://co.computrabajo.com/alpina/empleos' || url.includes('alpina/empleos')) {
    return 'https://alpina.com/corporativo/trabaja-con-nosotros';
  }
  return url;
}

const keywords = [
  'ventas', 'comercial', 'tat', 'tienda a tienda', 'punto de venta', 'autoservicio',
  'canal mixto', 'distributivo', 'distribuidor', 'mayorista', 'mercaderista', 'asesor comercial',
  'ejecutivo comercial', 'ejecutivo de cuenta', 'director comercial', 'gerente comercial',
  'jefe de ventas', 'supervisor de ventas', 'coordinador comercial', 'coordinador de ventas',
  'contad', 'costos', 'presupuesto', 'financier', 'auditor', 'proyectos', 'project manager',
  'ibagué', 'ibague', 'tolima', 'cajera', 'administrador de tienda', 'lider de tienda', 'trade marketing',
  'vendedor', 'promotor', 'cajero', 'auxiliar contable', 'facturacion', 'cartera', 'credito y cobranza'
];

const combined = [];
const seenIds = new Set();
const seenKeys = new Set();

// 1. Curated sales offers first
salesJson.forEach(job => {
  job.sourceUrl = sanitizeUrl(job.sourceUrl);
  const key = (job.title + '|' + job.companyName + '|' + (job.locationCity || '')).toLowerCase();
  if (!seenKeys.has(key)) {
    seenKeys.add(key);
    seenIds.add(job.id);
    combined.push(job);
  }
});

// 2. Add matching jobs from the general scraped dataset
allJobs.forEach(job => {
  const text = (
    (job.title || '') + ' ' +
    (job.description || '') + ' ' +
    (job.displayLocation || '') + ' ' +
    (job.locationCity || '') + ' ' +
    (job.category || '')
  ).toLowerCase();

  const isMatch = keywords.some(k => text.includes(k));
  if (isMatch) {
    const key = (job.title + '|' + job.companyName + '|' + (job.locationCity || '')).toLowerCase();
    if (!seenKeys.has(key) && !seenIds.has(job.id)) {
      const sanitized = { ...job };
      sanitized.sourceUrl = sanitizeUrl(sanitized.sourceUrl);

      const locText = ((sanitized.displayLocation || '') + ' ' + (sanitized.locationCity || '') + ' ' + (sanitized.locationDepartment || '')).toLowerCase();
      if (locText.includes('ibag') || locText.includes('tolima')) {
        sanitized.locationFilterKey = 'ibague';
        if (!sanitized.displayLocation.includes('Ibagué') && !sanitized.displayLocation.includes('Tolima')) {
          sanitized.displayLocation = (sanitized.locationCity || 'Ibagué') + ', Tolima';
        }
      } else if (locText.includes('bogot')) {
        sanitized.locationFilterKey = 'bogota';
      } else if (locText.includes('medell')) {
        sanitized.locationFilterKey = 'medellin';
      } else if (locText.includes('cali')) {
        sanitized.locationFilterKey = 'cali';
      } else if (sanitized.isRemote) {
        sanitized.locationFilterKey = 'remoto';
      } else {
        sanitized.locationFilterKey = 'colombia';
      }

      if (!sanitized.requiredSkills || sanitized.requiredSkills.length === 0) {
        if (text.includes('tat')) sanitized.requiredSkills = ['Canal TAT', 'Ventas', 'Consumo Masivo', 'Ruteo'];
        else if (text.includes('contad')) sanitized.requiredSkills = ['Contabilidad', 'Costos', 'NIIF', 'Análisis Financiero'];
        else if (text.includes('punto de venta') || text.includes('tienda')) sanitized.requiredSkills = ['Supervisión de Tienda', 'Inventarios', 'Atención al Cliente'];
        else if (text.includes('proyect')) sanitized.requiredSkills = ['Gerencia de Proyectos', 'Planificación', 'Control Presupuestal'];
        else sanitized.requiredSkills = ['Ventas Consultivas', 'Negociación', 'Gestión Comercial'];
      }

      seenKeys.add(key);
      seenIds.add(sanitized.id);
      combined.push(sanitized);
    }
  }
});

console.log('Successfully compiled sales dataset:', combined.length, 'total offers');
const ibagueOffers = combined.filter(j => j.locationFilterKey === 'ibague' || (j.displayLocation || '').toLowerCase().includes('ibag') || (j.displayLocation || '').toLowerCase().includes('tolima'));
console.log('Tolima/Ibagué offers:', ibagueOffers.length);

fs.writeFileSync(salesJsonPath, JSON.stringify(combined, null, 2), 'utf8');
console.log('Saved to', salesJsonPath);
