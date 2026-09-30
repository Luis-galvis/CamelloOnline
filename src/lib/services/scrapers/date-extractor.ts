/**
 * Extractor y Formateador de Fecha de Publicación
 * Garantiza que ofertas de más de 21 días (3 semanas) se calculen con precisión
 * para que el filtro las descarte automáticamente.
 */

export interface DateExtractionResult {
  postedDateText: string;
  postedDate: Date;
  ageDays: number;
}

export function extractPostedDate(cardHtml: string = '', fullText: string = ''): DateExtractionResult {
  const combined = `${cardHtml} ${fullText}`;

  // 1. Extraer datetime="..." si existe en etiquetas <time>
  const timeAttrMatch = combined.match(/<time[^>]*datetime="([^"]+)"/i);
  const datetimeAttr = timeAttrMatch && timeAttrMatch[1] && timeAttrMatch[1].match(/^\d{4}-\d{2}-\d{2}/) 
    ? timeAttrMatch[1] 
    : null;

  // 2. Extraer texto explícito de tiempo (ej. "hace 3 días", "hace 2 horas", "hace 1 semana", "hace 2 meses", "hace 1 año")
  const textMatch = combined.match(/\b(hace\s+\d+\s+(?:d[ií]as?|horas?|semanas?|minutos?|meses?|a[ñn]os?)|hace\s+un\s+d[ií]a|hace\s+una\s+hora|hace\s+una\s+semana|hace\s+un\s+mes|hace\s+un\s+a[ñn]o|hace\s+pocos?\s+(?:d[ií]as?|minutos?|horas?)|hoy|ayer|\d+\s+(?:days?|hours?|weeks?|months?|minutes?|years?)\s+ago|just\s+now)\b/i) ||
                    combined.match(/<time[^>]*>([\s\S]*?)<\/time>/i);

  let rawText = textMatch ? (textMatch[1] || textMatch[0]).replace(/<[^>]*>/g, '').trim() : '';

  let postedDate = new Date();

  if (rawText) {
    const pNorm = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const numMatch = pNorm.match(/\d+/);
    const n = numMatch ? parseInt(numMatch[0], 10) : 1;

    if (pNorm.includes('hora') || pNorm.includes('hour')) {
      postedDate = new Date(Date.now() - n * 3600 * 1000);
      rawText = n === 1 ? 'Hace 1 hora' : `Hace ${n} horas`;
    } else if (pNorm.includes('dia') || pNorm.includes('day')) {
      postedDate = new Date(Date.now() - n * 24 * 3600 * 1000);
      rawText = n === 1 ? 'Hace 1 día' : `Hace ${n} días`;
    } else if (pNorm.includes('semana') || pNorm.includes('week')) {
      postedDate = new Date(Date.now() - n * 7 * 24 * 3600 * 1000);
      rawText = n === 1 ? 'Hace 1 semana' : `Hace ${n} semanas`;
    } else if (pNorm.includes('mes') || pNorm.includes('month')) {
      postedDate = new Date(Date.now() - n * 30 * 24 * 3600 * 1000);
      rawText = n === 1 ? 'Hace 1 mes' : `Hace ${n} meses`;
    } else if (pNorm.includes('ano') || pNorm.includes('year')) {
      postedDate = new Date(Date.now() - n * 365 * 24 * 3600 * 1000);
      rawText = n === 1 ? 'Hace 1 año' : `Hace ${n} años`;
    } else if (pNorm.includes('minut') || pNorm.includes('min')) {
      postedDate = new Date(Date.now() - n * 60 * 1000);
      rawText = `Hace ${n} min`;
    } else if (pNorm.includes('hoy') || pNorm.includes('today') || pNorm.includes('just now')) {
      postedDate = new Date(Date.now() - 2 * 3600 * 1000);
      rawText = 'Hoy';
    } else if (pNorm.includes('ayer') || pNorm.includes('yesterday')) {
      postedDate = new Date(Date.now() - 24 * 3600 * 1000);
      rawText = 'Ayer';
    }
  } else if (datetimeAttr) {
    postedDate = new Date(datetimeAttr);
    const diffMs = Date.now() - postedDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));

    if (hours < 24) {
      rawText = hours <= 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;
    } else if (days <= 1) {
      rawText = 'Ayer';
    } else if (days < 7) {
      rawText = `Hace ${days} días`;
    } else if (days < 14) {
      rawText = 'Hace 1 semana';
    } else if (days < 21) {
      rawText = 'Hace 2 semanas';
    } else if (days < 60) {
      rawText = 'Hace 1 mes';
    } else {
      rawText = `Hace ${Math.floor(days / 30)} meses`;
    }
  } else {
    rawText = 'Reciente';
  }

  const ageDays = (Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24);

  return {
    postedDateText: rawText,
    postedDate: postedDate,
    ageDays: ageDays
  };
}

/**
 * Calcula con precisión matemática las horas de antigüedad de una vacante
 * para garantizar un ordenamiento estricto de más reciente a más antigua.
 */
export function calculateJobAgeHours(postedDateText?: string, createdAt?: string | Date): number {
  const pNorm = (postedDateText || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const numMatch = pNorm.match(/\d+/);
  const n = numMatch ? parseInt(numMatch[0], 10) : 1;

  if (pNorm.includes('min')) return n / 60;
  if (pNorm.includes('hora') || pNorm.includes('hour')) return n;
  if (pNorm.includes('hoy') || pNorm.includes('today') || pNorm.includes('just now')) return 2;
  if (pNorm.includes('ayer') || pNorm.includes('yesterday')) return 24;
  if (pNorm.includes('dia') || pNorm.includes('day')) return n * 24;
  if (pNorm.includes('semana') || pNorm.includes('week')) return n * 7 * 24;
  if (pNorm.includes('mes') || pNorm.includes('month')) return n * 30 * 24;
  if (pNorm.includes('ano') || pNorm.includes('year')) return n * 365 * 24;

  if (createdAt) {
    const dt = new Date(createdAt).getTime();
    if (!isNaN(dt) && dt > 0) {
      const diff = (Date.now() - dt) / 3600000;
      return diff >= 0 ? diff : 24;
    }
  }
  return 48;
}
