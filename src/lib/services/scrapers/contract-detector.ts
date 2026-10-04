/**
 * Detector y Normalizador de Tipos de Contrato en Colombia
 */

export type ContractType = 
  | 'indefinido'
  | 'fijo'
  | 'aprendizaje'
  | 'prestacion_servicios'
  | 'obra_labor'
  | 'no_especificado';

export interface ContractDetectionResult {
  contractType: ContractType;
  contractTypeLabel: string;
}

export function detectContractType(
  title: string = '',
  description: string = '',
  extraInfo: string = ''
): ContractDetectionResult {
  const combined = `${title} ${description} ${extraInfo}`.toLowerCase();

  // 1. Contrato de Aprendizaje / Prácticas / SENA / Pasantía (estrictamente etapa formativa)
  const isSeniorTitle = /\b(senior|sr\.?|lead|principal|staff|architect|director|manager|gerente)\b/i.test(title);
  if (
    !isSeniorTitle && (
      combined.includes('aprendizaje') ||
      combined.includes('practicante') ||
      combined.includes('prácticas') ||
      combined.includes('practicas') ||
      combined.includes('pasante') ||
      combined.includes('pasantia') ||
      combined.includes('pasantía') ||
      combined.includes('aprendiz') ||
      /\bsena\b/.test(combined) ||
      combined.includes('etapa productiva') ||
      combined.includes('estudiante en practica') ||
      combined.includes('estudiante en práctica') ||
      /\b(internship|intern|interns|becario)\b/i.test(title)
    )
  ) {
    return {
      contractType: 'aprendizaje',
      contractTypeLabel: 'Contrato de Aprendizaje (Prácticas)'
    };
  }

  // 2. Obra o Labor (detect before generic terms)
  if (
    combined.includes('obra o labor') ||
    combined.includes('obra labor') ||
    combined.includes('por obra') ||
    combined.includes('por labor') ||
    combined.includes('obra o labor determinada') ||
    combined.includes('labor determinada') ||
    combined.includes('contrato de obra') ||
    combined.includes('obra/labor') ||
    combined.includes('obra / labor') ||
    combined.includes('mision') ||
    combined.includes('misión') ||
    combined.includes('temporal') ||
    combined.includes('servicios temporales')
  ) {
    return {
      contractType: 'obra_labor',
      contractTypeLabel: 'Obra o Labor'
    };
  }

  // 3. Prestación de Servicios / OPS / Freelance / Contractor / Honorarios
  if (
    combined.includes('prestacion de servicios') ||
    combined.includes('prestación de servicios') ||
    combined.includes('prestacion servicios') ||
    combined.includes('prestación servicios') ||
    combined.includes('por prestacion') ||
    combined.includes('por prestación') ||
    combined.includes('honorarios') ||
    combined.includes('por horas') ||
    /\bops\b/.test(combined) ||
    combined.includes('freelance') ||
    combined.includes('contractor') ||
    combined.includes('cuenta de cobro') ||
    combined.includes('servicios profesionales')
  ) {
    return {
      contractType: 'prestacion_servicios',
      contractTypeLabel: 'Prestación de Servicios'
    };
  }

  // 4. Término Fijo (con duración o mención expresa)
  if (
    combined.includes('termino fijo') ||
    combined.includes('término fijo') ||
    combined.includes('a termino fijo') ||
    combined.includes('a término fijo') ||
    combined.includes('plazo fijo') ||
    combined.includes('contrato fijo') ||
    combined.includes('fijo a') ||
    combined.includes('tiempo determinado') ||
    combined.includes('meses renovable') ||
    combined.includes('meses prorrogable')
  ) {
    return {
      contractType: 'fijo',
      contractTypeLabel: 'Término Fijo'
    };
  }

  // 5. Término Indefinido (mencionado explícitamente)
  if (
    combined.includes('termino indefinido') ||
    combined.includes('término indefinido') ||
    combined.includes('a termino indefinido') ||
    combined.includes('a término indefinido') ||
    combined.includes('indefinido') ||
    combined.includes('vinculacion directa') ||
    combined.includes('vinculación directa') ||
    combined.includes('contrato directo') ||
    combined.includes('planta directa') ||
    combined.includes('todas las prestaciones de ley') ||
    combined.includes('prestaciones sociales de ley') ||
    combined.includes('contrato indefinido')
  ) {
    return {
      contractType: 'indefinido',
      contractTypeLabel: 'Término Indefinido'
    };
  }

  // 6. No especificado — la vacante no indica el tipo de contrato
  return {
    contractType: 'no_especificado',
    contractTypeLabel: 'No especificado'
  };
}

export function getContractTypeLabel(contractType?: string, explicitLabel?: string): string {
  if (explicitLabel && explicitLabel !== 'A convenir / No especificado' && explicitLabel.trim() !== '') {
    return explicitLabel;
  }
  switch (contractType) {
    case 'indefinido':
      return 'Término Indefinido';
    case 'fijo':
      return 'Término Fijo';
    case 'aprendizaje':
      return 'Contrato de Aprendizaje (Prácticas)';
    case 'prestacion_servicios':
      return 'Prestación de Servicios';
    case 'obra_labor':
      return 'Obra o Labor';
    case 'no_especificado':
    default:
      return 'A convenir / No especificado';
  }
}
