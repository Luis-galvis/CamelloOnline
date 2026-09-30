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

const ZERO_EXP_EXPLICIT_REGEX = /\b(con\s+o\s+sin\s+experiencia|sin\s+experiencia\s+previa|sin\s+experiencia\s+requerida|sin\s+experiencia\s+laboral|sin\s+experiencia|no\s+requiere\s+experiencia|no\s+se\s+requiere\s+experiencia|no\s+exigimos\s+experiencia|no\s+necesita\s+experiencia|no\s+requerimos\s+experiencia|no\s+pedimos\s+experiencia|experiencia\s+no\s+requerida|experiencia\s+no\s+necesaria|experiencia\s+no\s+indispensable|no\s+tener\s+experiencia|sin\s+experiencia\s+necesaria|no\s+experience\s+required|no\s+experience\s+needed|no\s+prior\s+experience|0\s*a[ñn]os?\s*(?:de\s+)?experiencia|0\s*years?\s*(?:of\s+)?experience|0\s*(?:a|-|to)\s*1\s*a[ñn]o|0\s*(?:a|-|to)\s*6\s*meses|de\s+0\s+a\s+1\s+a[ñn]o|cero\s+experiencia|primer\s+empleo|primer\s+trabajo|primera\s+oportunidad|primer\s+paso\s+laboral|reci[eé]n\s+egresad[oa]\s+sin\s+experiencia|reci[eé]n\s+graduad[oa]\s+sin\s+experiencia|bachiller\s+sin\s+experiencia|te\s+capacitamos|te\s+formamos|capacitaci[oó]n\s+paga|semillero\s+de\s+talento|semillero\s+tech)\b/i;

const INTERN_OR_TRAINEE_REGEX = /\b(practicante|aprendiz|aprendiz\s+sena|pasant[ií]a|pasante|intern\b|internship|contrato\s+de\s+aprendizaje|semillero|trainee|adso|etapa\s+productiva|early[\s-]*career|primer\s+empleo)\b/i;

const SIX_MONTHS_REGEX = /\b(6\s*meses|seis\s*meses|medio\s*a[ñn]o|0\.5\s*a[ñn]os?|6\s*months?|six\s*months?)\b/i;

const SENIOR_OR_LEAD_TITLE_REGEX = /\b(senior|sr\.?|lead|principal|staff|architect|arquitecto|director|gerente|manager|head\s+of|vp|jefe\s+de|lider\s+t[eé]cnico|tech\s+lead)\b/i;

// Regex para capturar rangos y números de años soportando guiones estándar, en-dash (–), em-dash (—) y palabras
const EXP_YEARS_PATTERNS = [
  // "Experience: 2–6 Years", "experiencia: 2 a 6 años", "2-6 years", "2 – 6 años", "2 to 6 years"
  /(?:experience|experiencia)?\s*[:\-\–\—]?\s*(\d+(?:\.\d+)?)\s*(?:a|-|–|—|to)\s*(\d+(?:\.\d+)?)\s*(a[ñn]os?|years?|meses|months?)/i,
  // "mínimo 2 años", "al menos 3 años", "experiencia mínima de 1 año", "6 meses"
  /(?:m[ií]nimo|al\s+menos|experiencia\s+m[ií]nima\s+de|con\s+m[ií]nimo|requerid[oa]\s+m[ií]nimo|m[ií]nimo\s+de|con\s+experiencia\s+de|experiencia\s+de|m[aá]s\s+de|mayor\s+a)\s+(\d+(?:\.\d+)?)\s*(a[ñn]os?|meses|years?|months?)/i,
  // "2+ años de experiencia", "3+ years", "2+ years of experience"
  /(\d+(?:\.\d+)?)\+\s*(a[ñn]os?|years?)\s*(?:de\s+)?(?:experiencia|experience)?/i,
  // "• Más de 3 años de experiencia laboral", "• Más de 2 años de experiencia laboral en JavaScript"
  /[•\*\-]?\s*m[aá]s\s+de\s+(\d+(?:\.\d+)?)\s*(a[ñn]os?|years?|meses|months?)/i,
  // "3 años de experiencia", "5 years of experience"
  /(\d+(?:\.\d+)?)\s*(a[ñn]os?|years?)\s*(?:de\s+)?(?:experiencia|experience)/i,
  // "experiencia de 2 años / 6 meses"
  /experiencia\s+(?:laboral\s+|profesional\s+)?(?:m[ií]nima\s+)?de\s+(\d+(?:\.\d+)?)\s*(a[ñn]os?|meses|years?|months?)/i,
  // "1 año de experiencia", "1 year"
  /(\d+(?:\.\d+)?)\s*(a[ñn]o|year)\s+(?:de\s+experiencia|experience)/i
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

  // 1. Roles Senior / Lead explícitos por título -> 5+ años
  if (SENIOR_OR_LEAD_TITLE_REGEX.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 5.0,
      minYears: 5.0,
      maxYears: 8.0,
      experienceTier: 'more_than_five',
      experienceLabel: '5+ años de experiencia (Senior / Lead)',
      seniority: 'senior',
      isEligible: true
    };
  }

  // 2. Roles Practicante / Aprendiz / Pasantía / Intern / Trainee en el título -> 0 experiencia
  if (INTERN_OR_TRAINEE_REGEX.test(cleanTitle)) {
    const seniority = cleanTitle.includes('aprendiz') || cleanTitle.includes('practicante') || cleanTitle.includes('pasant') || cleanTitle.includes('intern')
      ? 'intern'
      : 'trainee';

    return {
      isZeroExperience: true,
      maxYearsExperience: 0.0,
      minYears: 0.0,
      maxYears: 0.5,
      experienceTier: 'zero_exp',
      experienceLabel: 'Sin experiencia previa',
      seniority: seniority,
      isEligible: true
    };
  }

  // 3. Extraer explícitamente los años de experiencia solicitados numéricamente
  let minDetectedYears: number | null = null;
  let maxDetectedYears: number | null = null;

  for (const pattern of EXP_YEARS_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      if (match[2] && !isNaN(parseFloat(match[2])) && match[3]) {
        // Range like "2-6 years", "1 a 2 años"
        let minVal = parseFloat(match[1]);
        let maxVal = parseFloat(match[2]);
        const unit = (match[3] || '').toLowerCase();
        if (unit.includes('mes') || unit.includes('month')) {
          minVal = minVal / 12;
          maxVal = maxVal / 12;
        }
        minDetectedYears = minVal;
        maxDetectedYears = maxVal;
        break;
      } else if (match[1]) {
        let val = parseFloat(match[1]);
        const unit = (match[2] || match[0]).toLowerCase();
        if (unit.includes('mes') || unit.includes('month')) {
          val = val / 12;
        }
        if (!isNaN(val)) {
          minDetectedYears = val;
          maxDetectedYears = val;
          break;
        }
      }
    }
  }

  // Detección directa de 6 meses si no se especificó numéricamente
  if (minDetectedYears === null && SIX_MONTHS_REGEX.test(fullText)) {
    minDetectedYears = 0.5;
    maxDetectedYears = 0.5;
  }

  // Comprobar frases explícitas de sin experiencia
  const isExplicitZero = ZERO_EXP_EXPLICIT_REGEX.test(fullText);
  const isZeroContext = Boolean(
    options?.isZeroExpSearch || 
    (options?.query && /sin[\s-]*experiencia|primer[\s-]*empleo|aprendiz|practicante|semillero|trainee/i.test(options.query))
  );

  // 4. Si se detectó un valor numérico específico de experiencia
  if (minDetectedYears !== null) {
    // If explicitly min is 0 and max is <= 1, it's entry-level / zero exp
    if (minDetectedYears === 0 && (maxDetectedYears || 0) <= 0.5) {
      return {
        isZeroExperience: true,
        maxYearsExperience: 0.0,
        minYears: 0,
        maxYears: 0,
        experienceTier: 'zero_exp',
        experienceLabel: 'Sin experiencia previa',
        seniority: 'trainee',
        isEligible: true
      };
    }
    
    if (minDetectedYears <= 0.5 && (maxDetectedYears || 0) <= 0.7) {
      return {
        isZeroExperience: false,
        maxYearsExperience: 0.5,
        minYears: minDetectedYears,
        maxYears: maxDetectedYears || 0.5,
        experienceTier: 'six_months',
        experienceLabel: '6 meses de experiencia',
        seniority: 'trainee',
        isEligible: true
      };
    }

    if (minDetectedYears <= 1.2 && (maxDetectedYears || 0) <= 1.5) {
      return {
        isZeroExperience: false,
        maxYearsExperience: 1.0,
        minYears: minDetectedYears,
        maxYears: maxDetectedYears || 1.0,
        experienceTier: 'one_year',
        experienceLabel: '1 año de experiencia',
        seniority: 'junior',
        isEligible: true
      };
    }

    if (minDetectedYears <= 3.0) {
      const label = maxDetectedYears && maxDetectedYears > minDetectedYears 
        ? `${minDetectedYears} a ${maxDetectedYears} años de experiencia`
        : `${minDetectedYears} a 3 años de experiencia`;
      return {
        isZeroExperience: false,
        maxYearsExperience: maxDetectedYears || minDetectedYears,
        minYears: minDetectedYears,
        maxYears: maxDetectedYears || minDetectedYears,
        experienceTier: 'two_to_three',
        experienceLabel: label,
        seniority: 'junior',
        isEligible: true
      };
    }

    if (minDetectedYears <= 4.5) {
      return {
        isZeroExperience: false,
        maxYearsExperience: maxDetectedYears || minDetectedYears,
        minYears: minDetectedYears,
        maxYears: maxDetectedYears || minDetectedYears,
        experienceTier: 'three_to_four',
        experienceLabel: '3 a 4 años de experiencia',
        seniority: 'early_mid',
        isEligible: true
      };
    }

    return {
      isZeroExperience: false,
      maxYearsExperience: maxDetectedYears || minDetectedYears,
      minYears: minDetectedYears,
      maxYears: maxDetectedYears || minDetectedYears,
      experienceTier: 'more_than_five',
      experienceLabel: '5+ años de experiencia (Senior)',
      seniority: 'senior',
      isEligible: true
    };
  }

  // 5. Casos de 0 experiencia explícita por frase
  if (isExplicitZero || isZeroContext) {
    return {
      isZeroExperience: true,
      maxYearsExperience: 0.0,
      experienceTier: 'zero_exp',
      experienceLabel: 'Sin experiencia previa',
      seniority: 'trainee',
      isEligible: true
    };
  }

  // 6. Heurísticas inteligentes según cargo si la descripción no especifica número
  if (/\b(semi[\s-]*senior|ssr|mid[\s-]*level|intermedio|especialista)\b/i.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 3.5,
      experienceTier: 'three_to_four',
      experienceLabel: '3 a 4 años de experiencia',
      seniority: 'early_mid',
      isEligible: true
    };
  }

  if (/\b(junior|jr|auxiliar|asistente|tecn[oó]logo|t[eé]cnico|soporte|entry)\b/i.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 1.0,
      experienceTier: 'one_year',
      experienceLabel: '1 año de experiencia',
      seniority: 'junior',
      isEligible: true
    };
  }

  if (/\b(ingeniero|developer|desarrollador|programador|analista|consultor|asesor|ejecutivo|contador|coordinador|qa|tester|data)\b/i.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 2.0,
      experienceTier: 'two_to_three',
      experienceLabel: '2 a 3 años de experiencia',
      seniority: 'junior',
      isEligible: true
    };
  }

  // Default para vacantes estándar
  return {
    isZeroExperience: false,
    maxYearsExperience: 1.0,
    experienceTier: 'one_year',
    experienceLabel: '1 año de experiencia',
    seniority: 'junior',
    isEligible: true
  };
}
