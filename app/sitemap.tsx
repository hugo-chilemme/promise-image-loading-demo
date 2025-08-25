import type { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.zerod.fr/',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
  ]
}