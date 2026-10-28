'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export function ConsentChoices({ clientName, accountEmail, canWrite, sharesIdentity, locale }: { clientName: string; accountEmail: string; canWrite: boolean; sharesIdentity: boolean; locale: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const french = locale === 'fr';

  async function decide(accept: boolean) {
    setPending(true);
    setError('');
    try {
      const result = await authClient.oauth2.consent({ accept });
      if (result.error || !result.data?.url) throw new Error(result.error?.message || 'Connection failed');
      window.location.assign(result.data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Connection failed');
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Meffin + AI</p>
        <h1 className="font-display text-2xl font-semibold">{french ? `Connecter ${clientName} ?` : `Connect ${clientName}?`}</h1>
        <p className="text-sm text-muted-foreground">{french ? `Connecté à Meffin en tant que ${accountEmail}` : `Signed in to Meffin as ${accountEmail}`}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-sm">
        <p className="font-medium">{french ? 'Cette application pourra :' : 'This app will be able to:'}</p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>{french ? 'Lire votre budget, vos dépenses et vos listes, selon les règles de partage de Meffin.' : 'Read your budget, spending, and lists under Meffin’s sharing rules.'}</li>
          {sharesIdentity && <li>{french ? 'Voir votre nom et votre adresse e-mail Meffin pour identifier votre compte.' : 'See your Meffin name and email to identify your account.'}</li>}
          {canWrite && <li>{french ? 'Créer de nouvelles listes de courses avec des prix estimés et un budget cible.' : 'Create shopping lists with estimated prices and a target budget.'}</li>}
        </ul>
        <p className="text-xs text-muted-foreground">{french ? 'Les données demandées seront transmises à cette application. N’autorisez l’accès que si vous avez lancé cette connexion. Meffin ne communique jamais votre mot de passe.' : 'Requested data will be sent to this app. Only allow access if you started this connection. Meffin never shares your password.'}</p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button disabled={pending} onClick={() => decide(true)} className="flex-1">{french ? 'Autoriser' : 'Allow access'}</Button>
        <Button disabled={pending} variant="outline" onClick={() => decide(false)} className="flex-1">{french ? 'Refuser' : 'Deny'}</Button>
      </div>
      <Link href={`/${locale}/ai`} className="block text-center text-xs text-muted-foreground underline">{french ? 'En savoir plus sur les connexions IA' : 'Learn about AI connections'}</Link>
    </div>
  );
}
