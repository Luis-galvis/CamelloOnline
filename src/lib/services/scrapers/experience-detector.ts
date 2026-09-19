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

const ZERO_EXP_EXPLICIT_REGEX = /\b(sin\s+experiencia\s+previa|sin\s+experiencia\s+requerida|sin\s+experiencia|no\s+experience\s+required|no\s+experience\s+needed|no\s+prior\s+experience|no\s+requiere\s+experiencia|0\s*a[ñn]os?\s*(?:de\s+)?experiencia|0\s*years?\s*(?:of\s+)?experience|primer\s+empleo|primer\s+trabajo|autodidacta|abierto\s+a\s+bootcamp)\b/i;

const INTERN_TITLE_REGEX = /\b(practicante|aprendiz|pasant[ií]a|intern|internship|contrato\s+de\s+aprendizaje|semillero|trainee|adso)\b/i;

const SIX_MONTHS_REGEX = /\b(6\s*meses|seis\s*meses|medio\s*a[ñn]o|0\.5\s*a[ñn]os?|6\s*months?|six\s*months?)\b/i;

const ONE_YEAR_REGEX = /\b(1\s*a[ñn]o|un\s*a[ñn]o|12\s*meses|doce\s*meses|1\s*year|one\s*year|1\s*yr)\b/i;

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

export function detectExperience(title: string = '', description: string = ''): ExperienceResult {
  const cleanTitle = (title || '').trim().toLowerCase();
  const cleanDesc = (description || '').trim().toLowerCase();
  const fullText = `${cleanTitle} ${cleanDesc}`;

  // 1. Verificar si es explícitamente 0 experiencia / prácticas / semilleros
  const isExplicitZero = ZERO_EXP_EXPLICIT_REGEX.test(fullText);
  const isInternTitle = INTERN_TITLE_REGEX.test(cleanTitle);

  // 2. Extraer explícitamente los años de experiencia solicitados
  let detectedYears: number | null = null;

  // Detección directa de 6 meses
  if (SIX_MONTHS_REGEX.test(fullText) && !cleanDesc.includes('1 año') && !cleanDesc.includes('2 años')) {
    detectedYears = 0.5;
  }

  for (const pattern of EXP_YEARS_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      if (match[2] && !isNaN(parseFloat(match[2])) && match[3]) {
        // Rango "1 a 2 años" -> tomar el límite inferior o promedio realista
        const minVal = parseFloat(match[1]);
        const maxVal = parseFloat(match[2]);
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

  // 3. Casos de 0 experiencia
  if ((isInternTitle || isExplicitZero || detectedYears === 0) && (detectedYears === null || detectedYears < 0.5)) {
    const seniority = cleanTitle.includes('aprendiz') || cleanTitle.includes('practicante') || cleanTitle.includes('pasant') || cleanTitle.includes('intern')
      ? 'intern'
      : 'trainee';

    return {
      isZeroExperience: true,
      maxYearsExperience: 0,
      experienceTier: 'zero_exp',
      experienceLabel: 'Sin experiencia previa',
      seniority: seniority,
      isEligible: true
    };
  }

  // 4. Casos de 6 meses (0.1 a 0.7 años)
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

  // 5. Casos de 1 año (0.8 a 1.5 años)
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

  // 6. Casos de 2 a 3 años (1.6 a 3.0 años)
  if (detectedYears !== null && detectedYears > 1.5 && detectedYears <= 3.0) {
    return {
      isZeroExperience: false,
      maxYearsExperience: Number(detectedYears.toFixed(1)),
      experienceTier: 'two_to_three',
      experienceLabel: '2 a 3 años de exp',
      seniority: 'junior',
      isEligible: true
    };
  }

  // 7. Casos de 3 a 4 años (3.1 a 4.5 años)
  if (detectedYears !== null && detectedYears > 3.0 && detectedYears <= 4.5) {
    return {
      isZeroExperience: false,
      maxYearsExperience: Number(detectedYears.toFixed(1)),
      experienceTier: 'three_to_four',
      experienceLabel: '3 a 4 años de exp',
      seniority: 'early_mid',
      isEligible: true
    };
  }

  // 8. Casos de más de 5 años (> 4.5 años o título senior/lead)
  if ((detectedYears !== null && detectedYears > 4.5) || cleanTitle.includes('senior') || cleanTitle.includes('lead') || cleanTitle.includes('architect')) {
    return {
      isZeroExperience: false,
      maxYearsExperience: detectedYears ? Number(detectedYears.toFixed(1)) : 5.0,
      experienceTier: 'more_than_five',
      experienceLabel: '5+ años de experiencia',
      seniority: 'senior',
      isEligible: true
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
      maxYearsExperience: 2.5,
      experienceTier: 'two_to_three',
      experienceLabel: '2 a 3 años de exp',
      seniority: 'junior',
      isEligible: true
    };
  }

  // Default
  return {
    isZeroExperience: false,
    maxYearsExperience: 1.0,
    experienceTier: 'one_year',
    experienceLabel: '1 año de experiencia',
    seniority: 'junior',
    isEligible: true
  };
}
