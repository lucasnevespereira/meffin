import { CopyButton } from '@/components/ai/CopyConnectorUrl';

export function TryPrompts({ locale }: { locale: string }) {
  const french = locale === 'fr';
  const prompts = french ? [
    'Avec Meffin, où ai-je le plus dépensé ce mois-ci, et comment économiser ?',
    'Compare mes dépenses des trois derniers mois dans Meffin.',
    'Prépare une liste de courses pour 60 € et enregistre-la dans Meffin.',
  ] : [
    'Using Meffin, where did I spend the most this month, and how could I save?',
    'Compare my spending over the last three months in Meffin.',
    'Plan groceries for €60 and save the list in Meffin.',
  ];
  return <section className="space-y-4">
    <div>
      <h2 className="font-display text-2xl font-semibold">{french ? 'Essayez ces questions' : 'Try asking'}</h2>
      <p className="text-sm text-muted-foreground">{french ? 'Copiez une question et collez-la dans une conversation où Meffin est activé.' : 'Copy a question and paste it into a chat with Meffin turned on.'}</p>
    </div>
    <ul className="grid gap-3 md:grid-cols-3">
      {prompts.map((prompt) => <li key={prompt} className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm shadow-card">
        <p className="flex-1 leading-relaxed">{prompt}</p>
        <CopyButton text={prompt} locale={locale} iconOnly label={french ? 'Copier la question' : 'Copy question'} />
      </li>)}
    </ul>
  </section>;
}
