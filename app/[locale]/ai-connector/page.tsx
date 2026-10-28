import type { Metadata } from 'next';
import Link from 'next/link';
import { Mascot } from '@/components/shared/Mascot';
import { CopyConnectorUrl } from '@/components/ai/CopyConnectorUrl';
import { mcpResource } from '@/lib/mcp/config';
import { ProviderSetupSteps } from '@/components/ai/ProviderSetupSteps';
import { SetupHelp } from '@/components/ai/SetupHelp';
import { TryPrompts } from '@/components/ai/TryPrompts';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const origin = (process.env.NEXT_PUBLIC_APP_URL || 'https://meffin.app').replace(/\/$/, '');
  const french = locale === 'fr';
  const title = french ? 'Gérez votre budget avec Claude et ChatGPT | Meffin' : 'Manage your budget with Claude and ChatGPT | Meffin';
  const description = french
    ? 'Connectez Meffin à un assistant IA pour comprendre vos dépenses et enregistrer vos listes de courses, avec connexion sécurisée et contrôle des accès.'
    : 'Connect Meffin to an AI assistant to understand spending and save grocery plans, with secure sign-in and control over access.';
  return { title, description, alternates: {
    canonical: `${origin}/${locale}/ai-connector`,
    languages: { en: `${origin}/en/ai-connector`, fr: `${origin}/fr/ai-connector` },
  }, openGraph: { title, description, url: `${origin}/${locale}/ai-connector`, type: 'website' } };
}

export default async function AiConnectorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const french = locale === 'fr';
  const setup = `/${locale}/ai`;
  return <main className="min-h-screen bg-background text-foreground">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link href={`/${locale}`} className="font-display text-xl font-bold">Meffin</Link>
      <div className="flex items-center gap-4 text-sm">
        <Link href={french ? '/en/ai-connector' : '/fr/ai-connector'} className="text-muted-foreground hover:text-foreground">{french ? 'English' : 'Français'}</Link>
        <Link href={`/${locale}/login`} className="rounded-lg border border-border px-4 py-2 font-semibold hover:bg-muted">{french ? 'Connexion' : 'Sign in'}</Link>
      </div>
    </header>

    <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:pt-24">
      <div className="space-y-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Meffin + AI</p>
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">{french ? 'Parlez de votre budget comme vous en avez envie.' : 'Talk about your budget in your own words.'}</h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{french ? 'Demandez où part votre argent, explorez des idées pour économiser et créez une liste de courses avec un budget cible. Vos données restent organisées dans Meffin.' : 'Ask where your money goes, explore ways to save, and create a grocery list with a target budget. Your data stays organized in Meffin.'}</p>
        <ol className="max-w-xl space-y-1 text-sm text-muted-foreground">
          <li><span className="font-semibold text-foreground">1.</span> {french ? 'Copiez l’adresse Meffin ci-dessous.' : 'Copy the Meffin address below.'}</li>
          <li><span className="font-semibold text-foreground">2.</span> {french ? 'Ajoutez-la comme connecteur personnalisé dans Claude ou ChatGPT.' : 'Add it as a custom connector in Claude or ChatGPT.'}</li>
          <li><span className="font-semibold text-foreground">3.</span> {french ? 'Connectez-vous à Meffin et autorisez l’accès. C’est tout.' : 'Sign in to Meffin and approve access. That’s it.'}</li>
        </ol>
        <div className="max-w-xl"><CopyConnectorUrl endpoint={mcpResource} locale={locale} /></div>
        <div className="flex flex-wrap gap-3">
          <a href="#setup" className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90">{french ? 'Voir le guide pas à pas' : 'Step-by-step guide'}</a>
          <Link href={setup} className="rounded-xl border border-border px-6 py-3 font-semibold hover:bg-muted">{french ? 'Gérer mes connexions' : 'Manage connections'}</Link>
        </div>
        <p className="text-xs text-muted-foreground">{french ? 'Fonctionne avec Claude (gratuit inclus) et ChatGPT (forfait payant). Aucun mot de passe à copier.' : 'Works with Claude (Free included) and ChatGPT (paid plans). No password to copy.'}</p>
      </div>
      <div className="relative rounded-3xl border border-border bg-card p-7 shadow-card">
        <div className="absolute -top-8 right-6"><Mascot size={72} /></div>
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">{french ? 'Exemple de conversation' : 'Example conversation'}</p>
        <div className="space-y-4 text-sm">
          <p className="ml-10 rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground">{french ? 'Prépare mes courses de la semaine pour 60 € et enregistre la liste.' : 'Plan this week’s groceries for €60 and save the list.'}</p>
          <div className="mr-10 rounded-2xl rounded-tl-sm bg-muted px-4 py-4 space-y-3">
            <p>{french ? 'Voici une liste estimée à 56,50 €. Je peux l’enregistrer dans Meffin avec un budget cible de 60 €.' : 'Here’s a list estimated at €56.50. I can save it in Meffin with a €60 target budget.'}</p>
            <div className="border-t border-border pt-3 text-muted-foreground">{french ? 'Pain · Fruits · Lait · Légumes · Riz…' : 'Bread · Fruit · Milk · Vegetables · Rice…'}</div>
          </div>
        </div>
      </div>
    </section>

    <div id="setup" className="scroll-mt-6 border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <ProviderSetupSteps locale={locale} endpoint={mcpResource} />
      </div>
    </div>

    <div className="mx-auto max-w-6xl px-5 pt-16"><TryPrompts locale={locale} /></div>

    <div className="mx-auto max-w-3xl px-5 pt-16"><SetupHelp locale={locale} /></div>

    <section className="mx-auto max-w-6xl px-5 py-16 space-y-4">
      <h2 className="font-display text-3xl font-semibold">{french ? 'Vos données, vos choix' : 'Your data, your choice'}</h2>
      <p className="max-w-3xl text-muted-foreground">{french ? 'Une application connectée peut lire les données de budget accessibles à votre compte. Les dépenses privées d’un partenaire restent privées. Les actions sont limitées aux nouvelles listes de courses, et vous pouvez retirer l’accès à tout moment dans Meffin.' : 'A connected app can read budget data available to your account. A partner’s private spending stays private. Actions are limited to new shopping lists, and you can disconnect an app at any time in Meffin.'}</p>
      <p className="max-w-3xl text-sm text-muted-foreground">{french ? 'Aucun mot de passe n’est partagé : vous vous connectez à Meffin et validez l’accès vous-même.' : 'No password is shared: you sign in to Meffin and approve access yourself.'}</p>
      <a href="#setup" className="inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90">{french ? 'Connecter mon assistant' : 'Connect my assistant'}</a>
    </section>
  </main>;
}
