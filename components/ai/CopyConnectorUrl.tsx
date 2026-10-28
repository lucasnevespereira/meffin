'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Tick01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';

export function CopyButton({ text, locale, label, iconOnly = false }: { text: string; locale: string; label?: string; iconOnly?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const french = locale === 'fr';

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
    }
  }

  const status = copied ? (french ? 'Copié !' : 'Copied!') : error ? (french ? 'Copie impossible, sélectionnez le texte.' : 'Copy failed, select the text instead.') : '';
  return <>
    <Button type="button" onClick={copy} variant={iconOnly ? 'ghost' : 'default'} size={iconOnly ? 'icon' : 'default'}
      aria-label={iconOnly ? (label ?? (french ? 'Copier' : 'Copy')) : undefined} className="shrink-0">
      <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} className="h-4 w-4" />
      {!iconOnly && (copied ? (french ? 'Copié' : 'Copied') : (label ?? (french ? 'Copier' : 'Copy')))}
    </Button>
    <span role="status" className="sr-only">{status}</span>
    {error && !iconOnly && <span className="text-xs text-destructive">{status}</span>}
  </>;
}

export function CopyConnectorUrl({ endpoint, locale }: { endpoint: string; locale: string }) {
  const french = locale === 'fr';
  return <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-2 sm:flex-row sm:items-center">
    <code onClick={(event) => window.getSelection()?.selectAllChildren(event.currentTarget)}
      className="min-w-0 flex-1 cursor-text overflow-x-auto whitespace-nowrap px-3 py-2 font-mono text-sm">{endpoint}</code>
    <CopyButton text={endpoint} locale={locale} label={french ? 'Copier l’adresse' : 'Copy URL'} />
  </div>;
}
