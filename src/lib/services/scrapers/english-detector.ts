/**
 * Detector de Requisitos de Idioma Inglés para Vacantes en Colombia
 */

export interface EnglishDetectionResult {
  requiresEnglish: boolean;
  englishLevel: 'no_english_required' | 'b1_intermediate' | 'b2_upper_intermediate' | 'c1_advanced' | 'bilingual_required';
  badgeText: string;
  badgeType: 'english_required' | 'spanish_only';
  detectedReason: string;
  levelLabel?: string;
  englishLevelLabel?: string;
}

const STRONG_ENGLISH_PATTERNS = [
  /\b(bilingual|bilingüe|bilingue)\b/i,
  /\b(english\s*(?:level|level:)?\s*(?:c1|c2|b2|b1|advanced|fluent|proficient|conversational|intermediate|required))\b/i,
  /\b(ingl[eé]s\s*(?:requerido|obligatorio|avanzado|fluido|conversacional|intermedio\s*alto|intermedio|b1|b2|c1|c2))\b/i,
  /\b(fluent\s*in\s*(?:written\s*and\s*spoken\s*)?english)\b/i,
  /\b(english\s*(?:and|y|&|\/)\s*spanish|spanish\s*(?:and|y|&|\/)\s*english)\b/i,
  /\b(communicate\s*in\s*english|communication\s*in\s*english|written\s*and\s*verbal\s*english)\b/i,
  /\b(english\s*fluency|fluent\s*english|proficiency\s*in\s*english|good\s*command\s*of\s*english|english\s*skills)\b/i,
  /\b(dominio\s*(?:del\s*)?ingl[eé]s|manejo\s*(?:del\s*)?ingl[eé]s|nivel\s*(?:de\s*)?ingl[eé]s)\b/i,
  /\b(100%\s*english|100%\s*bilingual|ingl[eé]s\s*80%|ingl[eé]s\s*85%|ingl[eé]s\s*90%|ingl[eé]s\s*100%)\b/i,
  /\b(spoken\s*and\s*written\s*english|written\s*and\s*verbal\s*english|english\s*speaker)\b/i,
  /\b(b2\s*english|c1\s*english|b2\s*ingl[eé]s|c1\s*ingl[eé]s)\b/i
];

const EXPLICIT_NO_ENGLISH_PATTERNS = [
  /\b(no\s*requiere\s*ingl[eé]s|no\s*necesita\s*ingl[eé]s|sin\s*ingl[eé]s|no\s*english\s*required|100%\s*espa[ñn]ol|solo\s*espa[ñn]ol|espa[ñn]ol\s*nativo)\b/i,
];

const ENGLISH_SECTION_PATTERNS = [
  /\b(responsibilities|accountabilities|qualifications|job description|about the role|about the company|who we are|what you['’]?ll do|what we offer|what's on offer|what we are looking for|who you are|key skills|key responsibilities|education \/ experience|bachelor['’]?s degree|working conditions|a day in the life|role requirements|benefits & perks|what success looks like|how to apply|what to expect|quote job ref)\b/i,
  /\b(contributes to the overall success|customer focused culture|agile team environment|hands on development|ensures all activities|written and spoken english|strong communication skills|we are an equal opportunity employer)\b/i
];

// Common English words
const ENGLISH_STOPWORDS = [
  'the', 'and', 'with', 'you', 'will', 'are', 'for', 'our', 'team', 'experience', 
  'requirements', 'skills', 'about', 'role', 'responsibilities', 'accountabilities', 
  'working', 'business', 'development', 'knowledge', 'degree', 'support', 'using', 
  'ensures', 'culture', 'values', 'design', 'environment', 'tools', 'code',
  'must', 'have', 'from', 'this', 'that', 'they', 'their', 'which', 'other', 'fluent', 'written', 'spoken',
  'building', 'looking', 'help', 'learn', 'opportunity', 'company', 'position', 'strong', 'learning'
];

const SPANISH_STOPWORDS = [
  'el', 'la', 'los', 'las', 'que', 'con', 'para', 'por', 'experiencia', 'requisitos', 
  'funciones', 'empresa', 'trabajo', 'equipo', 'como', 'este', 'esta', 'nuestro', 'nuestra',
  'oferta', 'laboral', 'cargo', 'desarrollador', 'analista', 'practicante', 'aprendiz', 'semillero',
  'postular', 'vacante', 'contrato', 'salario', 'remoto'
];

const ENGLISH_JOB_TITLES: RegExp[] = [
  /\b(software\s*engineer|cloud\s*engineer|system\s*(?:&|and)?\s*cloud|devops\s*engineer|frontend\s*developer|backend\s*developer|full\s*stack\s*developer|data\s*engineer|data\s*scientist|qa\s*automation|sdr\s*b2b|customer\s*support\s*representative|product\s*manager|site\s*reliability\s*engineer|security\s*engineer|solutions\s*architect|technical\s*support\s*engineer|scrum\s*master)\b/i,
];

export function detectEnglishRequirement(title: string, description: string = ''): EnglishDetectionResult {
  const combined = `${title} ${description}`.toLowerCase();
  const titleLower = (title || '').toLowerCase();

  // 1. Check explicit NO English
  for (const pattern of EXPLICIT_NO_ENGLISH_PATTERNS) {
    if (pattern.test(combined)) {
      return {
        requiresEnglish: false,
        englishLevel: 'no_english_required',
        badgeText: '🇨🇴 No requiere inglés (Español)',
        badgeType: 'spanish_only',
        detectedReason: 'Explícitamente no requiere inglés'
      };
    }
  }

  // 2. Check strong English requirement patterns
  for (const pattern of STRONG_ENGLISH_PATTERNS) {
    const match = combined.match(pattern);
    if (match) {
      const matchStr = match[0].toLowerCase();
      let level: EnglishDetectionResult['englishLevel'] = 'b2_upper_intermediate';
      if (matchStr.includes('c1') || matchStr.includes('avanzado') || matchStr.includes('fluent') || matchStr.includes('proficient')) {
        level = 'c1_advanced';
      } else if (matchStr.includes('bilingual') || matchStr.includes('bilingüe') || matchStr.includes('bilingue')) {
        level = 'bilingual_required';
      }
      return {
        requiresEnglish: true,
        englishLevel: level,
        badgeText: '🇬🇧 Requiere inglés (B2-C1 / Bilingüe)',
        badgeType: 'english_required',
        detectedReason: `Patrón detectado: "${match[0]}"`
      };
    }
  }

  // 3. Check English Section Headers (e.g. "Who You Are", "Responsibilities", "About the Role")
  let englishSectionCount = 0;
  for (const p of ENGLISH_SECTION_PATTERNS) {
    if (p.test(combined)) englishSectionCount++;
  }
  if (englishSectionCount >= 1) {
    return {
      requiresEnglish: true,
      englishLevel: 'b2_upper_intermediate',
      badgeText: '🇬🇧 Requiere inglés (Oferta en Inglés)',
      badgeType: 'english_required',
      detectedReason: 'Estructura y contenido de la vacante redactados en inglés'
    };
  }

  // 4. English titles recognition
  for (const tPat of ENGLISH_JOB_TITLES) {
    if (tPat.test(titleLower)) {
      return {
        requiresEnglish: true,
        englishLevel: 'b2_upper_intermediate',
        badgeText: '🇬🇧 Requiere inglés',
        badgeType: 'english_required',
        detectedReason: 'Título de vacante internacional en inglés'
      };
    }
  }

  // 5. Language statistical test: description analysis
  const words = combined.split(/\s+/).slice(0, 500);
  let engScore = 0;
  let esScore = 0;
  for (const w of words) {
    const cleanWord = w.replace(/[^a-záéíóúñ]/g, '');
    if (ENGLISH_STOPWORDS.includes(cleanWord)) engScore++;
    if (SPANISH_STOPWORDS.includes(cleanWord)) esScore++;
  }

  if (engScore >= 3 && engScore >= esScore) {
    return {
      requiresEnglish: true,
      englishLevel: 'b2_upper_intermediate',
      badgeText: '🇬🇧 Requiere inglés',
      badgeType: 'english_required',
      detectedReason: `Texto en inglés (${engScore} palabras clave vs ${esScore} en español)`
    };
  }

  // Default: Español
  return {
    requiresEnglish: false,
    englishLevel: 'no_english_required',
    badgeText: '🇨🇴 No requiere inglés (Español)',
    badgeType: 'spanish_only',
    detectedReason: 'Texto en español sin requerimiento explícito de inglés'
  };
}
