export function SetupHelp({ locale }: { locale: string }) {
  const french = locale === 'fr';
  const items = french ? [
    ['Je ne trouve pas l’option pour ajouter un connecteur', 'Dans Claude, sur un forfait Team ou Enterprise, seul le propriétaire peut ajouter un connecteur : demandez-lui. Le forfait gratuit en permet un seul. Dans ChatGPT, il faut un forfait payant et passer par chatgpt.com/plugins dans le navigateur, pas par l’application.'],
    ['Meffin n’apparaît pas dans ma conversation', 'Dans Claude, cliquez sur + → Connecteurs et activez Meffin. Dans ChatGPT, ouvrez une nouvelle conversation, tapez @ et choisissez Meffin.'],
    ['Je veux l’utiliser sur mon téléphone', 'Ajoutez le connecteur une fois depuis un ordinateur. Dans Claude, il est ensuite disponible dans l’application mobile avec le même compte.'],
    ['La connexion a expiré ou échoue', 'Supprimez le connecteur dans votre assistant, puis ajoutez-le à nouveau avec la même adresse. Vérifiez que vous vous connectez avec votre compte Meffin habituel.'],
    ['Comment retirer l’accès ?', 'Dans Meffin, ouvrez Mon Profil → Connecter un assistant IA et cliquez sur Retirer. Supprimez aussi le connecteur dans votre assistant.'],
  ] : [
    ['I can’t find the option to add a connector', 'In Claude on Team or Enterprise, only an owner can add connectors, so ask them. The Free plan allows one. In ChatGPT you need a paid plan, and you must use chatgpt.com/plugins in a browser, not the desktop app.'],
    ['Meffin does not show up in my chat', 'In Claude, click + → Connectors and turn Meffin on. In ChatGPT, start a new chat, type @ and pick Meffin.'],
    ['I want to use it on my phone', 'Add the connector once from a computer. In Claude it is then available in the mobile app on the same account.'],
    ['The connection expired or fails', 'Remove the connector from your assistant and add it again with the same address. Make sure you sign in with your usual Meffin account.'],
    ['How do I remove access?', 'In Meffin, open My Profile → Connect an AI assistant and click Disconnect. Also remove the connector from your assistant.'],
  ];
  return <section className="space-y-4">
    <h2 className="font-display text-2xl font-semibold">{french ? 'Un souci ?' : 'Stuck?'}</h2>
    <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
      {items.map(([question, answer]) => <details key={question} className="px-6 py-4">
        <summary className="cursor-pointer font-medium">{question}</summary>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{answer}</p>
      </details>)}
    </div>
  </section>;
}
