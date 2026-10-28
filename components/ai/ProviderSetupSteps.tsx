export function ProviderSetupSteps({ locale }: { locale: string }) {
  const french = locale === 'fr';
  return <section className="space-y-4">
    <div>
      <h2 className="font-display text-2xl font-semibold">{french ? 'Choisissez votre assistant' : 'Choose your assistant'}</h2>
      <p className="text-sm text-muted-foreground">{french ? 'L’ajout du connecteur se fait une seule fois. Meffin vous demandera ensuite de vous connecter et d’autoriser l’accès.' : 'You add the connector once. Meffin will then ask you to sign in and approve access.'}</p>
    </div>
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{french ? 'Recommandé pour commencer' : 'Recommended to start'}</p>
          <h3 className="mt-1 font-display text-xl font-semibold">Claude</h3></div>
        <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
          <li>{french ? 'Ouvrez Claude → Personnaliser → Connecteurs.' : 'Open Claude → Customize → Connectors.'}</li>
          <li>{french ? 'Choisissez Ajouter → Connecteur personnalisé (Web).' : 'Choose Add → Custom connector (Web).'}</li>
          <li>{french ? 'Nommez-le Meffin et collez l’adresse copiée ci-dessus.' : 'Name it Meffin and paste the URL copied above.'}</li>
          <li>{french ? 'Choisissez la connexion avec votre compte. Si Claude propose son identité publiée, gardez cette option.' : 'Choose sign-in. If Claude offers its published client identity, keep that option.'}</li>
          <li>{french ? 'Connectez-vous à Meffin et validez les accès affichés.' : 'Sign in to Meffin and approve the access shown.'}</li>
          <li>{french ? 'Dans une conversation, activez Meffin avec le bouton + → Connecteurs.' : 'In a chat, enable Meffin with + → Connectors.'}</li>
        </ol>
        <a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">{french ? 'Guide officiel Claude ↗' : 'Official Claude guide ↗'}</a>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{french ? 'Selon votre espace' : 'Workspace dependent'}</p>
          <h3 className="mt-1 font-display text-xl font-semibold">ChatGPT</h3></div>
        <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
          <li>{french ? 'Dans un espace compatible, ouvrez Plugins → + → Ajouter un serveur MCP personnalisé.' : 'In an eligible workspace, open Plugins → + → Add custom MCP server.'}</li>
          <li>{french ? 'Nommez-le Meffin et collez l’adresse copiée ci-dessus.' : 'Name it Meffin and paste the URL copied above.'}</li>
          <li>{french ? 'Sélectionnez OAuth pour la connexion, puis créez le connecteur.' : 'Select OAuth for authentication, then create the connector.'}</li>
          <li>{french ? 'Connectez-vous à Meffin et validez les accès affichés.' : 'Sign in to Meffin and approve the access shown.'}</li>
          <li>{french ? 'Dans une conversation, sélectionnez Meffin comme application.' : 'In a chat, select Meffin as an app.'}</li>
        </ol>
        <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">{french ? 'Si l’option d’ajout n’apparaît pas, votre forfait ou les réglages de votre espace ne la proposent pas encore. L’enregistrement des listes depuis ChatGPT nécessite actuellement un espace compatible avec les actions d’écriture.' : 'If Add custom MCP server is missing, your plan or workspace settings do not offer it yet. Saving lists from ChatGPT currently requires a workspace with write actions enabled.'}</p>
        <a href="https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">{french ? 'Guide officiel ChatGPT ↗' : 'Official ChatGPT guide ↗'}</a>
      </div>
    </div>
  </section>;
}
