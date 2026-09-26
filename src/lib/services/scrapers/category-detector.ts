/**
 * Clasificador Robusto de Especialidades y Áreas (Tech y No-Tech)
 * para REALJOBS Colombia
 */

export type TechCategory = 
  | 'software_dev'
  | 'data_ai'
  | 'qa_testing'
  | 'it_support'
  | 'ui_ux_product';

export type NonTechCategory =
  | 'sales_commercial'
  | 'customer_service'
  | 'finance_accounting'
  | 'virtual_assistant_ops'
  | 'marketing_digital'
  | 'hr_recruiting'
  | 'writing_content'
  | 'logistics_operations'
  | 'health_nursing'
  | 'general_remote';

export type JobCategory = TechCategory | NonTechCategory;

export interface CategoryDetectionResult {
  category: JobCategory;
  categoryLabel: string;
  isTech: boolean;
}

// Regex estrictos para roles expresamente no tecnológicos
const NON_TECH_ROLES_REGEX = /\b(ventas|asesor\s+comercial|ejecutivo\s+comercial|vendedor|promotor|impulsador|mercaimpulsador|tat|telemercadeo|cobranza|retenci[oó]n|punto\s+de\s+venta|cajero|servicio\s+al\s+cliente|atenci[oó]n\s+al\s+cliente|customer\s+service|customer\s+support|call\s+center|pqr|chat\s+sac|agente\s+sac|recepci[oó]n\s+de\s+llamadas|contad|contable|auxiliar\s+contable|t[eé]cnico\s+contable|analista\s+de\s+pagos|facturaci[oó]n|n[oó]mina|tesorer[ií]a|bodega|log[ií]stica|almac[eé]n|despachos|producci[oó]n\s+alimentos|operario|enfermer|m[eé]dico|dietas|salud|asistente\s+virtual|digitador|auxiliar\s+administrativo|recepcionista|secretaria|recursos\s+humanos|talento\s+humano|reclutador|headhunter|community\s+manager|redactor|copywriter|editor\s+de\s+video)\b/i;

// Regex para Data & IA (requiere contexto real, NO simple palabra "datos" legal)
const DATA_AI_REGEX = /\b(analista\s+de\s+datos|data\s+analyst|data\s+engineer|ingeniero\s+de\s+datos|cient[ií]fico\s+de\s+datos|data\s+scientist|machine\s+learning|inteligencia\s+artificial|ai\s+engineer|power\s*bi|tableau|business\s+intelligence|analista\s+bi|bi\s+analyst|etl\s+developer|big\s+data|sql\s+developer|dba|deep\s+learning|nlp|anal[ií]tica\s+de\s+datos)\b/i;

// Regex para QA & Testing
const QA_TESTING_REGEX = /\b(qa\s+tester|qa\s+engineer|qa\s+analyst|analista\s+qa|tester\s+qa|software\s+tester|testing\s+de\s+software|pruebas\s+de\s+software|calidad\s+de\s+software|automatizador\s+qa|cypress|selenium|postman|test\s+automation)\b/i;

// Regex para Soporte TI, Cloud, DevOps & Infraestructura
const IT_SUPPORT_REGEX = /\b(soporte\s+t[eé]cnico|soporte\s+ti|help\s*desk|mesa\s+de\s+ayuda|infraestructura\s+ti|sysadmin|administrador\s+de\s+sistemas|redes\s+y\s+telecomunicaciones|ciberseguridad|seguridad\s+inform[aá]tica|devops|cloud\s+engineer|cloud\s+architect|sre|site\s+reliability|t[eé]cnico\s+en\s+sistemas|auxiliar\s+de\s+sistemas)\b/i;

// Regex para UI/UX & Producto
const UI_UX_PRODUCT_REGEX = /\b(ui\/ux|ux\/ui|ux\s+designer|ui\s+designer|product\s+designer|dise[ñn]ador\s+web|dise[ñn]o\s+de\s+interfaces|product\s+owner|scrum\s+master)\b/i;

// Regex para Desarrollo de Software
const SOFTWARE_DEV_REGEX = /\b(desarrollador[a]?|desarrollo|programador[a]?|programaci[oó]n|developer|software\s+developer|software\s+engineer|ingeniero\s+de\s+software|ingeniero\s+de\s+sistemas|frontend|front-end|backend|back-end|fullstack|full-stack|react|angular|vue|next\.?js|node\.?js|python|java|javascript|typescript|c#|\.net|php|laravel|golang|ruby|flutter|android|ios|mobile\s+developer|appian|adso|desarrollo\s+web|semillero\s+desarrollo|practicante\s+sistemas|aprendiz\s+sena\s+sistemas)\b/i;

/**
 * Detecta la categoría real de cualquier vacante (Tech o No-Tech)
 */
export function detectJobCategory(title: string = '', description: string = ''): CategoryDetectionResult {
  const cleanTitle = (title || '').trim().toLowerCase();
  const cleanDesc = (description || '').trim().toLowerCase();
  const combinedText = `${cleanTitle} ${cleanDesc}`;

  // 1. Detección de roles No-Tech específicos primero si el título es evidentemente No-Tech
  // (a menos que tenga un calificador tech evidente como 'software', 'it recruiter', 'data analyst', 'bi analyst')
  const isExplicitNonTechTitle = NON_TECH_ROLES_REGEX.test(cleanTitle) && 
    !cleanTitle.includes('software') && 
    !cleanTitle.includes('developer') && 
    !cleanTitle.includes('data analyst') && 
    !cleanTitle.includes('it recruiter') && 
    !cleanTitle.includes('tech recruiter') &&
    !cleanTitle.includes('bi analyst');

  if (isExplicitNonTechTitle) {
    // 1.1 Ventas & Comercial
    if (/\b(ventas|asesor\s+comercial|ejecutivo\s+comercial|vendedor|promotor|impulsador|mercaimpulsador|tat|telemercadeo|cobranza|retenci[oó]n|punto\s+de\s+venta|asesor\s+de\s+tienda|bdr|sdr|account\s+executive)\b/i.test(cleanTitle)) {
      return { category: 'sales_commercial', categoryLabel: 'Ventas & Comercial', isTech: false };
    }

    // 1.2 Atención al Cliente & Call Center
    if (/\b(servicio\s+al\s+cliente|atenci[oó]n\s+al\s+cliente|customer\s+service|customer\s+support|call\s+center|pqr|chat\s+sac|agente\s+sac|recepci[oó]n\s+de\s+llamadas|bilingue|bilingüe|contact\s+center)\b/i.test(cleanTitle)) {
      return { category: 'customer_service', categoryLabel: 'Atención al Cliente', isTech: false };
    }

    // 1.3 Finanzas, Contabilidad & Facturación
    if (/\b(contad|contable|auxiliar\s+contable|t[eé]cnico\s+contable|analista\s+de\s+pagos|facturaci[oó]n|n[oó]mina|tesorer[ií]a|auditor|cartera|costos)\b/i.test(cleanTitle)) {
      return { category: 'finance_accounting', categoryLabel: 'Finanzas & Contabilidad', isTech: false };
    }

    // 1.4 Logística, Bodega & Producción
    if (/\b(bodega|log[ií]stica|almac[eé]n|despachos|producci[oó]n|operario|embalaje|inventarios)\b/i.test(cleanTitle)) {
      return { category: 'logistics_operations', categoryLabel: 'Logística & Bodega', isTech: false };
    }

    // 1.5 Salud & Nutrición
    if (/\b(enfermer|m[eé]dico|dietas|salud|cl[ií]nica|hospital|farmacia)\b/i.test(cleanTitle)) {
      return { category: 'health_nursing', categoryLabel: 'Salud & Bienestar', isTech: false };
    }

    // 1.6 Asistente Virtual & Operaciones
    if (/\b(asistente\s+virtual|digitador|auxiliar\s+administrativo|asistente\s+administrativo|recepcionista|secretaria|data\s+entry)\b/i.test(cleanTitle)) {
      return { category: 'virtual_assistant_ops', categoryLabel: 'Operaciones & Asistente', isTech: false };
    }

    // 1.7 Recursos Humanos
    if (/\b(recursos\s+humanos|talento\s+humano|reclutador|headhunter|gesti[oó]n\s+humana|psic[oó]log)\b/i.test(cleanTitle)) {
      return { category: 'hr_recruiting', categoryLabel: 'Recursos Humanos', isTech: false };
    }

    // 1.8 Marketing & Creativo
    if (/\b(marketing|community\s+manager|redes\s+sociales|copywriter|editor\s+de\s+video|dise[ñn]ador\s+gr[aá]fico)\b/i.test(cleanTitle)) {
      return { category: 'marketing_digital', categoryLabel: 'Marketing Digital', isTech: false };
    }

    return { category: 'general_remote', categoryLabel: 'Remoto General', isTech: false };
  }

  // 2. Detección de Categorías Tecnológicas (Tech)
  
  // 2.1 Datos e Inteligencia Artificial
  if (DATA_AI_REGEX.test(cleanTitle) || (DATA_AI_REGEX.test(combinedText) && (cleanTitle.includes('analista') || cleanTitle.includes('ingeniero') || cleanTitle.includes('consultor') || cleanTitle.includes('junior')))) {
    return { category: 'data_ai', categoryLabel: 'Datos & IA', isTech: true };
  }

  // 2.2 QA & Testing
  if (QA_TESTING_REGEX.test(cleanTitle) || QA_TESTING_REGEX.test(combinedText)) {
    return { category: 'qa_testing', categoryLabel: 'QA & Testing', isTech: true };
  }

  // 2.3 Soporte TI, Cloud & Infraestructura
  if (IT_SUPPORT_REGEX.test(cleanTitle) || (IT_SUPPORT_REGEX.test(combinedText) && (cleanTitle.includes('soporte') || cleanTitle.includes('auxiliar') || cleanTitle.includes('tecnico') || cleanTitle.includes('t[eé]cnico') || cleanTitle.includes('sistemas')))) {
    return { category: 'it_support', categoryLabel: 'Soporte & Cloud', isTech: true };
  }

  // 2.4 UI/UX & Producto
  if (UI_UX_PRODUCT_REGEX.test(cleanTitle) || UI_UX_PRODUCT_REGEX.test(combinedText)) {
    return { category: 'ui_ux_product', categoryLabel: 'UI/UX & Producto', isTech: true };
  }

  // 2.5 Desarrollo de Software
  if (SOFTWARE_DEV_REGEX.test(cleanTitle) || (SOFTWARE_DEV_REGEX.test(combinedText) && (cleanTitle.includes('desarroll') || cleanTitle.includes('program') || cleanTitle.includes('developer') || cleanTitle.includes('ingenier') || cleanTitle.includes('practicante') || cleanTitle.includes('aprendiz') || cleanTitle.includes('trainee') || cleanTitle.includes('junior')))) {
    return { category: 'software_dev', categoryLabel: 'Desarrollo', isTech: true };
  }

  // 3. Si no cumple tech, verificar categorías no tech secundarias
  if (/\b(ventas|comercial|tat|asesor|vendedor|tienda|punto\s+de\s+venta)\b/i.test(combinedText)) {
    return { category: 'sales_commercial', categoryLabel: 'Ventas & Comercial', isTech: false };
  }
  if (/\b(servicio\s+al\s+cliente|atenci[oó]n|call\s+center|customer\s+service)\b/i.test(combinedText)) {
    return { category: 'customer_service', categoryLabel: 'Atención al Cliente', isTech: false };
  }
  if (/\b(contab|financ|cartera|factur|pago)\b/i.test(combinedText)) {
    return { category: 'finance_accounting', categoryLabel: 'Finanzas & Contabilidad', isTech: false };
  }

  // 4. Default no-tech
  return { category: 'general_remote', categoryLabel: 'General', isTech: false };
}

/**
 * Helper retrocompatible para detectTechCategory
 */
export function detectTechCategory(title: string = '', description: string = ''): CategoryDetectionResult {
  const result = detectJobCategory(title, description);
  if (result.isTech) {
    return result;
  }
  // Si no es tech, asigna la categoría tech más cercana según contexto o default a software_dev
  return {
    category: result.category as any,
    categoryLabel: result.categoryLabel,
    isTech: result.isTech
  };
}
