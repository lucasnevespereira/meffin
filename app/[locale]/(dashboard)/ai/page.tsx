import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { auth, mcpResource } from '@/lib/auth';
import { db } from '@/lib/db';
import { oauthClient, oauthConsent } from '@/lib/db/schema';
import { AiConnections } from './ui';

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

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-card">
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary font-semibold">2</span>
          <div><h2 className="font-semibold">{french ? 'Ajoutez le connecteur à Claude' : 'Add the connector to Claude'}</h2>
            <p className="text-sm text-muted-foreground">{french ? 'Dans Claude : Personnaliser → Connecteurs → Ajouter → Connecteur personnalisé. Donnez-lui le nom Meffin et collez l’adresse.' : 'In Claude: Customize → Connectors → Add → Custom connector. Name it Meffin and paste the address.'}</p></div></div>
        <p className="pl-12 text-sm text-muted-foreground">{french ? 'Choisissez la connexion avec votre compte Meffin quand Claude le demande, puis autorisez les accès.' : 'Choose sign in with your Meffin account when Claude asks, then review and allow access.'}</p>
        <a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" target="_blank" rel="noopener noreferrer" className="pl-12 text-sm font-medium text-primary hover:underline">{french ? 'Guide de Claude ↗' : 'Claude setup guide ↗'}</a>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-card">
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary font-semibold">3</span>
          <div><h2 className="font-semibold">{french ? 'Essayez une question' : 'Try a question'}</h2>
            <p className="text-sm text-muted-foreground">{french ? 'Activez Meffin dans votre conversation et essayez :' : 'Enable Meffin in your conversation and try:'}</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2 pl-12 text-sm">
          <blockquote className="rounded-xl bg-muted/50 p-4">{french ? '« Où ai-je le plus dépensé ce mois-ci, et comment économiser ? »' : '“Where did I spend most this month, and how could I save?”'}</blockquote>
          <blockquote className="rounded-xl bg-muted/50 p-4">{french ? '« Prépare une liste de courses pour 60 € et enregistre-la dans Meffin. »' : '“Plan groceries for €60 and save the list in Meffin.”'}</blockquote>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground space-y-2">
        <h2 className="font-semibold text-foreground">ChatGPT</h2>
        <p>{french ? 'Vous pouvez aussi ajouter cette adresse comme serveur MCP personnalisé dans un espace ChatGPT compatible. Les actions d’écriture, comme enregistrer une liste, dépendent actuellement des paramètres et du forfait de votre espace.' : 'You can also add this address as a custom MCP server in an eligible ChatGPT workspace. Write actions such as saving a list currently depend on your workspace plan and settings.'}</p>
        <a href="https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{french ? 'Guide de ChatGPT ↗' : 'ChatGPT setup guide ↗'}</a>
      </section>
    </div>
  );
}
