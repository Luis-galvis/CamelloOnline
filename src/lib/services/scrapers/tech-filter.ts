/**
 * Filtro de Exclusividad Tech / Ingeniería de Software / Datos / QA / Cloud / Soporte TI
 */

// Roles expresamente no tecnológicos que deben ser rechazados aunque contengan "intern" o "practicante"
const NON_TECH_EXCLUSION_REGEX = /\b(writer|freelance\s+writer|redactor|copywriter|traductor|periodista|eventos|organizador|log[ií]stica|bodega|conductor|chofer|enfermer[oa]|m[eé]dico|abogad[oa]|legal\s+assistant|paralegal|recursos\s+humanos|talento\s+humano|psic[oó]log[oa]|gesti[oó]n\s+humana|n[oó]mina|headhunter|contador[a]?|auxiliar\s+contable|auditor\s+financiero|ventas|sales\s+representative|business\s+development|asesor\s+comercial|telemercadeo|call\s+center|cobranzas?|cajero|recepcionista|secretaria|camarer[oa]|cocinero|vigilante|guarda\s+de\s+seguridad)\b/i;

// Roles expresamente tecnológicos
const TECH_POSITIVE_REGEX = /\b(software|desarrollad|programad|frontend|front-end|backend|back-end|fullstack|full-stack|developer|engineer|ingenier[oa]|devops|cloud|qa|tester|testing|calidad\s+de\s+software|automatizad|data|datos|analytics|analista\s+bi|power\s+bi|tableau|sql|database|dba|machine\s+learning|inteligencia\s+artificial|ai\s+engineer|ciberseguridad|seguridad\s+inform[aá]tica|soporte\s+ti|soporte\s+t[eé]cnico|sistemas|help\s+desk|mesa\s+de\s+ayuda|sysadmin|redes|infraestructura|ui\/ux|ux\/ui|product\s+designer|dise[ñn]ador\s+ux|mobile|android|ios|flutter|react|node|python|java|c#|\.net|php|golang|aws|azure|gcp|semillero\s+sistemas|practicante\s+sistemas|aprendiz\s+sena\s+sistemas|aprendiz\s+sena\s+adso|adso|desarrollo\s+web)\b/i;

export function isTechJob(title: string, description: string = ''): boolean {
  const cleanTitle = (title || '').trim().toLowerCase();
  const cleanDesc = (description || '').trim().toLowerCase();

  // 1. Si el título explícitamente tiene una exclusión no-tech (y no es tech recruiter / salesforce), descartar
  if (NON_TECH_EXCLUSION_REGEX.test(cleanTitle)) {
    // Excepciones donde puede ser tech
    const isTechException = 
      cleanTitle.includes('salesforce') || 
      cleanTitle.includes('it recruiter') || 
      cleanTitle.includes('tech recruiter') ||
      cleanTitle.includes('data analyst') ||
      cleanTitle.includes('bi analyst') ||
      cleanTitle.includes('software');

    if (!isTechException) {
      return false;
    }
  }

  // 2. Debe cumplir con el positivo de rol tecnológico en el título
  if (TECH_POSITIVE_REGEX.test(cleanTitle)) {
    return true;
  }

  // 3. Si el título no lo tiene explícito, pero la descripción es contundentemente tech y el título no es no-tech
  if (TECH_POSITIVE_REGEX.test(cleanDesc)) {
    // Asegurar que el título sea al menos técnico o trainee/practicante
    const isCandidateTitle = 
      cleanTitle.includes('practicante') || 
      cleanTitle.includes('aprendiz') || 
      cleanTitle.includes('pasante') || 
      cleanTitle.includes('trainee') || 
      cleanTitle.includes('junior') || 
      cleanTitle.includes('analista') || 
      cleanTitle.includes('asistente') || 
      cleanTitle.includes('consultor');

    return isCandidateTitle;
  }

  return false;
}
