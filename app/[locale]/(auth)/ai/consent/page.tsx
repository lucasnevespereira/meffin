import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { verifyOAuthQueryParams } from '@better-auth/oauth-provider';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { oauthClient } from '@/lib/db/schema';
import { ConsentChoices } from './choices';

export default async function ConsentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: pathLocale } = await params;
  const values = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.append(key, value);
  }
  const { secret } = await auth.$context;
  if (!await verifyOAuthQueryParams(query.toString(), secret)) {
    return <p className="text-sm text-destructive">This connection request has expired. Start again from your AI app.</p>;
  }

  const requestHeaders = await headers();
  const locale = pathLocale === 'en' && requestHeaders.get('accept-language')?.toLowerCase().startsWith('fr') ? 'fr' : pathLocale;
  if (locale !== pathLocale) redirect(`/${locale}/ai/consent?${query.toString()}`);

  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect(`/${locale}/login?${query.toString()}`);

  const clientId = query.get('client_id');
  const [client] = clientId
    ? await db.select({ name: oauthClient.name, clientId: oauthClient.clientId })
        .from(oauthClient).where(eq(oauthClient.clientId, clientId)).limit(1)
    : [];
  if (!client) {
    return <p className="text-sm text-destructive">This AI app could not be verified. Start the connection again.</p>;
  }

  return <ConsentChoices clientName={client.name || client.clientId} accountEmail={session.user.email}
    canWrite={query.get('scope')?.split(' ').includes('meffin:write') ?? false}
    sharesIdentity={query.get('scope')?.split(' ').some((scope) => scope === 'email' || scope === 'profile') ?? false}
    locale={locale} />;
}
