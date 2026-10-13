import { MetadataRoute } from 'next';
import { INITIAL_JOB_POSTS } from '@/lib/mock-data';

export default function sitemap(): MetadataRoute.Sitemap {
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

  // 2. Individual verified job detail pages for Google indexation
  const seenUrls = new Set<string>();
  const jobRoutes: MetadataRoute.Sitemap = [];

  for (const job of INITIAL_JOB_POSTS) {
    if (!job.slug) continue;
    const jobUrl = `${baseUrl}/jobs/${job.slug}`;
    if (seenUrls.has(jobUrl)) continue;
    seenUrls.add(jobUrl);

    jobRoutes.push({
      url: jobUrl,
      lastModified: job.createdAt ? new Date(job.createdAt) : lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  return [...mainRoutes, ...jobRoutes];
}
