import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { mcpResource } from '@/lib/mcp/config';
import { db } from '@/lib/db';
import { oauthClient, oauthConsent } from '@/lib/db/schema';
import { AiConnections } from './ui';
import { ProviderSetupSteps } from '@/components/ai/ProviderSetupSteps';
import { SetupHelp } from '@/components/ai/SetupHelp';
import { TryPrompts } from '@/components/ai/TryPrompts';

export default async function AiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const french = locale === 'fr';
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${locale}/login`);
  const allConnections = await db.select({ id: oauthConsent.id, name: oauthClient.name, clientId: oauthClient.clientId })
    .from(oauthConsent).innerJoin(oauthClient, eq(oauthConsent.clientId, oauthClient.clientId))
    .where(eq(oauthConsent.userId, session.user.id));
  const connections = allConnections.filter((connection, index) =>
    allConnections.findIndex((candidate) => candidate.clientId === connection.clientId) === index);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-12">
      <div className="space-y-2">
        <Link href={`/${locale}/profile`} className="text-sm text-muted-foreground hover:text-foreground">← {french ? 'Profil' : 'Profile'}</Link>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Meffin + AI</p>
        <h1 className="font-display text-3xl font-semibold">{french ? 'Votre budget, dans vos conversations' : 'Your budget, in your conversations'}</h1>
        <p className="text-muted-foreground">{french ? 'Posez des questions sur vos finances et enregistrez des listes de courses depuis un assistant IA.' : 'Ask questions about your finances and save shopping plans from an AI assistant.'}</p>
      </div>

      <ProviderSetupSteps locale={locale} endpoint={mcpResource} />

      <TryPrompts locale={locale} />

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <AiConnections connections={connections} locale={locale} />
      </section>

      <SetupHelp locale={locale} />
    </div>
  );
}
