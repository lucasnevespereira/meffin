import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { mcpClientRevocations, oauthAccessToken, oauthConsent, oauthRefreshToken } from '@/lib/db/schema';

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const consentId = typeof body?.consentId === 'string' ? body.consentId : null;
  if (!consentId) return NextResponse.json({ error: 'Invalid consent' }, { status: 400 });
  const [consent] = await db.select({ clientId: oauthConsent.clientId }).from(oauthConsent)
    .where(and(eq(oauthConsent.id, consentId), eq(oauthConsent.userId, session.user.id))).limit(1);
  if (!consent) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });

  await db.transaction(async (tx) => {
    await tx.insert(mcpClientRevocations).values({ id: crypto.randomUUID(), userId: session.user.id,
      clientId: consent.clientId, revokedAt: new Date() }).onConflictDoUpdate({
      target: [mcpClientRevocations.userId, mcpClientRevocations.clientId],
      set: { revokedAt: new Date() },
    });
    await tx.delete(oauthAccessToken).where(and(eq(oauthAccessToken.userId, session.user.id), eq(oauthAccessToken.clientId, consent.clientId)));
    await tx.delete(oauthRefreshToken).where(and(eq(oauthRefreshToken.userId, session.user.id), eq(oauthRefreshToken.clientId, consent.clientId)));
    await tx.delete(oauthConsent).where(and(eq(oauthConsent.clientId, consent.clientId), eq(oauthConsent.userId, session.user.id)));
  });
  return NextResponse.json({ ok: true });
}
