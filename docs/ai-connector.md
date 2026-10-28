# Meffin AI connector

Meffin serves an HTTPS MCP endpoint at `/api/mcp`. Users connect their own AI app through OAuth; Meffin does not host a language model or send financial data until the app calls a tool. The public guide and copy button are at `/en/ai-connector` and `/fr/ai-connector`; the URL is public and the user signs in only during OAuth. Signed-in users can also copy the URL, see connected clients, and disconnect them at `/en/ai` or `/fr/ai`.

## Deploying

Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the canonical public HTTPS origin, for example `https://meffin.app`. The same origin must serve `/api/auth`, `/api/mcp`, and `/.well-known/*`. Run database migrations before serving the new code. `BETTER_AUTH_SECRET` and `DATABASE_URL` remain required as before. A local `http://localhost:3000` origin works for development, but cloud AI clients need a publicly reachable HTTPS server.

The OAuth provider supports Client ID Metadata Documents and dynamic client registration for clients that need it. Public registration uses PKCE for public clients. Tokens are bound to `/api/mcp`; the route verifies signature, issuer, audience, expiry, `meffin:read`, a live consent, and any disconnect timestamp. The list creation tool also requires `meffin:write`. OAuth consent is signed and shown in Meffin after login. The app never gives the AI client a Meffin password.

`POST /api/mcp` serves Streamable HTTP. Older stateless 2025 clients are supported. The endpoint does not expose GET or DELETE session operations. OAuth discovery is served under `/.well-known/`. Anonymous MCP requests return a `WWW-Authenticate` challenge with the resource metadata URL.

## Tools

| Tool | Effect |
| --- | --- |
| `get_budget_month` | Income, expenses, balance, and category totals for one month. |
| `get_budget_trend` | Three to twelve monthly summaries. |
| `get_transactions` | Up to 50 visible transactions from one month. |
| `list_shopping_lists` | Up to 50 own and partner-shared lists. |
| `get_shopping_list` | Items, target budget, and estimated prices for one visible list. |
| `create_shopping_list` | Atomically creates one grocery list and up to 50 items. |

Budget reads reuse `lib/services/budget/budget.ts`, including the household visibility filter. Future recurring entries are marked as forecasts in transaction output. The write tool creates a list only; it cannot create or edit transactions, make purchases, or move money. `isShared` defaults to false. A required `requestId` makes retries return the same list.

Disconnecting a client deletes its consent and refresh/access records, and records a revocation timestamp. MCP requests check the live consent and timestamp, so an already issued JWT is blocked immediately. The user should also remove the connector from the AI app.

## Client setup

Both the public guide and the signed-in page include numbered Claude and ChatGPT setup steps with links to the providers' current instructions. In Claude, use Customize → Connectors → Add → Custom connector, paste the URL, and choose sign-in. Claude's published OAuth client identity is preferred when offered. In an eligible ChatGPT workspace, use Plugins → Add custom MCP server and choose OAuth; current write support is limited to eligible workspaces.

## Verification

Run `pnpm db:check`, `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build:local`. Test OAuth against a migrated local PostgreSQL database: anonymous challenge, metadata discovery, sign-in continuation, signed consent, token exchange, `tools/list`, budget read, list creation, repeated `requestId`, list read, and disconnect. Do not use real financial accounts for this smoke test.
