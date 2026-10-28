import { Fragment, type ReactNode } from 'react';
import { CopyConnectorUrl } from '@/components/ai/CopyConnectorUrl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function Steps({ steps }: { steps: ReactNode[] }) {
  return <ol className="space-y-4 text-sm text-muted-foreground">
    {steps.map((step, index) => <li key={index} className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{index + 1}</span>
      <div className="min-w-0 flex-1 space-y-2 pt-1">{step}</div>
    </li>)}
  </ol>;
}

// Button labels match the providers' UI as of 2026-10 (Claude docs, chatgpt.com/plugins screenshots). Keep the English label next to the French
// one: many French users run Claude or ChatGPT in English.
export function ProviderSetupSteps({ locale, endpoint }: { locale: string; endpoint: string }) {
  const french = locale === 'fr';
  const label = (fr: string, en = fr) => <strong className="font-semibold text-foreground">{french && fr !== en ? `${fr} (${en})` : en}</strong>;
  const link = (href: string, text: string) => <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{text} ↗</a>;
  const note = (children: ReactNode) => <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">{children}</p>;
  const url = <CopyConnectorUrl endpoint={endpoint} locale={locale} />;

  const claude = [
    <p key="s1">{french ? 'Ouvrez ' : 'Open '}{link('https://claude.ai/customize/connectors', french ? 'Personnaliser → Connecteurs' : 'Customize → Connectors')}.</p>,
    <p key="s2">{french ? <>Cliquez sur {label('+ Ajouter', '+ Add')} puis {label('Ajouter un connecteur personnalisé', 'Add custom connector')}.</> : <>Click {label('+ Add')}, then {label('Add custom connector')}.</>}</p>,
    <><p>{french ? <>Nommez-le {label('Meffin')} et collez cette adresse dans le champ URL :</> : <>Name it {label('Meffin')} and paste this address as the URL:</>}</p>{url}</>,
    <p key="s3">{french ? <>Cliquez sur Continuer, choisissez {label('Se connecter maintenant', 'Sign in now')}, puis cliquez sur {label('Ajouter', 'Add')}. Ne touchez pas aux autres options.</> : <>Click Continue, choose {label('Sign in now')}, then click {label('Add')}. Leave the other options as they are.</>}</p>,
    <p key="s4">{french ? <>Une page Meffin s’ouvre : connectez-vous, puis cliquez sur {label('Autoriser')}.</> : <>A Meffin page opens: sign in, then click {label('Allow access')}.</>}</p>,
    <p key="s5">{french ? <>Dans une conversation, cliquez sur {label('+')} → {label('Connecteurs', 'Connectors')} et activez Meffin.</> : <>In a chat, click {label('+')} → {label('Connectors')} and turn Meffin on.</>}</p>,
  ];

  const chatgpt = [
    <p key="s6">{french ? <>Sur un ordinateur, ouvrez {link('https://chatgpt.com/plugins', 'chatgpt.com/plugins')} dans votre navigateur. L’ajout depuis l’application ChatGPT sur ordinateur ne fonctionne pas.</> : <>On a computer, open {link('https://chatgpt.com/plugins', 'chatgpt.com/plugins')} in your browser. Adding it from the ChatGPT desktop app won’t work.</>}</p>,
    <p key="s7">{french ? <>Cliquez sur {label('+')} puis {label('Ajouter un serveur MCP personnalisé', 'Add custom MCP server')}.</> : <>Click {label('+')}, then {label('Add custom MCP server')}.</>}</p>,
    <Fragment key="s8"><p>{french ? <>Nommez-le {label('Meffin')} et collez cette adresse sous {label('Connexion', 'Connection')} :</> : <>Name it {label('Meffin')} and paste this address under {label('Connection')}:</>}</p>{url}</Fragment>,
    <p key="s9">{french ? <>Ne changez rien d’autre. Cochez {label('Je comprends et je veux continuer', 'I understand and want to continue')}, puis cliquez sur {label('Créer comme plugin', 'Create as a plugin')}.</> : <>Don’t change anything else. Tick {label('I understand and want to continue')}, then click {label('Create as a plugin')}.</>}</p>,
    <p key="s10">{french ? <>Quand ChatGPT vous envoie sur Meffin, connectez-vous et cliquez sur {label('Autoriser')}.</> : <>When ChatGPT sends you to Meffin, sign in and click {label('Allow access')}.</>}</p>,
    <p key="s11">{french ? <>Dans une nouvelle conversation, tapez {label('@')} et choisissez Meffin.</> : <>In a new chat, type {label('@')} and pick Meffin.</>}</p>,
  ];

  const panel = 'space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card data-[state=inactive]:hidden';
  return <section className="space-y-5">
    <div>
      <h2 className="font-display text-2xl font-semibold">{french ? 'Ajoutez Meffin à votre assistant' : 'Add Meffin to your assistant'}</h2>
      <p className="text-sm text-muted-foreground">{french ? 'Environ deux minutes, une seule fois. Faites-le depuis un ordinateur : le connecteur suit ensuite votre compte.' : 'About two minutes, once. Do it from a computer: the connector then follows your account.'}</p>
    </div>
    <Tabs defaultValue="claude" className="gap-4">
      <TabsList className="h-11 w-full sm:w-fit">
        <TabsTrigger value="claude" className="px-5">Claude</TabsTrigger>
        <TabsTrigger value="chatgpt" className="px-5">ChatGPT</TabsTrigger>
      </TabsList>
      {/* forceMount keeps both guides in the server HTML for search engines and in-page find. */}
      <TabsContent value="claude" forceMount className={panel}>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{french ? 'Recommandé · forfait gratuit inclus' : 'Recommended · works on Free'}</p>
        <Steps steps={claude} />
        {note(<>{french ? 'Le forfait gratuit permet un connecteur personnalisé. Sur Team ou Enterprise, le propriétaire ajoute Meffin dans ' : 'The Free plan allows one custom connector. On Team or Enterprise, an owner adds Meffin in '}{link('https://claude.ai/admin-settings/connectors', french ? 'Paramètres de l’organisation → Connecteurs' : 'Organization settings → Connectors')}{french ? ', puis chaque membre clique sur Connecter.' : ', then each member clicks Connect.'}</>)}
        {link('https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp', french ? 'Guide officiel Claude' : 'Official Claude guide')}
      </TabsContent>
      <TabsContent value="chatgpt" forceMount className={panel}>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{french ? 'Forfait payant requis' : 'Paid plan required'}</p>
        <Steps steps={chatgpt} />
        {note(french ? 'Pas d’option « Ajouter un serveur MCP personnalisé » ? Votre forfait ou l’administrateur de votre espace ne l’autorise pas encore. Dans ce cas, utilisez Claude.' : 'No “Add custom MCP server” option? Your plan or workspace admin doesn’t allow it yet. Use Claude instead.')}
        {link('https://developers.openai.com/apps-sdk/deploy/connect-chatgpt', french ? 'Guide officiel ChatGPT' : 'Official ChatGPT guide')}
      </TabsContent>
    </Tabs>
  </section>;
}
