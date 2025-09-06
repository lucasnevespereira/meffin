import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function RootPage() {
  // Detect user's preferred language from Accept-Language header
  const headersList = headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Simple language detection
  const prefersFrench = acceptLanguage.includes('fr');
  const locale = prefersFrench ? 'fr' : 'en';
  
  // Redirect to the appropriate locale
  redirect(`/${locale}`);
}