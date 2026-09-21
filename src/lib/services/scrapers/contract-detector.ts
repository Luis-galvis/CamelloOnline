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

  // 1. Contrato de Aprendizaje / Prácticas / SENA / Pasante / Trainee
  if (
    combined.includes('aprendizaje') ||
    combined.includes('practicante') ||
    combined.includes('prácticas') ||
    combined.includes('practicas') ||
    combined.includes('pasante') ||
    combined.includes('pasantia') ||
    combined.includes('pasantía') ||
    combined.includes('aprendiz') ||
    combined.includes('sena') ||
    combined.includes('etapa productiva') ||
    combined.includes('estudiante en practica') ||
    combined.includes('internship') ||
    combined.includes('intern') ||
    combined.includes('becario') ||
    combined.includes('semillero')
  ) {
    return {
      contractType: 'aprendizaje',
      contractTypeLabel: 'Contrato de Aprendizaje (Prácticas)'
    };
  }

  // 2. Prestación de Servicios / OPS / Freelance / Contractor / Honorarios
  if (
    combined.includes('prestacion de servicios') ||
    combined.includes('prestación de servicios') ||
    combined.includes('honorarios') ||
    combined.includes('por horas') ||
    combined.includes('ops') ||
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

  // 3. Obra o Labor
  if (
    combined.includes('obra o labor') ||
    combined.includes('obra labor') ||
    combined.includes('por obra') ||
    combined.includes('por labor') ||
    combined.includes('obra o labor determinada') ||
    combined.includes('labor determinada') ||
    combined.includes('mision') ||
    combined.includes('misión') ||
    combined.includes('temporal')
  ) {
    return {
      contractType: 'obra_labor',
      contractTypeLabel: 'Obra o Labor'
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

  // 5. Término Indefinido
  if (
    combined.includes('indefinido') ||
    combined.includes('termino indefinido') ||
    combined.includes('término indefinido') ||
    combined.includes('a termino indefinido') ||
    combined.includes('a término indefinido') ||
    combined.includes('contrato indefinido') ||
    combined.includes('plazo indefinido') ||
    combined.includes('tiempo indefinido') ||
    combined.includes('directo con la empresa') ||
    combined.includes('contratacion directa') ||
    combined.includes('contratación directa') ||
    combined.includes('permanent') ||
    combined.includes('indefinite')
  ) {
    return {
      contractType: 'indefinido',
      contractTypeLabel: 'Término Indefinido'
    };
  }

  // Si no está especificado explícitamente en el texto
  return {
    contractType: 'no_especificado',
    contractTypeLabel: 'A convenir / No especificado'
  };
}
