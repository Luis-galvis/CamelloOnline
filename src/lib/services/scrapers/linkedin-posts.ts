import { ColombiaScrapedJob } from './types';

/**
 * Módulo de Publicaciones de LinkedIn.
 * Desactivado para garantizar que el 100% de las vacantes provengan exclusivamente
 * de ofertas reales y verificadas de las APIs oficiales y scrapers en vivo
 * (LinkedIn Jobs, Computrabajo, ElEmpleo, Greenhouse, Lever, Ashby, WeRemoto, GetOnBrd).
 */
export async function scrapeLinkedInPosts(): Promise<ColombiaScrapedJob[]> {
  return [];
}
