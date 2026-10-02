/**
 * Detector de Experiencia Requerida & Clasificaci¾n Granular de Seniority
 *
 * Rangos soportados:
 * 1. 0 a±os (Sin experiencia / Trainee / Practicante / Semillero / ADSO)
 * 2. 6 meses de experiencia (0.5 a±os / 6 meses)
 * 3. 1 a±o de experiencia (12 meses / 1 a±o)
 * 4. 2 a 3 a±os de experiencia (Junior avanzado / Mid inicial)
 * 5. 3 a 4 a±os de experiencia (Mid level)
 * 6. Mßs de 5 a±os de experiencia (Senior / Lead)
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

const ZERO_EXP_EXPLICIT_REGEX = /\b(con\s+o\s+sin\s+experiencia|sin\s+experiencia\s+previa|sin\s+experiencia\s+requerida|sin\s+experiencia\s+laboral|sin\s+experiencia|no\s+requiere\s+experiencia|no\s+se\s+requiere\s+experiencia|no\s+exigimos\s+experiencia|no\s+necesita\s+experiencia|no\s+requerimos\s+experiencia|no\s+pedimos\s+experiencia|experiencia\s+no\s+requerida|experiencia\s+no\s+necesaria|experiencia\s+no\s+indispensable|no\s+tener\s+experiencia|sin\s+experiencia\s+necesaria|no\s+experience\s+required|no\s+experience\s+needed|no\s+prior\s+experience|0\s*a[±n]os?\s*(?:de\s+)?experiencia|0\s*years?\s*(?:of\s+)?experience|0\s*(?:a|-|to)\s*1\s*a[±n]o|0\s*(?:a|-|to)\s*6\s*meses|de\s+0\s+a\s+1\s+a[±n]o|cero\s+experiencia|primer\s+empleo|primer\s+trabajo|primera\s+oportunidad|primer\s+paso\s+laboral|reci[eÚ]n\s+egresad[oa]\s+sin\s+experiencia|reci[eÚ]n\s+graduad[oa]\s+sin\s+experiencia|bachiller\s+sin\s+experiencia|te\s+capacitamos|te\s+formamos|capacitaci[o¾]n\s+paga|semillero\s+de\s+talento|semillero\s+tech)\b/i;

const INTERN_OR_TRAINEE_REGEX = /\b(practicante|aprendiz|aprendiz\s+sena|pasant[iÝ]a|pasante|intern\b|internship|contrato\s+de\s+aprendizaje|semillero|trainee|adso|etapa\s+productiva|early[\s-]*career|primer\s+empleo)\b/i;

const SIX_MONTHS_REGEX = /\b(6\s*meses|seis\s*meses|medio\s*a[±n]o|0\.5\s*a[±n]os?|6\s*months?|six\s*months?)\b/i;

const SENIOR_OR_LEAD_TITLE_REGEX = /\b(senior|sr\.?|lead|principal|staff|architect|arquitecto|director|gerente|manager|head\s+of|vp|jefe\s+de|lider\s+t[eÚ]cnico|tech\s+lead)\b/i;

// Regex para capturar rangos y n·meros de a±os soportando guiones estßndar, en-dash (û), em-dash (ù) y palabras
const EXP_YEARS_PATTERNS = [
  // "Experience: 2û6 Years", "experiencia: 2 a 6 a±os", "2-6 years", "2 û 6 a±os", "2 to 6 years"
  /(?:experience|experiencia)?\s*[:\-\û\ù]?\s*(\d+(?:\.\d+)?)\s*(?:a|-|û|ù|to)\s*(\d+(?:\.\d+)?)\s*(a[±n]os?|years?|meses|months?)/i,
  // "mÝnimo 2 a±os", "al menos 3 a±os", "experiencia mÝnima de 1 a±o", "6 meses"
  /(?:m[iÝ]nimo|al\s+menos|experiencia\s+m[iÝ]nima\s+de|con\s+m[iÝ]nimo|requerid[oa]\s+m[iÝ]nimo|m[iÝ]nimo\s+de|con\s+experiencia\s+de|experiencia\s+de|m[aß]s\s+de|mayor\s+a)\s+(\d+(?:\.\d+)?)\s*(a[±n]os?|meses|years?|months?)/i,
  // "2+ a±os de experiencia", "3+ years", "2+ years of experience"
  /(\d+(?:\.\d+)?)\+\s*(a[±n]os?|years?)\s*(?:de\s+)?(?:experiencia|experience)?/i,
  // "ò Mßs de 3 a±os de experiencia laboral"
  /[ò\*\-]?\s*m[aß]s\s+de\s+(\d+(?:\.\d+)?)\s*(a[±n]os?|years?|meses|months?)/i,
  // "3 a±os de experiencia", "5 years of experience"
  /(\d+(?:\.\d+)?)\s*(a[±n]os?|years?)\s*(?:de\s+)?(?:experiencia|experience)/i,
  // "experiencia de 2 a±os / 6 meses"
  /experiencia\s+(?:laboral\s+|profesional\s+)?(?:m[iÝ]nima\s+)?de\s+(\d+(?:\.\d+)?)\s*(a[±n]os?|meses|years?|months?)/i,
  // "1 a±o de experiencia", "1 year"
  /(\d+(?:\.\d+)?)\s*(a[±n]o|year)\s+(?:de\s+experiencia|experience)/i
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

  // -----------------------------------------------------------------------
  // PASO 1: Extraer cifras numÚricas de experiencia (prioridad mßxima)
  //   Esto evita que heurÝsticas de tÝtulo sobreescriban un "2û6 a±os" real.
  // -----------------------------------------------------------------------
  let minDetectedYears: number | null = null;
  let maxDetectedYears: number | null = null;

  for (const pattern of EXP_YEARS_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      if (match[2] && !isNaN(parseFloat(match[2])) && match[3]) {
        // Rango: "2-6 years", "2 û 6 a±os", "1 a 2 a±os"
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

  // Detecci¾n directa de 6 meses si no se especific¾ numÚricamente
  if (minDetectedYears === null && SIX_MONTHS_REGEX.test(fullText)) {
    minDetectedYears = 0.5;
    maxDetectedYears = 0.5;
  }

  // Comprobar frases explÝcitas de sin experiencia
  const isExplicitZero = ZERO_EXP_EXPLICIT_REGEX.test(fullText);
  const isZeroContext = Boolean(
    options?.isZeroExpSearch ||
    (options?.query && /sin[\s-]*experiencia|primer[\s-]*empleo|aprendiz|practicante|semillero|trainee/i.test(options.query))
  );

  // -----------------------------------------------------------------------
  // PASO 2: Senior / Lead explÝcito por tÝtulo ? siempre 5+ a±os
  //   (incluso si la descripci¾n tiene frases de "sin experiencia")
  // -----------------------------------------------------------------------
  if (SENIOR_OR_LEAD_TITLE_REGEX.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 5.0,
      minYears: 5.0,
      maxYears: 8.0,
      experienceTier: 'more_than_five',
      experienceLabel: '5+ a±os de experiencia (Senior / Lead)',
      seniority: 'senior',
      isEligible: true
    };
  }

  // -----------------------------------------------------------------------
  // PASO 3: Si hay n·mero detectado > 0, ese n·mero manda siempre.
  //   NUNCA marcar como "sin experiencia" si la vacante pide 2+ a±os.
  // -----------------------------------------------------------------------
  if (minDetectedYears !== null && minDetectedYears > 0) {
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
        experienceLabel: '1 a±o de experiencia',
        seniority: 'junior',
        isEligible: true
      };
    }

    if (minDetectedYears <= 3.0) {
      const label = maxDetectedYears && maxDetectedYears > minDetectedYears
        ? `${minDetectedYears} a ${maxDetectedYears} a±os de experiencia`
        : `${minDetectedYears} a 3 a±os de experiencia`;
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
        experienceLabel: '3 a 4 a±os de experiencia',
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
      experienceLabel: '5+ a±os de experiencia (Senior)',
      seniority: 'senior',
      isEligible: true
    };
  }

  // -----------------------------------------------------------------------
  // PASO 4: N·mero = 0 explÝcitamente detectado (ej: "0 a 1 a±o")
  // -----------------------------------------------------------------------
  if (minDetectedYears !== null && minDetectedYears === 0) {
    return {
      isZeroExperience: true,
      maxYearsExperience: 0.0,
      minYears: 0,
      maxYears: maxDetectedYears || 0,
      experienceTier: 'zero_exp',
      experienceLabel: 'Sin experiencia previa',
      seniority: 'trainee',
      isEligible: true
    };
  }

  // -----------------------------------------------------------------------
  // PASO 5: Intern / Trainee / Practicante en el T═TULO (sin n·mero)
  // -----------------------------------------------------------------------
  if (INTERN_OR_TRAINEE_REGEX.test(cleanTitle)) {
    const seniority = (
      cleanTitle.includes('aprendiz') ||
      cleanTitle.includes('practicante') ||
      cleanTitle.includes('pasant') ||
      cleanTitle.includes('intern')
    ) ? 'intern' : 'trainee';

    return {
      isZeroExperience: true,
      maxYearsExperience: 0.0,
      minYears: 0.0,
      maxYears: 0.5,
      experienceTier: 'zero_exp',
      experienceLabel: 'Sin experiencia previa',
      seniority,
      isEligible: true
    };
  }

  // -----------------------------------------------------------------------
  // PASO 6: Frases explÝcitas de "sin experiencia" en el texto
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // PASO 7: HeurÝsticas por tÝtulo (sin datos de experiencia en el texto)
  //   Marcadas como "(estimado)" ù NUNCA activan isZeroExperience.
  // -----------------------------------------------------------------------
  if (/\b(semi[\s-]*senior|ssr|mid[\s-]*level|intermedio|especialista)\b/i.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 3.5,
      experienceTier: 'three_to_four',
      experienceLabel: '3 a 4 a±os de experiencia (estimado)',
      seniority: 'early_mid',
      isEligible: true
    };
  }

  if (/\b(junior|jr|auxiliar|asistente|tecn[o¾]logo|t[eÚ]cnico|soporte|entry)\b/i.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 1.0,
      experienceTier: 'one_year',
      experienceLabel: '1 a±o de experiencia (estimado)',
      seniority: 'junior',
      isEligible: true
    };
  }

  if (/\b(ingeniero|developer|desarrollador|programador|analista|consultor|asesor|ejecutivo|contador|coordinador|qa|tester|data)\b/i.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 2.0,
      experienceTier: 'two_to_three',
      experienceLabel: '2 a 3 a±os de experiencia (estimado)',
      seniority: 'junior',
      isEligible: true
    };
  }

  // Default: experiencia no especificada en la vacante
  return {
    isZeroExperience: false,
    maxYearsExperience: 1.0,
    experienceTier: 'one_year',
    experienceLabel: 'Experiencia no especificada',
    seniority: 'junior',
    isEligible: true
  };
}
