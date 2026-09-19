/**
 * Extractor de Salarios para Vacantes de Colombia (COP / USD / No especificado)
 */

export interface SalaryExtractionResult {
  isDisclosed: boolean;
  min?: number;
  max?: number;
  salaryMinCop?: number;
  salaryMaxCop?: number;
  salaryMinUsd?: number;
  salaryMaxUsd?: number;
  currency?: 'COP' | 'USD';
  displayText: string;
  salaryDisplayText?: string;
  period?: 'monthly' | 'yearly' | 'hourly';
  usdEquivalentMin?: number;
  usdEquivalentMax?: number;
}

const USD_TO_COP_ESTIMATE = 4100;

export function extractSalary(rawText: string, providedSalaryText?: string): SalaryExtractionResult {
  const text = `${providedSalaryText || ''} ${rawText}`;

  // Patterns for "No disclosed" or "A convenir"
  const aConvenirPattern = /(salario\s*a\s*convenir|a\s*convenir|no\s*especificado|confidencial|no\s*divulgado|competitive\s*salary|acorde\s*a\s*la\s*experiencia|no\s*definido)/i;

  if (providedSalaryText && aConvenirPattern.test(providedSalaryText.trim())) {
    return {
      isDisclosed: false,
      displayText: 'No especificado en la vacante'
    };
  }

  // 1. ElEmpleo & Colombian phrasing: "$ 3 a $ 4 millones", "$2,5 a $3,5 millones", "3 a 4 millones", "Menos de $ 1,5 millones"
  const elempleoRange = /\$?\s*([0-9]+(?:[\.,][0-9]+)?)\s*(?:a|-|\s+y\s+)\s*\$?\s*([0-9]+(?:[\.,][0-9]+)?)\s*(?:millones|millón|m)\b/i;
  const elempleoRangeMatch = text.match(elempleoRange);
  if (elempleoRangeMatch) {
    const minM = parseFloat(elempleoRangeMatch[1].replace(',', '.')) * 1000000;
    const maxM = parseFloat(elempleoRangeMatch[2].replace(',', '.')) * 1000000;
    if (minM >= 800000 && maxM <= 50000000) {
      return {
        isDisclosed: true,
        min: minM,
        max: maxM,
        currency: 'COP',
        displayText: `$${(minM / 1000000).toFixed(1).replace('.0', '')}M - $${(maxM / 1000000).toFixed(1).replace('.0', '')}M COP / mes`,
        usdEquivalentMin: Math.round(minM / USD_TO_COP_ESTIMATE),
        usdEquivalentMax: Math.round(maxM / USD_TO_COP_ESTIMATE)
      };
    }
  }

  const menosDeMillones = /menos\s*de\s*\$?\s*([0-9]+(?:[\.,][0-9]+)?)\s*(?:millones|millón|m)\b/i;
  const menosMatch = text.match(menosDeMillones);
  if (menosMatch) {
    const maxM = parseFloat(menosMatch[1].replace(',', '.')) * 1000000;
    const minM = Math.max(1300000, maxM - 500000);
    return {
      isDisclosed: true,
      min: minM,
      max: maxM,
      currency: 'COP',
      displayText: `Hasta $${(maxM / 1000000).toFixed(1).replace('.0', '')}M COP / mes`,
      usdEquivalentMin: Math.round(minM / USD_TO_COP_ESTIMATE),
      usdEquivalentMax: Math.round(maxM / USD_TO_COP_ESTIMATE)
    };
  }

  const masDeMillones = /m[aá]s\s*de\s*\$?\s*([0-9]+(?:[\.,][0-9]+)?)\s*(?:millones|millón|m)\b/i;
  const masMatch = text.match(masDeMillones);
  if (masMatch) {
    const minM = parseFloat(masMatch[1].replace(',', '.')) * 1000000;
    const maxM = minM * 1.3;
    return {
      isDisclosed: true,
      min: minM,
      max: maxM,
      currency: 'COP',
      displayText: `Desde $${(minM / 1000000).toFixed(1).replace('.0', '')}M COP / mes`,
      usdEquivalentMin: Math.round(minM / USD_TO_COP_ESTIMATE),
      usdEquivalentMax: Math.round(maxM / USD_TO_COP_ESTIMATE)
    };
  }

  // 2. Full numeric COP Ranges: "$ 2.500.000 a $ 3.500.000", "$3.500.000,00"
  const copFullRange = /\$?\s*([1-9]\d{0,2}(?:\.\d{3})+(?:,\d{2})?)\s*(?:a|-|hasta|\s+y\s+)\s*\$?\s*([1-9]\d{0,2}(?:\.\d{3})+(?:,\d{2})?)/i;
  const copFullRangeMatch = text.match(copFullRange);
  if (copFullRangeMatch) {
    const minVal = parseFloat(copFullRangeMatch[1].replace(/\./g, '').replace(/,/g, '.'));
    const maxVal = parseFloat(copFullRangeMatch[2].replace(/\./g, '').replace(/,/g, '.'));
    if (minVal >= 1000000 && maxVal >= 1000000 && minVal <= 50000000) {
      return {
        isDisclosed: true,
        min: minVal,
        max: maxVal,
        currency: 'COP',
        displayText: `$${(minVal / 1000000).toFixed(1).replace('.0', '')}M - $${(maxVal / 1000000).toFixed(1).replace('.0', '')}M COP / mes`,
        usdEquivalentMin: Math.round(minVal / USD_TO_COP_ESTIMATE),
        usdEquivalentMax: Math.round(maxVal / USD_TO_COP_ESTIMATE)
      };
    }
  }

  const copSinglePattern = /\$?\s*([1-9]\d{0,2}(?:\.\d{3}){2}(?:,\d{2})?)\s*(?:cop|pesos|\/mes|mensual)?/i;
  const copSingleMatch = text.match(copSinglePattern);
  if (copSingleMatch) {
    const val = parseFloat(copSingleMatch[1].replace(/\./g, '').replace(/,/g, '.'));
    if (val >= 1300000 && val <= 50000000) {
      return {
        isDisclosed: true,
        min: val,
        max: val,
        currency: 'COP',
        displayText: `$${(val / 1000000).toFixed(1).replace('.0', '')}M COP / mes`,
        usdEquivalentMin: Math.round(val / USD_TO_COP_ESTIMATE),
        usdEquivalentMax: Math.round(val / USD_TO_COP_ESTIMATE)
      };
    }
  }

  // 3. Pattern for USD Range or Single: "$1,500 - $2,500 USD", "$2300 - 2800 USD/mes"
  const usdRangePattern = /\$?\s*([1-9]\d{2,3}(?:,\d{3})?)\s*(?:a|-|to)\s*\$?\s*([1-9]\d{2,3}(?:,\d{3})?)\s*(?:usd|d[oó]lares|\/mes|monthly|neto)/i;
  const usdRangeMatch = text.match(usdRangePattern);
  if (usdRangeMatch) {
    const minUsd = parseFloat(usdRangeMatch[1].replace(/,/g, ''));
    const maxUsd = parseFloat(usdRangeMatch[2].replace(/,/g, ''));
    if (minUsd >= 400 && maxUsd <= 25000) {
      return {
        isDisclosed: true,
        min: minUsd,
        max: maxUsd,
        currency: 'USD',
        displayText: `$${minUsd.toLocaleString()} - $${maxUsd.toLocaleString()} USD / mes`,
        usdEquivalentMin: minUsd,
        usdEquivalentMax: maxUsd
      };
    }
  }

  // If no explicit salary detected in the raw vacancy text
  return {
    isDisclosed: false,
    displayText: 'No especificado en la vacante'
  };
}
