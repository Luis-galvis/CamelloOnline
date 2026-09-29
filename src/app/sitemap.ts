import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.camelloonline.com';
  const lastModified = new Date();

  // Main high-priority landing routes
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

  return mainRoutes;
}
