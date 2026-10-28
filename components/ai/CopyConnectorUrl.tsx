'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CopyConnectorUrl({ endpoint, locale }: { endpoint: string; locale: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const french = locale === 'fr';

  async function copy() {
    try {
      await navigator.clipboard.writeText(endpoint);
      setCopied(true);
      setError(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
    }
  }

  return <div className="space-y-2">
    <div className="flex flex-col gap-2 sm:flex-row">
      <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-muted px-4 py-3 text-sm">{endpoint}</code>
      <Button type="button" onClick={copy} variant="outline">{copied ? (french ? 'Copié' : 'Copied') : (french ? 'Copier l’adresse' : 'Copy URL')}</Button>
    </div>
    {error && <p role="alert" className="text-xs text-destructive">{french ? 'Copiez l’adresse affichée ci-dessus.' : 'Please copy the address shown above.'}</p>}
  </div>;
}
