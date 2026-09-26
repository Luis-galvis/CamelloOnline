/**
 * Detector de Experiencia Requerida & Clasificación Granular de Seniority
 * 
 * Rangos soportados:
 * 1. 0 años (Sin experiencia / Trainee / Practicante / Semillero / ADSO)
 * 2. 6 meses de experiencia (0.5 años / 6 meses)
 * 3. 1 año de experiencia (12 meses / 1 año)
 * 4. 2 a 3 años de experiencia (Junior avanzado / Mid inicial)
 * 5. 3 a 4 años de experiencia (Mid level)
 * 6. Más de 5 años de experiencia (Senior / Lead)
 */

export type ExperienceTier = 
  | 'zero_exp'
  | 'six_months'
  | 'one_year'
  | 'two_to_three'
  | 'three_to_four'
  | 'more_than_five';

export interface ExperienceResult {
  isZeroExperience: boolean;
  maxYearsExperience: number;
  maxYears?: number;
  minYears?: number;
  experienceTier: ExperienceTier;
  experienceLabel: string;
  seniority: 'trainee' | 'intern' | 'junior' | 'early_mid' | 'senior';
  isEligible: boolean;
}

const ZERO_EXP_EXPLICIT_REGEX = /\b(con\s+o\s+sin\s+experiencia|sin\s+experiencia\s+previa|sin\s+experiencia\s+requerida|sin\s+experiencia\s+laboral|sin\s+experiencia|no\s+requiere\s+experiencia|no\s+se\s+requiere\s+experiencia|no\s+exigimos\s+experiencia|no\s+necesita\s+experiencia|no\s+requerimos\s+experiencia|no\s+pedimos\s+experiencia|experiencia\s+no\s+requerida|experiencia\s+no\s+necesaria|experiencia\s+no\s+indispensable|no\s+tener\s+experiencia|sin\s+experiencia\s+necesaria|no\s+experience\s+required|no\s+experience\s+needed|no\s+prior\s+experience|entry[\s-]*level|0\s*a[ñn]os?\s*(?:de\s+)?experiencia|0\s*years?\s*(?:of\s+)?experience|0\s*(?:a|-|to)\s*1\s*a[ñn]o|0\s*(?:a|-|to)\s*6\s*meses|de\s+0\s+a\s+1\s+a[ñn]o|cero\s+experiencia|primer\s+empleo|primer\s+trabajo|primera\s+oportunidad|primer\s+paso\s+laboral|reci[eé]n\s+egresad[oa]|reci[eé]n\s+graduad[oa]|bachiller\s+sin\s+experiencia|estudiante|autodidacta|abierto\s+a\s+bootcamp|bootcamp\s+grad|te\s+capacitamos|te\s+formamos|capacitaci[oó]n\s+paga|semillero\s+de\s+talento|semillero\s+tech|semillero|asistente\s+virtual|data\s+entry|digitador)\b/i;

const INTERN_OR_TRAINEE_REGEX = /\b(practicante|aprendiz|aprendiz\s+sena|pasant[ií]a|pasante|intern\b|internship|contrato\s+de\s+aprendizaje|semillero|trainee|adso|etapa\s+productiva|early[\s-]*career|entry[\s-]*level|primer\s+empleo)\b/i;

const SIX_MONTHS_REGEX = /\b(6\s*meses|seis\s*meses|medio\s*a[ñn]o|0\.5\s*a[ñn]os?|6\s*months?|six\s*months?)\b/i;

const ONE_YEAR_REGEX = /\b(1\s*a[ñn]o|un\s*a[ñn]o|12\s*meses|doce\s*meses|1\s*year|one\s*year|1\s*yr)\b/i;

const SENIOR_OR_LEAD_TITLE_REGEX = /\b(senior|sr\.?|lead|principal|staff|architect|director|gerente|manager|head\s+of|vp)\b/i;

// Regex para capturar rangos y números de años
const EXP_YEARS_PATTERNS = [
  // "mínimo 2 años", "al menos 3 años", "mínima de 1 año", "6 meses"
  /(?:m[ií]nimo|al\s+menos|experiencia\s+m[ií]nima\s+de|con\s+m[ií]nimo|requerid[oa]\s+m[ií]nimo)\s+(\d+(?:\.\d+)?)\s*(a[ñn]os?|meses|years?|months?)/i,
  // "2+ años de experiencia", "3 años de experiencia"
  /(\d+(?:\.\d+)?)\+?\s*(a[ñn]os?|years?)\s*(?:de\s+)?(?:experiencia|experience)/i,
  // "1 a 2 años de experiencia", "2 - 3 años"
  /(\d+(?:\.\d+)?)\s*(?:a|-|to)\s*(\d+(?:\.\d+)?)\s*(a[ñn]os?|years?)\s*(?:de\s+)?(?:experiencia|experience)?/i,
  // "experiencia de 2 años / 6 meses"
  /experiencia\s+(?:m[ií]nima\s+)?de\s+(\d+(?:\.\d+)?)\s*(a[ñn]os?|meses|years?|months?)/i
];

export interface DetectExperienceOptions {
  isZeroExpSearch?: boolean;
  query?: string;
}

export function detectExperience(
  title: string = '', 
  description: string = '', 
  options?: DetectExperienceOptions
): ExperienceResult {
  const cleanTitle = (title || '').trim().toLowerCase();
  const cleanDesc = (description || '').trim().toLowerCase();
  const fullText = `${cleanTitle} ${cleanDesc}`;

  // 1. RECHAZO SENIOR / LEAD: En RealJobs (plataforma Junior 0-2 años), los roles senior NO son elegibles
  if (SENIOR_OR_LEAD_TITLE_REGEX.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 2.0,
      experienceTier: 'more_than_five',
      experienceLabel: '5+ años de experiencia (Senior)',
      seniority: 'senior',
      isEligible: false // DESCARTADA: No pertenece a plataforma Junior
    };
  }

  // 2. Verificar si es explícitamente 0 experiencia / prácticas / semilleros / entry-level
  const isExplicitZero = ZERO_EXP_EXPLICIT_REGEX.test(fullText);
  const isInternTitle = INTERN_OR_TRAINEE_REGEX.test(cleanTitle);
  const isZeroContext = Boolean(
    options?.isZeroExpSearch || 
    (options?.query && /sin[\s-]*experiencia|primer[\s-]*empleo|aprendiz|practicante|semillero|trainee/i.test(options.query))
  );

  // 3. Extraer explícitamente los años de experiencia solicitados
  let detectedYears: number | null = null;

  // Si dice explícitamente "0 a 1 año" o "con o sin experiencia" o viene de búsqueda sin experiencia
  if (
    fullText.includes('con o sin experiencia') ||
    fullText.includes('sin experiencia') ||
    fullText.includes('no requiere experiencia') ||
    fullText.includes('0 a 1 año') ||
    fullText.includes('0 a 6 meses') ||
    fullText.includes('0-1 año') ||
    isInternTitle ||
    (isZeroContext && !cleanTitle.includes('semi') && !cleanTitle.includes('ssr'))
  ) {
    detectedYears = 0;
  } else {
    // Detección directa de 6 meses si no habla de años mayores
    if (SIX_MONTHS_REGEX.test(fullText) && !cleanDesc.includes('1 año') && !cleanDesc.includes('2 años') && !cleanDesc.includes('3 años')) {
      detectedYears = 0.5;
    }

    for (const pattern of EXP_YEARS_PATTERNS) {
      const match = fullText.match(pattern);
      if (match) {
        if (match[2] && !isNaN(parseFloat(match[2])) && match[3]) {
          const minVal = parseFloat(match[1]);
          const maxVal = parseFloat(match[2]);
          // Si el rango empieza en 0 (ej. 0 a 1 año), es de entrada / 0 años
          if (minVal === 0) {
            detectedYears = 0;
            break;
          }
          const val = (minVal + maxVal) / 2;
          if (!isNaN(val) && (detectedYears === null || val > detectedYears)) {
            detectedYears = val;
          }
        } else if (match[1]) {
          let val = parseFloat(match[1]);
          const unit = (match[2] || match[0]).toLowerCase();
          if (unit.includes('mes') || unit.includes('month')) {
            val = val / 12;
          }
          if (!isNaN(val) && (detectedYears === null || val > detectedYears)) {
            detectedYears = val;
          }
        }
      }
    }
  }

  // 4. Casos de 0 experiencia / Prácticas / Trainees / Semilleros / Entry-Level
  if (isInternTitle || isExplicitZero || detectedYears === 0 || isZeroContext) {
    const seniority = cleanTitle.includes('aprendiz') || cleanTitle.includes('practicante') || cleanTitle.includes('pasant') || cleanTitle.includes('intern')
      ? 'intern'
      : 'trainee';

    return {
      isZeroExperience: true,
      maxYearsExperience: 0.0,
      experienceTier: 'zero_exp',
      experienceLabel: 'Sin experiencia previa',
      seniority: seniority,
      isEligible: true
    };
  }

  // 5. Casos de 6 meses (0.1 a 0.7 años)
  if (detectedYears !== null && detectedYears > 0 && detectedYears <= 0.7) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 0.5,
      experienceTier: 'six_months',
      experienceLabel: '6 meses de experiencia',
      seniority: 'trainee',
      isEligible: true
    };
  }

  // 6. Casos de 1 año (0.8 a 1.5 años)
  if (detectedYears !== null && detectedYears > 0.7 && detectedYears <= 1.5) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 1.0,
      experienceTier: 'one_year',
      experienceLabel: '1 año de experiencia',
      seniority: 'junior',
      isEligible: true
    };
  }

  // 7. Casos de 2 años (1.6 a 2.0 años)
  if (detectedYears !== null && detectedYears > 1.5 && detectedYears <= 2.0) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 2.0,
      experienceTier: 'two_to_three',
      experienceLabel: 'Hasta 2 años de exp',
      seniority: 'junior',
      isEligible: true
    };
  }

  // 8. Descartar roles que requieran más de 2 años de experiencia (Violan restricción Junior 0-2 YoE)
  if (detectedYears !== null && detectedYears > 2.0) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 2.0,
      experienceTier: 'two_to_three',
      experienceLabel: `${Math.round(detectedYears)} años de experiencia`,
      seniority: 'early_mid',
      isEligible: false // DESCARTADA: Supera el umbral estricto de 2 años para Junior
    };
  }

  // 9. Heurística por título si no hubo match numérico
  if (cleanTitle.includes('junior') || cleanTitle.includes('jr') || cleanTitle.includes('entry') || cleanTitle.includes('asistente') || cleanTitle.includes('auxiliar')) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 1.0,
      experienceTier: 'one_year',
      experienceLabel: '1 año de experiencia',
      seniority: 'junior',
      isEligible: true
    };
  }

  if (cleanTitle.includes('semi') || cleanTitle.includes('ssr') || cleanTitle.includes('analista') || cleanTitle.includes('developer')) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 2.0, // ESTRICTO: Máximo 2.0 años para respetar check constraint
      experienceTier: 'two_to_three',
      experienceLabel: 'Hasta 2 años de exp',
      seniority: 'junior',
      isEligible: true
    };
  }

  // Default para cargos junior de entrada
  return {
    isZeroExperience: false,
    maxYearsExperience: 1.0,
    experienceTier: 'one_year',
    experienceLabel: '1 año de experiencia',
    seniority: 'junior',
    isEligible: true
  };
}
