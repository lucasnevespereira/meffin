'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function AiConnections({ endpoint, connections, locale }: {
  endpoint: string;
  connections: { id: string; name: string | null; clientId: string }[];
  locale: string;
}) {
  const french = locale === 'fr';
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function copy() {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function disconnect(consentId: string) {
    setRemoving(consentId);
    setError('');
    try {
      const response = await fetch('/api/mcp/connections', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentId }),
      });
      if (!response.ok) throw new Error(french ? 'Impossible de retirer cet accès.' : 'Could not remove this access.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Connection failed');
    } finally {
      setRemoving(null);
    }
  }

  return <>
    <div className="flex flex-col gap-2 sm:flex-row">
      <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-muted px-4 py-3 text-sm">{endpoint}</code>
      <Button type="button" onClick={copy} variant="outline">{copied ? (french ? 'Copié' : 'Copied') : (french ? 'Copier' : 'Copy URL')}</Button>
    </div>
    <div className="border-t border-border pt-5 space-y-3">
      <h2 className="font-semibold">{french ? 'Applications connectées' : 'Connected apps'}</h2>
      {connections.length === 0 && <p className="text-sm text-muted-foreground">{french ? 'Aucune application connectée pour le moment.' : 'No apps connected yet.'}</p>}
      {connections.map((connection) => <div key={connection.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
        <div className="min-w-0"><p className="font-medium truncate">{connection.name || connection.clientId}</p>
          <p className="text-xs text-muted-foreground truncate">{connection.clientId}</p></div>
        <Button type="button" variant="outline" size="sm" disabled={removing === connection.id} onClick={() => disconnect(connection.id)}>
          {french ? 'Retirer' : 'Disconnect'}
        </Button>
      </div>)}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">{french ? 'Retirer l’accès bloque immédiatement les appels à Meffin. Supprimez aussi le connecteur dans votre assistant IA.' : 'Disconnecting immediately blocks Meffin calls. Also remove the connector from your AI app.'}</p>
    </div>
  </>;
}
