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

// Button labels match the providers' UI as of 2026-10 (Claude docs, ChatGPT screenshots). Keep the English label next to the French
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
    <p key="s3">{french ? <>Cliquez sur Continuer. Choisissez {label('Se connecter maintenant', 'Sign in now')} et gardez {label('l’identité publiée de Claude', 'Use Claude’s published identity')}, puis cliquez sur {label('Ajouter', 'Add')}.</> : <>Click Continue. Choose {label('Sign in now')}, keep {label('Use Claude’s published identity')}, then click {label('Add')}.</>}</p>,
    <p key="s4">{french ? <>Une page Meffin s’ouvre : connectez-vous, puis cliquez sur {label('Autoriser')}.</> : <>A Meffin page opens: sign in, then click {label('Allow access')}.</>}</p>,
    <p key="s5">{french ? <>Dans une conversation, cliquez sur {label('+')} → {label('Connecteurs', 'Connectors')} et activez Meffin.</> : <>In a chat, click {label('+')} → {label('Connectors')} and turn Meffin on.</>}</p>,
  ];

  const chatgpt = [
    <p key="s6">{french ? <>Ouvrez les paramètres de ChatGPT → {label('Plugins')} ({link('https://chatgpt.com/plugins', 'chatgpt.com/plugins')}).</> : <>Open ChatGPT settings → {label('Plugins')} ({link('https://chatgpt.com/plugins', 'chatgpt.com/plugins')}).</>}</p>,
    <p key="s7">{french ? <>Cliquez sur {label('Ajouter', 'Add')} puis {label('Ajouter un serveur MCP', 'Add MCP server')}. Pas « Créer un plugin ».</> : <>Click {label('Add')}, then {label('Add MCP server')}. Not “Create plugin”.</>}</p>,
    <><p>{french ? <>Nommez-le {label('Meffin')}. Dans {label('Type')}, choisissez {label('Streamable HTTP')}.</> : <>Name it {label('Meffin')}. Under {label('Type')}, pick {label('Streamable HTTP')}.</>}</p>
      <p className="text-xs text-destructive">{french ? 'Ne laissez pas STDIO : c’est pour les programmes locaux, Meffin ne vous demanderait jamais de vous connecter.' : 'Don’t leave it on STDIO: that is for local programs, and Meffin would never ask you to sign in.'}</p></>,
    <><p>{french ? <>Collez cette adresse dans le champ {label('URL')} :</> : <>Paste this address in the {label('URL')} field:</>}</p>{url}
      <p>{french ? <>Laissez {label('Bearer token env var')} et les en-têtes vides, puis cliquez sur {label('Enregistrer', 'Save')}. Le formulaire ne demande pas de connexion, c’est normal.</> : <>Leave {label('Bearer token env var')} and the headers empty, then click {label('Save')}. The form does not ask you to sign in, that’s normal.</>}</p></>,
    <p key="s8">{french ? <>Dans l’onglet {label('MCPs')}, cliquez sur {label('Authentifier', 'Authenticate')} à côté de Meffin. Connectez-vous, puis cliquez sur {label('Autoriser')}. Meffin peut afficher « Connecter Codex ? » : c’est normal, c’est le nom utilisé par ChatGPT.</> : <>In the {label('MCPs')} tab, click {label('Authenticate')} next to Meffin. Sign in, then click {label('Allow access')}. Meffin may ask “Connect Codex?”: that’s expected, it’s the name ChatGPT uses.</>}</p>,
    <p key="s9">{french ? <>Dans une nouvelle conversation, tapez {label('@')} et choisissez Meffin.</> : <>In a new chat, type {label('@')} and pick Meffin.</>}</p>,
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
        {note(french ? 'Déjà ajouté en STDIO ? Ouvrez-le dans l’onglet MCPs, cliquez sur Désinstaller (Uninstall) et recommencez. Pas d’option « Ajouter un serveur MCP » ? Votre forfait ou l’administrateur de votre espace ne l’autorise pas encore.' : 'Already added it as STDIO? Open it in the MCPs tab, click Uninstall, and start again. No “Add MCP server” option? Your plan or workspace admin does not allow it yet.')}
        {link('https://learn.chatgpt.com/docs/extend/mcp?surface=app', french ? 'Guide officiel ChatGPT' : 'Official ChatGPT guide')}
      </TabsContent>
    </Tabs>
  </section>;
}
