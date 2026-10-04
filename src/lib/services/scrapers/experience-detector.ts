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
 *
 * IMPORTANTE: todo el texto se normaliza (minúsculas, sin tildes, "ñ" -> "n")
 * antes de aplicar las expresiones regulares, por eso los patrones usan "anos".
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
  /** true si los años salieron de una cifra real escrita en la vacante */
  hasExplicitYears?: boolean;
}

/** Minúsculas, sin tildes, espacios colapsados y typos comunes ("e ntre") corregidos. */
export function normalizeForMatch(text: string = ''): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\be\s+ntre\b/g, 'entre')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

const UNIT = '(anos?|years?|yrs?|meses|months?)';
const NUM = '(\\d+(?:[.,]\\d+)?)';

const ZERO_EXP_EXPLICIT_REGEX = /\b(con o sin experiencia|sin experiencia previa|sin experiencia requerida|sin experiencia laboral|sin experiencia|no requiere experiencia|no se requiere experiencia|no exigimos experiencia|no necesita experiencia|no requerimos experiencia|no pedimos experiencia|experiencia no requerida|experiencia no necesaria|experiencia no indispensable|no tener experiencia|sin experiencia necesaria|no experience required|no experience needed|no prior experience|0 anos? (?:de )?experiencia|0 years? (?:of )?experience|0 (?:a|-|to) 1 ano|0 (?:a|-|to) 6 meses|de 0 a 1 ano|cero experiencia|primer empleo|primer trabajo|primera oportunidad|primer paso laboral|recien egresad[oa] sin experiencia|recien graduad[oa] sin experiencia|bachiller sin experiencia|te capacitamos|te formamos|capacitacion paga|semillero de talento|semillero tech)\b/i;

const INTERN_OR_TRAINEE_REGEX = /\b(practicante|aprendiz|aprendiz sena|pasantia|pasante|intern|internship|contrato de aprendizaje|semillero|trainee|adso|etapa productiva|early[\s-]*career|primer empleo)\b/i;

const SIX_MONTHS_REGEX = /\b(6 meses|seis meses|medio ano|0\.5 anos?|6 months?|six months?)\b/i;

const SENIOR_OR_LEAD_TITLE_REGEX = /\b(senior|sr\.?|lead|principal|staff|architect|arquitecto|director|gerente|manager|head of|vp|jefe de|lider tecnico|tech lead)\b/i;

// Patrones (texto ya normalizado). Los de rango van primero.
const EXP_YEARS_PATTERNS: RegExp[] = [
  // "entre 2 y 4 anos", "entre 2 a 4 years", "between 2 and 4 years"
  new RegExp(`(?:entre|between)\\s+${NUM}\\s*(?:y|a|-|to|and)\\s*${NUM}\\s*${UNIT}`, 'i'),
  // "2 a 4 anos", "2-6 years", "2 y 4 anos de experiencia"
  new RegExp(`${NUM}\\s*(?:a|-|to|y)\\s*${NUM}\\s*${UNIT}\\s*(?:de\\s+)?(?:experiencia|experience|laboral)`, 'i'),
  new RegExp(`${NUM}\\s*(?:a|-|to)\\s*${NUM}\\s*${UNIT}`, 'i'),
  // "minimo 2 anos", "al menos 3 anos", "mas de 3 anos", "experiencia de 1 ano"
  new RegExp(`(?:minimo(?:\\s+de)?|al menos|experiencia minima de|con minimo|requerid[oa] minimo|con experiencia de|experiencia de|mas de|mayor a|minimum(?: of)?|at least)\\s+${NUM}\\s*${UNIT}`, 'i'),
  // "2+ anos", "3+ years"
  new RegExp(`${NUM}\\s*\\+\\s*${UNIT}`, 'i'),
  // "3 anos de experiencia", "5 years of experience"
  new RegExp(`${NUM}\\s*${UNIT}\\s*(?:de\\s+|of\\s+)?(?:experiencia|experience)`, 'i'),
  // "experiencia (laboral|profesional) (minima) de 2 anos"
  new RegExp(`experiencia\\s+(?:laboral\\s+|profesional\\s+)?(?:minima\\s+)?(?:de\\s+)?${NUM}\\s*${UNIT}`, 'i'),
  // "experiencia: 2 anos", "experiencia en X de 2 anos" (ventana corta)
  new RegExp(`experiencia[^.\\n\\d]{0,60}?${NUM}\\s*${UNIT}`, 'i'),
];

function toNumber(s: string): number {
  return parseFloat(s.replace(',', '.'));
}

export interface DetectExperienceOptions {
  isZeroExpSearch?: boolean;
  query?: string;
}

/** Busca la primera cifra de experiencia válida (descarta "edad entre 18 y 38 anos"). */
function findExplicitYears(text: string): { min: number; max: number } | null {
  for (const base of EXP_YEARS_PATTERNS) {
    const re = new RegExp(base.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const before = text.slice(Math.max(0, m.index - 25), m.index);
      if (/\bedad\b/.test(before)) continue;

      const isRange = m.length >= 4 && m[2] !== undefined && !isNaN(toNumber(m[2])) && m[3] !== undefined;
      let minVal: number;
      let maxVal: number;
      let unit: string;
      if (isRange) {
        minVal = toNumber(m[1]);
        maxVal = toNumber(m[2]);
        unit = (m[3] || '').toLowerCase();
      } else {
        minVal = toNumber(m[1]);
        maxVal = minVal;
        unit = (m[2] || m[0]).toLowerCase();
      }
      if (isNaN(minVal) || isNaN(maxVal)) continue;
      if (unit.includes('mes') || unit.includes('month')) {
        minVal /= 12;
        maxVal /= 12;
      }
      // Fuera de rango razonable de experiencia (edades, años calendario, etc.)
      if (maxVal > 20 || minVal > maxVal) continue;
      return { min: minVal, max: maxVal };
    }
  }
  return null;
}

export function detectExperience(
  title: string = '',
  description: string = '',
  options?: DetectExperienceOptions
): ExperienceResult {
  const cleanTitle = normalizeForMatch(title);
  const cleanDesc = normalizeForMatch(description);
  const fullText = `${cleanTitle} ${cleanDesc}`;

  // PASO 1: cifras numéricas (prioridad máxima)
  let minDetectedYears: number | null = null;
  let maxDetectedYears: number | null = null;
  const explicit = findExplicitYears(fullText);
  if (explicit) {
    minDetectedYears = explicit.min;
    maxDetectedYears = explicit.max;
  }

  if (minDetectedYears === null && SIX_MONTHS_REGEX.test(fullText)) {
    minDetectedYears = 0.5;
    maxDetectedYears = 0.5;
  }

  const hasExplicitYears = minDetectedYears !== null;
  const isExplicitZero = ZERO_EXP_EXPLICIT_REGEX.test(fullText);
  const isZeroContext = Boolean(
    options?.isZeroExpSearch ||
    (options?.query && /sin[\s-]*experiencia|primer[\s-]*empleo|aprendiz|practicante|semillero|trainee/i.test(normalizeForMatch(options.query)))
  );

  // PASO 2: Senior / Lead por título -> 5+ años
  if (SENIOR_OR_LEAD_TITLE_REGEX.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 5.0,
      minYears: 5.0,
      maxYears: 8.0,
      experienceTier: 'more_than_five',
      experienceLabel: '5+ años de experiencia (Senior / Lead)',
      seniority: 'senior',
      isEligible: true,
      hasExplicitYears
    };
  }

  // PASO 3: si hay número > 0, ese número manda (nunca "sin experiencia")
  if (minDetectedYears !== null && minDetectedYears > 0) {
    const maxY = maxDetectedYears || minDetectedYears;
    const base = { isZeroExperience: false, minYears: minDetectedYears, maxYears: maxY, isEligible: true, hasExplicitYears: true };
    const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

    if (minDetectedYears <= 0.5 && maxY <= 0.7) {
      return { ...base, maxYearsExperience: 0.5, experienceTier: 'six_months', experienceLabel: '6 meses de experiencia', seniority: 'trainee' };
    }
    if (minDetectedYears <= 1.2 && maxY <= 1.5) {
      return { ...base, maxYearsExperience: 1.0, experienceTier: 'one_year', experienceLabel: '1 año de experiencia', seniority: 'junior' };
    }
    if (minDetectedYears <= 3.0) {
      const label = maxY > minDetectedYears
        ? `${fmt(minDetectedYears)} a ${fmt(maxY)} años de experiencia`
        : `${fmt(minDetectedYears)}+ años de experiencia`;
      return { ...base, maxYearsExperience: maxY, experienceTier: 'two_to_three', experienceLabel: label, seniority: 'junior' };
    }
    if (minDetectedYears <= 4.5) {
      const label = maxY > minDetectedYears
        ? `${fmt(minDetectedYears)} a ${fmt(maxY)} años de experiencia`
        : `${fmt(minDetectedYears)}+ años de experiencia`;
      return { ...base, maxYearsExperience: maxY, experienceTier: 'three_to_four', experienceLabel: label, seniority: 'early_mid' };
    }
    return { ...base, maxYearsExperience: maxY, experienceTier: 'more_than_five', experienceLabel: '5+ años de experiencia (Senior)', seniority: 'senior' };
  }

  // PASO 4: 0 explícito (ej: "0 a 1 año")
  if (minDetectedYears !== null && minDetectedYears === 0) {
    return {
      isZeroExperience: true,
      maxYearsExperience: 0.0,
      minYears: 0,
      maxYears: maxDetectedYears || 0,
      experienceTier: 'zero_exp',
      experienceLabel: 'Sin experiencia previa',
      seniority: 'trainee',
      isEligible: true,
      hasExplicitYears: true
    };
  }

  // PASO 5: Intern / Trainee / Practicante en el TÍTULO
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
      isEligible: true,
      hasExplicitYears
    };
  }

  // PASO 6: frases explícitas de "sin experiencia"
  if (isExplicitZero || isZeroContext) {
    return {
      isZeroExperience: true,
      maxYearsExperience: 0.0,
      experienceTier: 'zero_exp',
      experienceLabel: 'Sin experiencia previa',
      seniority: 'trainee',
      isEligible: true,
      hasExplicitYears
    };
  }

  // PASO 7: heurísticas por título (estimadas, NUNCA activan isZeroExperience)
  if (/\b(semi[\s-]*senior|ssr|mid[\s-]*level|intermedio|especialista)\b/i.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 3.5,
      experienceTier: 'three_to_four',
      experienceLabel: '3 a 4 años de experiencia (estimado)',
      seniority: 'early_mid',
      isEligible: true,
      hasExplicitYears
    };
  }

  if (/\b(junior|jr|auxiliar|asistente|tecnologo|tecnico|soporte|entry)\b/i.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 1.0,
      experienceTier: 'one_year',
      experienceLabel: '1 año de experiencia (estimado)',
      seniority: 'junior',
      isEligible: true,
      hasExplicitYears
    };
  }

  if (/\b(ingeniero|developer|desarrollador|programador|analista|consultor|asesor|ejecutivo|contador|coordinador|qa|tester|data)\b/i.test(cleanTitle)) {
    return {
      isZeroExperience: false,
      maxYearsExperience: 2.0,
      experienceTier: 'two_to_three',
      experienceLabel: '2 a 3 años de experiencia (estimado)',
      seniority: 'junior',
      isEligible: true,
      hasExplicitYears
    };
  }

  // Default: experiencia no especificada
  return {
    isZeroExperience: false,
    maxYearsExperience: 1.0,
    experienceTier: 'one_year',
    experienceLabel: 'Experiencia no especificada',
    seniority: 'junior',
    isEligible: true,
    hasExplicitYears
  };
}
