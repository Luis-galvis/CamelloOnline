import rawColombiaJobs from '@/lib/scraped-colombia-jobs.json';
import { INITIAL_JOB_POSTS } from '@/lib/mock-data';
import { JobPost } from '@/types';

export function getJobBySlug(slug: string): JobPost | null {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug).toLowerCase().trim();
  
  // 1. Try finding in INITIAL_JOB_POSTS
  const foundInInitial = INITIAL_JOB_POSTS.find(
    j => (j.slug && j.slug.toLowerCase() === decoded) ||
         (j.id && j.id.toLowerCase() === decoded)
  );
  if (foundInInitial) return foundInInitial;

  // 2. Try finding in rawColombiaJobs
  const rawList = (rawColombiaJobs as any[]) || [];
  const foundInRaw = rawList.find(
    j => (j.slug && j.slug.toLowerCase() === decoded) ||
         (j.id && j.id.toLowerCase() === decoded) ||
         (j.slug && decoded.length >= 8 && j.slug.endsWith(decoded.slice(-8)))
  );
  if (foundInRaw) {
    const rawMatch = INITIAL_JOB_POSTS.find(j => j.id === foundInRaw.id);
    if (rawMatch) return rawMatch;
  }

  return null;
}

export function getAllJobSlugs(): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];

  for (const j of INITIAL_JOB_POSTS) {
    if (j.slug && !seen.has(j.slug)) {
      seen.add(j.slug);
      slugs.push(j.slug);
    }
  }

  return slugs;
}
