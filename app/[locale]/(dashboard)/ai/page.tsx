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

      <section className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-card">
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary font-semibold">1</span>
          <div><h2 className="font-semibold">{french ? 'Copiez votre adresse Meffin' : 'Copy your Meffin address'}</h2>
            <p className="text-sm text-muted-foreground">{french ? 'Il s’agit de l’adresse du connecteur, pas de votre mot de passe.' : 'This is the connector address, not your password.'}</p></div></div>
        <AiConnections endpoint={mcpResource} connections={connections} locale={locale} />
      </section>

      <ProviderSetupSteps locale={locale} />

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-card">
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary font-semibold">3</span>
          <div><h2 className="font-semibold">{french ? 'Essayez une question' : 'Try a question'}</h2>
            <p className="text-sm text-muted-foreground">{french ? 'Activez Meffin dans votre conversation et essayez :' : 'Enable Meffin in your conversation and try:'}</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2 pl-12 text-sm">
          <blockquote className="rounded-xl bg-muted/50 p-4">{french ? '« Où ai-je le plus dépensé ce mois-ci, et comment économiser ? »' : '“Where did I spend most this month, and how could I save?”'}</blockquote>
          <blockquote className="rounded-xl bg-muted/50 p-4">{french ? '« Prépare une liste de courses pour 60 € et enregistre-la dans Meffin. »' : '“Plan groceries for €60 and save the list in Meffin.”'}</blockquote>
        </div>
      </section>

    </div>
  );
}
