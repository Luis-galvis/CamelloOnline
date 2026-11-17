import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase-server';
import { INITIAL_JOB_POSTS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

let cachedSitemap: { data: MetadataRoute.Sitemap; expiresAt: number } | null = null;
const SITEMAP_TTL_MS = 30 * 60 * 1000; // 30 minutos en memoria

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (cachedSitemap && Date.now() < cachedSitemap.expiresAt) {
    return cachedSitemap.data;
  }

  const baseUrl = 'https://www.camelloonline.com';
  const lastModified = new Date();

  // 1. Main high-priority landing routes
  const mainRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/remoto-colombia`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/ventas-comercial`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mejores-de-la-semana`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/talent`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/claim-job`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // 2. Individual active job detail pages from the live Supabase catalog
  const seenUrls = new Set<string>();
  const jobRoutes: MetadataRoute.Sitemap = [];

  const pushSlug = (slug: string) => {
    if (!slug) return;
    const jobUrl = `${baseUrl}/jobs/${slug}`;
    if (seenUrls.has(jobUrl)) return;
    seenUrls.add(jobUrl);
    jobRoutes.push({
      url: jobUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  };

  let loadedFromDb = false;
  try {
    for (let from = 0; from < 10000; from += 1000) {
      const { data } = await supabaseAdmin
        .from('job_posts')
        .select('slug')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, from + 999);

      if (!data || data.length === 0) break;
      loadedFromDb = true;
      for (const r of data) pushSlug(r.slug);
      if (data.length < 1000) break;
    }
  } catch {
    // fallback al JSON seed
  }

  if (!loadedFromDb) {
    for (const job of INITIAL_JOB_POSTS) pushSlug(job.slug);
  }

  const result = [...mainRoutes, ...jobRoutes];
  if (loadedFromDb) {
    cachedSitemap = { data: result, expiresAt: Date.now() + SITEMAP_TTL_MS };
  }
  return result;
}
