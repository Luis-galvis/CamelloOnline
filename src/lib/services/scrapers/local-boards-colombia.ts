import { ColombiaScrapedJob } from './types';

/**
 * Scraper de Bolsas de Empleo Locales y Cajas de Compensación Familiar.
 * Para evitar enlaces genéricos de portadas, solo se retornan vacantes con URLs individuales activas.
 */
export async function scrapeLocalBoardsColombia(): Promise<ColombiaScrapedJob[]> {
  return [];
}
