import { createMcpHandler } from '@modelcontextprotocol/server';
import { requireMcpAuth } from '@better-auth/mcp';
import { auth } from '@/lib/auth';
import { mcpResource } from '@/lib/mcp/config';
import { createMeffinMcpServer } from '@/lib/mcp/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { mcpClientRevocations, oauthConsent } from '@/lib/db/schema';

export const runtime = 'nodejs';

export const POST = requireMcpAuth(auth, async (request, claims) => {
  if (typeof claims.sub !== 'string' || !claims.sub) return new Response('Invalid account', { status: 401 });
  const scopes = new Set(typeof claims.scope === 'string' ? claims.scope.split(' ') : []);
  const clientId = typeof claims.client_id === 'string' ? claims.client_id : null;
  if (!clientId) return new Response('Invalid client', { status: 401 });
  const [consents, [revocation]] = await Promise.all([
    db.select({ scopes: oauthConsent.scopes }).from(oauthConsent).where(and(
      eq(oauthConsent.userId, claims.sub), eq(oauthConsent.clientId, clientId))),
    db.select({ revokedAt: mcpClientRevocations.revokedAt }).from(mcpClientRevocations).where(and(
      eq(mcpClientRevocations.userId, claims.sub), eq(mcpClientRevocations.clientId, clientId))).limit(1),
  ]);
  if (!consents.some((consent) => [...scopes].every((scope) => consent.scopes.includes(scope)))) {
    return new Response('Connection access was revoked', { status: 403 });
  }
  if (revocation && (typeof claims.iat !== 'number' || claims.iat * 1000 <= revocation.revokedAt.getTime())) {
    return new Response('Connection access was revoked', { status: 403 });
  }
  const origin = new URL(mcpResource).origin;
  const handler = createMcpHandler(() => createMeffinMcpServer(claims.sub!, clientId, scopes, origin), {
    legacy: 'stateless',
    maxRequestBodySize: 256 * 1024,
  });
  return handler.fetch(request);
}, { resource: mcpResource, requiredScopes: ['meffin:read'], challengeScopes: ['meffin:read', 'meffin:write'] });
