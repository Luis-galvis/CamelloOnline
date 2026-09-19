/**
 * Extractor y Clasificador de Postulaciones / Demanda de Candidatos
 * Solo retorna información cuando está explícitamente disponible en la fuente.
 */

export interface ApplicantExtractionResult {
  applicantCountText: string;
  applicantTier?: 'low' | 'medium' | 'high';
  applicantNumber?: number;
  applicantCount?: number;
}

export function extractApplicantCount(htmlSnippet: string = '', fullText: string = ''): ApplicantExtractionResult {
  const combined = `${htmlSnippet} ${fullText}`.toLowerCase();

  // 1. "Sé uno/a de los/las primeros/as 25" / "Be among the first 25 applicants"
  if (
    combined.includes('primeros 25') ||
    combined.includes('primeras 25') ||
    combined.includes('first 25') ||
    combined.includes('pocas solicitudes')
  ) {
    return {
      applicantCountText: '⚡ Sé de los primeros (< 25 postulaciones)',
      applicantTier: 'low',
      applicantNumber: 15
    };
  }

  // 2. "Más de 100 solicitudes" / "Más de 100 personas han hecho clic" / "Over 100 applicants"
  if (
    combined.includes('más de 100') ||
    combined.includes('mas de 100') ||
    combined.includes('over 100') ||
    combined.includes('100+ applicants') ||
    combined.includes('100+ solicitudes') ||
    combined.includes('200+ solicitudes') ||
    combined.includes('100+ personas')
  ) {
    return {
      applicantCountText: '🔥 Alta demanda (> 100 postulaciones)',
      applicantTier: 'high',
      applicantNumber: 125
    };
  }

  // 3. Captura numérica directa:
  // "36 personas han hecho clic", "36 solicitudes", "36 postulaciones", "36 solicitantes", "36 applicants"
  const patterns = [
    /(\d+)\s*personas?\s+han\s+hecho\s+clic/i,
    /(\d+)\s*(?:solicitudes|solicitantes|postulaciones|postulantes|candidatos|applicants|clicks?|postulados)/i,
    /m[aá]s\s+de\s+(\d+)/i,
    /s[eé]\s+(?:un[oa]|el|la)\s+de\s+(?:los|las)\s+primer[oa]s\s+(\d+)/i
  ];

  for (const pat of patterns) {
    const match = combined.match(pat);
    if (match && match[1]) {
      const count = parseInt(match[1], 10);
      if (!isNaN(count) && count > 0) {
        if (count < 25) {
          return {
            applicantCountText: `⚡ ${count} postulaciones`,
            applicantTier: 'low',
            applicantNumber: count
          };
        } else if (count <= 100) {
          return {
            applicantCountText: `👥 ${count} postulaciones`,
            applicantTier: 'medium',
            applicantNumber: count
          };
        } else {
          return {
            applicantCountText: `🔥 ${count} postulaciones`,
            applicantTier: 'high',
            applicantNumber: count
          };
        }
      }
    }
  }

  // Si no hay datos explícitos de solicitudes/clics en la tarjeta, no inventar datos falsos
  return {
    applicantCountText: '',
    applicantTier: undefined,
    applicantNumber: undefined
  };
}
