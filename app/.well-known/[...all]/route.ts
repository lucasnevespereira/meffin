import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

function isAllowed(request: Request) {
  const path = new URL(request.url).pathname;
  return path.startsWith('/.well-known/oauth-protected-resource') ||
    path.startsWith('/.well-known/oauth-authorization-server') ||
    path.startsWith('/.well-known/openid-configuration');
}

export async function GET(request: Request) {
  if (!isAllowed(request)) return new Response('Not found', { status: 404 });
  return auth.handler(request);
}

export async function HEAD(request: Request) {
  if (!isAllowed(request)) return new Response(null, { status: 404 });
  return auth.handler(request);
}
