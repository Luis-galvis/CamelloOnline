import { ColombiaScrapedJob } from './types';
import { scrapeLinkedInColombia } from './linkedin-colombia';
import { scrapeLinkedInPosts } from './linkedin-posts';
import { scrapeWeRemotoColombia } from './weremoto-colombia';
import { scrapeComputrabajoColombia } from './computrabajo-colombia';
import { scrapeElEmpleoColombia } from './elempleo-colombia';
import { scrapeAtsColombiaJobs } from './ats-colombia';
import { scrapeGetOnBoardColombia } from './getonboard-colombia';
import { scrapeTorreColombia } from './torre-colombia';
import { scrapeRemotiveColombia } from './remotive-colombia';
import { scrapeSalesAndCommercialColombia } from './sales-commercial-colombia';
import { scrapeJoobleColombia } from './jooble-colombia';
import { scrapeLocalBoardsColombia } from './local-boards-colombia';
import { deduplicateColombiaJobs } from './deduplicator';

export * from './types';
export * from './english-detector';
export * from './salary-extractor';
export * from './location-normalizer';
export * from './deduplicator';
export * from './sales-commercial-colombia';
export * from './linkedin-posts';
export * from './weremoto-colombia';

export interface ScrapeAggregationReport {
  timestamp: string;
  totalRawFound: number;
  totalDeduplicatedColombiaJobs: number;
  sourcesBreakdown: {
    linkedin: number;
    linkedinPosts: number;
    weremoto: number;
    computrabajo: number;
    elempleo: number;
    getonbrd: number;
    remotive: number;
    torre: number;
    ats: number;
    salesCommercial: number;
    jooble: number;
    localBoards: number;
  };
  englishBreakdown: {
    requiresEnglish: number;
    noEnglishRequired: number;
  };
  remoteCount: number;
  ibagueCount: number;
  locationsBreakdown: Record<string, number>;
  jobs: ColombiaScrapedJob[];
}

export async function aggregateAllColombiaJobs(): Promise<ScrapeAggregationReport> {
  console.log('🇨🇴 [REALJOBS] Iniciando agregación masiva expandida de vacantes (LinkedIn Jobs + Recruiter Posts + WeRemoto/WorkRemoto + Computrabajo + ElEmpleo + ATSs + Ventas)...');

  const [
    linkedinJobs, 
    linkedinPostsJobs,
    weremotoJobs,
    computrabajoJobs, 
    elempleoJobs, 
    getOnBrdJobs, 
    remotiveJobs, 
    torreJobs, 
    atsJobs,
    salesJobs,
    joobleJobs,
    localBoardsJobs
  ] = await Promise.allSettled([
    scrapeLinkedInColombia(),
    scrapeLinkedInPosts(),
    scrapeWeRemotoColombia(),
    scrapeComputrabajoColombia(),
    scrapeElEmpleoColombia(),
    scrapeGetOnBoardColombia(),
    scrapeRemotiveColombia(),
    scrapeTorreColombia(),
    scrapeAtsColombiaJobs(),
    scrapeSalesAndCommercialColombia(),
    scrapeJoobleColombia(),
    scrapeLocalBoardsColombia()
  ]);

  const rawLinkedin = linkedinJobs.status === 'fulfilled' ? linkedinJobs.value : [];
  const rawLinkedinPosts = linkedinPostsJobs.status === 'fulfilled' ? linkedinPostsJobs.value : [];
  const rawWeRemoto = weremotoJobs.status === 'fulfilled' ? weremotoJobs.value : [];
  const rawComputrabajo = computrabajoJobs.status === 'fulfilled' ? computrabajoJobs.value : [];
  const rawElEmpleo = elempleoJobs.status === 'fulfilled' ? elempleoJobs.value : [];
  const rawGetOnBrd = getOnBrdJobs.status === 'fulfilled' ? getOnBrdJobs.value : [];
  const rawRemotive = remotiveJobs.status === 'fulfilled' ? remotiveJobs.value : [];
  const rawTorre = torreJobs.status === 'fulfilled' ? torreJobs.value : [];
  const rawAts = atsJobs.status === 'fulfilled' ? atsJobs.value : [];
  const rawSales = salesJobs.status === 'fulfilled' ? salesJobs.value : [];
  const rawJooble = joobleJobs.status === 'fulfilled' ? joobleJobs.value : [];
  const rawLocalBoards = localBoardsJobs.status === 'fulfilled' ? localBoardsJobs.value : [];

  const combinedRaw = [
    ...rawLinkedin, 
    ...rawLinkedinPosts,
    ...rawWeRemoto,
    ...rawComputrabajo, 
    ...rawElEmpleo, 
    ...rawGetOnBrd, 
    ...rawRemotive,
    ...rawTorre, 
    ...rawAts,
    ...rawSales,
    ...rawJooble,
    ...rawLocalBoards
  ];
  
  console.log(`📦 Vacantes brutas recolectadas en total: ${combinedRaw.length}`);

  // Deduplication
  const deduplicated = deduplicateColombiaJobs(combinedRaw);
  console.log(`✨ Vacantes únicas deduplicadas para Colombia: ${deduplicated.length}`);

  // Calculate Breakdown metrics
  const locMap: Record<string, number> = {};
  let reqEng = 0;
  let noEng = 0;
  let remoteCount = 0;
  let ibagueCount = 0;

  for (const j of deduplicated) {
    locMap[j.locationCity] = (locMap[j.locationCity] || 0) + 1;
    if (j.requiresEnglish) reqEng++;
    else noEng++;
    if (j.isRemote || j.workModality === 'remote_country' || j.workModality === 'remote_worldwide') remoteCount++;
    if (
      j.locationFilterKey === 'ibague' || 
      (j.locationCity || '').toLowerCase().includes('ibag') || 
      (j.displayLocation || '').toLowerCase().includes('ibag') ||
      (j.locationDepartment || '').toLowerCase().includes('tolima')
    ) {
      ibagueCount++;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalRawFound: combinedRaw.length,
    totalDeduplicatedColombiaJobs: deduplicated.length,
    sourcesBreakdown: {
      linkedin: rawLinkedin.length,
      linkedinPosts: rawLinkedinPosts.length,
      weremoto: rawWeRemoto.length,
      computrabajo: rawComputrabajo.length,
      elempleo: rawElEmpleo.length,
      getonbrd: rawGetOnBrd.length,
      remotive: rawRemotive.length,
      torre: rawTorre.length,
      ats: rawAts.length,
      salesCommercial: rawSales.length,
      jooble: rawJooble.length,
      localBoards: rawLocalBoards.length
    },
    englishBreakdown: {
      requiresEnglish: reqEng,
      noEnglishRequired: noEng
    },
    remoteCount,
    ibagueCount,
    locationsBreakdown: locMap,
    jobs: deduplicated
  };
}
