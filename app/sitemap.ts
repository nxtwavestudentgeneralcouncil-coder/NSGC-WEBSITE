import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nsgc-sigma.vercel.app'
  
  const routes = [
    '',
    '/achievements',
    '/announcements',
    '/clubs',
    '/complaints',
    '/elections',
    '/events',
    '/feedback',
    '/gallery',
    '/login',
    '/signup',
    '/marketplace',
    '/members',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))
 
  return routes
}
