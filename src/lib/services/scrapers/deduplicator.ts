import { ColombiaScrapedJob } from './types';

export function normalizeCompanyName(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(s\.?a\.?s\.?|s\.?a\.?|ltd\.?|ltda\.?|inc\.?|corp\.?|llc|technologies|solutions|colombia|group)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function normalizeJobTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(junior|jr\.?|semi[\s-]?senior|ssr|entry[\s-]?level|trainee|practicante|pasant[ií]a|remoto|remote|h[ií]brido|presencial|bogot[aá]|medell[ií]n|cali|colombia)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function generateJobFingerprint(job: { companyName: string; title: string; locationCity?: string; sourceUrl?: string }): string {
  const normComp = normalizeCompanyName(job.companyName);
  const normTitle = normalizeJobTitle(job.title);
  
  if (normComp && normTitle) {
    return `${normComp}:::${normTitle}`;
  }
  
  // Fallback to URL or raw slug
  return job.sourceUrl || `${normComp}:::${job.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

export function deduplicateColombiaJobs(jobs: ColombiaScrapedJob[]): ColombiaScrapedJob[] {
  const seenMap = new Map<string, ColombiaScrapedJob>();

  for (const job of jobs) {
    const fingerprint = generateJobFingerprint(job);
    const existing = seenMap.get(fingerprint);

    if (!existing) {
      seenMap.set(fingerprint, job);
    } else {
      // Choose the richer job post
      let preferNew = false;

      // Prefer post with disclosed salary
      if (job.salaryDisclosed && !existing.salaryDisclosed) {
        preferNew = true;
      }
      // Prefer post with longer description
      else if (!existing.salaryDisclosed && job.description.length > existing.description.length) {
        preferNew = true;
      }
      // Prefer direct ATS / LinkedIn over general scrapers
      else if ((job.source === 'greenhouse' || job.source === 'lever' || job.source === 'ashby') && (existing.source === 'computrabajo' || existing.source === 'elempleo')) {
        preferNew = true;
      }

      if (preferNew) {
        seenMap.set(fingerprint, job);
      }
    }
  }

  return Array.from(seenMap.values());
}
