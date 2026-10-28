import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = (process.env.NEXT_PUBLIC_APP_URL || 'https://meffin.app').replace(/\/$/, '');
  return ['en', 'fr'].map((locale) => ({
    url: `${origin}/${locale}/ai-connector`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));
}
