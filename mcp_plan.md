# MCP Plan: Finance App Agent Tools

## Goal

Add a remote MCP server so Claude, ChatGPT, and other MCP-capable agents can manage the deployed Finance App on behalf of an authenticated user.

The first supported agent workflows are:

- Read the current user's transaction catalog, including known profiles, currencies, and tags.
- List and inspect transactions.
- Add expenses and income.
- Update transactions.

The MCP server must use the existing web deployment's API endpoints as the backing source of truth. It must not ask an LLM for the user's app password, and it must not expose raw login credentials as tool inputs.

## Current Repo Facts

The app already has these relevant HTTP APIs:

- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/setup/catalog`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PUT /api/transactions/:id`

Current app authentication is cookie based:

- Login sets an HTTP-only `session_token` cookie.
- Authenticated API routes call `requireAuthenticatedUser()`.
- `User.sessionToken` stores the active browser session token.

For MCP, do not reuse the browser cookie as the long-term remote agent credential. Add OAuth 2.1 access tokens for remote MCP clients and teach the API auth layer to accept those bearer tokens.

## Architecture

Use a same-origin remote MCP endpoint on the deployed Finance App:

```text
https://<finance-app-domain>/mcp
```

Primary transport:

- Streamable HTTP MCP at `/mcp`.

Optional compatibility transport:

- SSE at `/sse` only if a target client still needs it.

Recommended package direction:

- TypeScript MCP SDK, because this repo is Next.js/TypeScript.
- Add `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, and `zod`.
- Keep the MCP server code isolated under `app/mcp/route.ts` plus `lib/mcp/*`.

The MCP tool handlers should call the deployed app's HTTP APIs:

```text
MCP client -> /mcp -> MCP tool handler -> /api/transactions...
```

Forward the OAuth bearer token received by the MCP server to those API calls:

```http
Authorization: Bearer <mcp_access_token>
```

Then update `requireAuthenticatedUser()` so the same REST endpoints work with either:

- Existing browser cookie session.
- New MCP OAuth bearer token.

This keeps the transaction authorization rules in one place and lets agents use the same API behavior as the web app.

## Authentication Plan

### Required For ChatGPT And Claude

Implement OAuth 2.1 for the MCP server.

Required endpoints:

```text
GET  /.well-known/oauth-protected-resource
GET  /.well-known/oauth-authorization-server
POST /oauth/register
GET  /oauth/authorize
POST /oauth/token
POST /oauth/revoke
GET  /oauth/jwks.json
```

The protected resource metadata should describe the MCP server:

```json
{
  "resource": "https://<finance-app-domain>/mcp",
  "authorization_servers": ["https://<finance-app-domain>"],
  "scopes_supported": [
    "transactions:read",
    "transactions:write"
  ],
  "resource_documentation": "https://<finance-app-domain>/mcp/docs"
}
```

The authorization server metadata should advertise:

```json
{
  "issuer": "https://<finance-app-domain>",
  "authorization_endpoint": "https://<finance-app-domain>/oauth/authorize",
  "token_endpoint": "https://<finance-app-domain>/oauth/token",
  "registration_endpoint": "https://<finance-app-domain>/oauth/register",
  "revocation_endpoint": "https://<finance-app-domain>/oauth/revoke",
  "jwks_uri": "https://<finance-app-domain>/oauth/jwks.json",
  "code_challenge_methods_supported": ["S256"],
  "scopes_supported": [
    "transactions:read",
    "transactions:write"
  ],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"]
}
```

Unauthenticated MCP and protected API requests should return a challenge that points clients back to the protected resource metadata:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://<finance-app-domain>/.well-known/oauth-protected-resource", scope="transactions:read"
```

For MCP tool calls, also return an MCP error result with `_meta["mcp/www_authenticate"]` so ChatGPT can show the OAuth linking UI when a tool requires auth.

### OAuth Flow

1. Client discovers protected resource metadata from `/.well-known/oauth-protected-resource`.
2. Client discovers auth server metadata from `/.well-known/oauth-authorization-server`.
3. Client dynamically registers itself at `POST /oauth/register`.
4. Client starts authorization code + PKCE against `GET /oauth/authorize`.
5. The app checks whether the user has a browser session.
6. If the user is not signed in, redirect to existing `/auth/signin` with a return URL back to `/oauth/authorize`.
7. After sign-in, show a consent page listing requested scopes and client name.
8. On consent, issue a short-lived authorization code tied to:
   - `userId`
   - `clientId`
   - `redirectUri`
   - `codeChallenge`
   - `resource`
   - `scopes`
9. Client exchanges the code at `POST /oauth/token`.
10. The app returns an access token and refresh token.
11. MCP requests include `Authorization: Bearer <access_token>`.
12. The MCP server and REST APIs verify issuer, audience/resource, expiry, and scopes on every request.

### Token Model

Use signed JWT access tokens plus stored hashed refresh tokens.

Access token:

- Lifetime: 15 minutes.
- Claims:
  - `iss`: `https://<finance-app-domain>`
  - `sub`: user id
  - `aud`: `https://<finance-app-domain>/mcp`
  - `scope`: space-delimited scopes
  - `client_id`: registered client id
  - `iat`, `exp`, `jti`

Refresh token:

- Opaque random token.
- Store only a hash in the database.
- Rotate on every refresh.
- Revoke on logout from the OAuth consent/session management page.

### Database Additions

Add Prisma models similar to:

```prisma
model OAuthClient {
  id                String   @id @default(uuid())
  clientId          String   @unique
  clientSecretHash  String?
  clientName        String?
  redirectUris      String[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model OAuthAuthorizationCode {
  id                  String    @id @default(uuid())
  codeHash            String    @unique
  userId              String
  clientId            String
  redirectUri         String
  codeChallenge       String
  codeChallengeMethod String
  resource            String
  scopes              String[]
  expiresAt           DateTime
  consumedAt          DateTime?
  createdAt           DateTime  @default(now())
}

model OAuthRefreshToken {
  id          String    @id @default(uuid())
  tokenHash   String    @unique
  userId      String
  clientId    String
  resource    String
  scopes      String[]
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())
  rotatedAt   DateTime?
}
```

### Auth Middleware Change

Update `requireAuthenticatedUser()` to resolve auth in this order:

1. Bearer token from `Authorization`.
2. Existing `session_token` cookie.

For bearer tokens:

- Verify JWT signature from local signing key/JWKS.
- Require `aud` or `resource` to match `https://<finance-app-domain>/mcp`.
- Reject expired tokens.
- Resolve `sub` to a user.
- Check required scopes.

Add optional scope enforcement:

```ts
requireAuthenticatedUser({ scopes: ["transactions:read"] })
requireAuthenticatedUser({ scopes: ["transactions:write"] })
```

Apply scopes to endpoints:

- `GET /api/setup/catalog`: `transactions:read`
- `GET /api/transactions`: `transactions:read`
- `GET /api/transactions/:id`: `transactions:read`
- `POST /api/transactions`: `transactions:write`
- `PUT /api/transactions/:id`: `transactions:write`

Existing cookie sessions should continue to work for the web app without requiring explicit OAuth scopes.

## Existing API Contracts For Tool Handlers

### Response Envelope

Success with data:

```json
{
  "success": true,
  "data": {}
}
```

Success with message:

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

Error:

```json
{
  "success": false,
  "error": {
    "message": "Human readable error"
  }
}
```

### `GET /api/setup/catalog`

Use this before creating or updating transactions so the agent can choose valid existing values.

Response:

```json
{
  "success": true,
  "data": {
    "catalog": {
      "transactionCount": 12,
      "profiles": [{ "name": "Personal", "count": 10 }],
      "currencies": [{ "code": "USD", "count": 12 }],
      "tags": [
        {
          "profile": "Personal",
          "name": "Groceries",
          "type": "expense",
          "count": 5
        }
      ]
    }
  }
}
```

### `GET /api/transactions`

Query parameters:

```text
profile?: string
from?: YYYY-MM-DD
to?: YYYY-MM-DD
type?: income | expense
currency?: ISO currency code
displayCurrency?: ISO currency code
tag?: string
includeConverted?: true | false
sort?: asc | desc
limit?: number
offset?: number
```

Response:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "userId": "uuid",
        "profile": "Personal",
        "occurredAt": "2026-05-01",
        "amountMinor": 1299,
        "currency": "USD",
        "type": "expense",
        "tags": ["Groceries"],
        "note": "Milk and bread",
        "createdAt": "2026-05-01T12:00:00.000Z",
        "updatedAt": "2026-05-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "meta": {
      "skippedCurrencies": []
    }
  }
}
```

### `POST /api/transactions`

Required fields:

```json
{
  "profile": "Personal",
  "occurredAt": "2026-05-01",
  "amountMinor": 1299,
  "currency": "USD",
  "type": "expense",
  "tags": ["Groceries"],
  "note": "Milk and bread"
}
```

Rules:

- `profile` is required.
- `occurredAt` must be a valid date string.
- `amountMinor` must be greater than 0.
- `currency` is required and is uppercased by the API.
- `type` must be `income` or `expense`.
- `tags` must contain at least one non-empty tag.
- Tags are trimmed and deduplicated.
- `note` is optional; blank notes become `null`.

Response status is `201`.

### `GET /api/transactions/:id`

Returns one transaction or `404`.

### `PUT /api/transactions/:id`

Partial update fields:

```json
{
  "profile": "Personal",
  "occurredAt": "2026-05-01",
  "amountMinor": 1299,
  "currency": "USD",
  "type": "expense",
  "tags": ["Groceries"],
  "note": "Updated note or null"
}
```

Rules:

- At least one valid field must be provided.
- If `tags` is provided, it must contain at least one tag.
- `note: null` clears the note.
- Empty string note becomes `null`.

## MCP Tools

Use high-level, LLM-friendly tools. Do not expose raw REST endpoints as generic `http_request`.

### Tool: `get_finance_auth_status`

Purpose:

- Confirm the MCP connection is authenticated.
- Return the current user email and granted scopes.

Backing endpoint:

- `GET /api/auth/session`

Required scope:

- Any valid Finance MCP token.

Annotations:

```json
{
  "readOnlyHint": true
}
```

Input schema:

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

Structured result:

```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "scopes": ["transactions:read", "transactions:write"]
}
```

### Tool: `get_transaction_catalog`

Purpose:

- Fetch known profiles, currencies, and tags.
- Use before creating or updating transactions.

Backing endpoint:

- `GET /api/setup/catalog`

Required scope:

- `transactions:read`

Annotations:

```json
{
  "readOnlyHint": true
}
```

Input schema:

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

### Tool: `list_transactions`

Purpose:

- Search and page through transactions.

Backing endpoint:

- `GET /api/transactions`

Required scope:

- `transactions:read`

Annotations:

```json
{
  "readOnlyHint": true
}
```

Input schema:

```json
{
  "type": "object",
  "properties": {
    "profile": { "type": "string" },
    "from": { "type": "string", "description": "YYYY-MM-DD" },
    "to": { "type": "string", "description": "YYYY-MM-DD" },
    "type": { "type": "string", "enum": ["income", "expense"] },
    "currency": { "type": "string", "description": "ISO currency code" },
    "displayCurrency": { "type": "string", "description": "ISO currency code" },
    "tag": { "type": "string" },
    "includeConverted": { "type": "boolean" },
    "sort": { "type": "string", "enum": ["asc", "desc"], "default": "desc" },
    "limit": { "type": "integer", "minimum": 1, "maximum": 100 },
    "offset": { "type": "integer", "minimum": 0 }
  },
  "additionalProperties": false
}
```

MCP handler default:

- Use `limit: 50` unless the user asks for more.
- Keep `sort: "desc"` unless the user asks for oldest first.

### Tool: `get_transaction`

Purpose:

- Fetch one transaction by id.

Backing endpoint:

- `GET /api/transactions/:id`

Required scope:

- `transactions:read`

Annotations:

```json
{
  "readOnlyHint": true
}
```

Input schema:

```json
{
  "type": "object",
  "required": ["id"],
  "properties": {
    "id": { "type": "string" }
  },
  "additionalProperties": false
}
```

### Tool: `create_expense`

Purpose:

- Add a new expense.
- Hide the app's raw `amountMinor` requirement from the LLM by accepting a decimal major-unit amount and converting server side.

Backing endpoint:

- `POST /api/transactions`

Required scope:

- `transactions:write`

Annotations:

```json
{
  "readOnlyHint": false,
  "openWorldHint": false,
  "destructiveHint": false
}
```

Input schema:

```json
{
  "type": "object",
  "required": ["profile", "occurredAt", "amount", "currency", "tags"],
  "properties": {
    "profile": { "type": "string" },
    "occurredAt": { "type": "string", "description": "YYYY-MM-DD" },
    "amount": {
      "type": "number",
      "exclusiveMinimum": 0,
      "description": "Decimal amount in major currency units, for example 12.99"
    },
    "currency": { "type": "string", "description": "ISO currency code" },
    "tags": {
      "type": "array",
      "minItems": 1,
      "items": { "type": "string" }
    },
    "note": { "type": "string" }
  },
  "additionalProperties": false
}
```

Handler mapping:

```json
{
  "profile": "input.profile",
  "occurredAt": "input.occurredAt",
  "amountMinor": "toMinorUnits(input.amount, input.currency)",
  "currency": "input.currency",
  "type": "expense",
  "tags": "input.tags",
  "note": "input.note"
}
```

### Tool: `create_income`

Same as `create_expense`, but maps `type` to `income`.

Required scope:

- `transactions:write`

Annotations:

```json
{
  "readOnlyHint": false,
  "openWorldHint": false,
  "destructiveHint": false
}
```

### Tool: `update_transaction`

Purpose:

- Modify one existing transaction.
- Accept decimal `amount` and convert to `amountMinor` only when provided.

Backing endpoint:

- `PUT /api/transactions/:id`

Required scope:

- `transactions:write`

Annotations:

```json
{
  "readOnlyHint": false,
  "openWorldHint": false,
  "destructiveHint": false
}
```

Input schema:

```json
{
  "type": "object",
  "required": ["id"],
  "properties": {
    "id": { "type": "string" },
    "profile": { "type": "string" },
    "occurredAt": { "type": "string", "description": "YYYY-MM-DD" },
    "amount": {
      "type": "number",
      "exclusiveMinimum": 0,
      "description": "Decimal amount in major currency units"
    },
    "currency": { "type": "string", "description": "ISO currency code" },
    "type": { "type": "string", "enum": ["income", "expense"] },
    "tags": {
      "type": "array",
      "minItems": 1,
      "items": { "type": "string" }
    },
    "note": {
      "type": ["string", "null"],
      "description": "Set null to clear the note"
    }
  },
  "additionalProperties": false
}
```

Handler rule:

- Reject calls where only `id` is supplied.
- If `amount` is supplied but `currency` is not supplied, fetch the current transaction and use its currency for conversion.
- Return the updated transaction.

## Amount Conversion

Do not require agents to calculate `amountMinor`.

Add a helper:

```ts
toMinorUnits(amount: number, currency: string): number
```

Rules:

- Uppercase currency.
- Use ISO 4217 exponent data.
- Default exponent to 2 only if currency is unknown and log a warning.
- Round to the nearest integer minor unit.
- Reject non-finite values and values less than or equal to 0.

Examples:

```text
USD 12.99 -> 1299
JPY 1200 -> 1200
KWD 1.234 -> 1234
```

## MCP Server Instructions For Agents

Set the MCP server instructions to something close to:

```text
You manage the authenticated user's Finance App transactions.

Before creating or updating a transaction, call get_transaction_catalog unless
the user already supplied exact profile, currency, and tag values.

Dates must be YYYY-MM-DD. If the user says "today", use the current local date
available in the conversation or ask for the date if uncertain.

Amounts passed to create_expense, create_income, and update_transaction are
major currency units, not cents. The server converts them to minor units.

For a new expense, collect profile, date, amount, currency, and at least one tag.
Do not invent a missing profile, currency, or tag unless the user explicitly
asks to create a transaction with that new value.

For updates, fetch the target transaction first unless the user already supplied
the transaction id and all replacement fields.

Never ask the user for their Finance App password. Authentication happens
through OAuth linking outside the chat.
```

## Agent Usage Playbooks

### Add Expense

1. If unauthenticated, let the MCP client trigger OAuth.
2. Call `get_transaction_catalog`.
3. Identify or ask for:
   - profile
   - date
   - amount
   - currency
   - at least one tag
   - optional note
4. If user intent is clear, call `create_expense`.
5. Return the created transaction id and normalized summary.

Example user prompt:

```text
Add $12.99 for groceries today under Personal.
```

Expected tool flow:

```text
get_transaction_catalog()
create_expense({
  profile: "Personal",
  occurredAt: "YYYY-MM-DD",
  amount: 12.99,
  currency: "USD",
  tags: ["Groceries"],
  note: null
})
```

### Find Transactions

1. Call `list_transactions` with filters from the user.
2. Use `limit` and `offset` for paging.
3. If the user references "that one", call `get_transaction` on candidate ids before write actions.

### Update Transaction

1. Use `list_transactions` to find candidates if no id is given.
2. Ask the user to choose when multiple candidates match.
3. Call `get_transaction` for the selected id.
4. Confirm the intended changes in natural language if the change is substantial.
5. Call `update_transaction`.

## Implementation Phases

### Phase 1: OAuth Foundation

Files likely touched:

- `prisma/schema.prisma`
- `app/oauth/register/route.ts`
- `app/oauth/authorize/route.ts`
- `app/oauth/token/route.ts`
- `app/oauth/revoke/route.ts`
- `app/oauth/jwks.json/route.ts`
- `app/.well-known/oauth-protected-resource/route.ts`
- `app/.well-known/oauth-authorization-server/route.ts`
- `app/api/_lib/auth.ts`
- `app/api/auth/_lib/helpers.ts`

Tasks:

1. Add OAuth Prisma models and migration.
2. Add environment variables:
   - `APP_URL`
   - `MCP_RESOURCE_URL`
   - `MCP_OAUTH_ISSUER`
   - `MCP_OAUTH_JWT_PRIVATE_KEY`
   - `MCP_OAUTH_JWT_PUBLIC_JWKS`
3. Implement dynamic client registration.
4. Implement authorization code + PKCE.
5. Add a simple consent page.
6. Implement JWT access token verification.
7. Add bearer token support to `requireAuthenticatedUser()`.
8. Add scope checks to transaction routes.

Acceptance:

- MCP Inspector can complete OAuth.
- A valid bearer token can call `GET /api/transactions`.
- An invalid, expired, wrong-audience, or insufficient-scope token gets `401` or `403`.
- Existing browser login still works.

### Phase 2: MCP Endpoint And Tools

Files likely touched:

- `app/mcp/route.ts`
- `lib/mcp/server.ts`
- `lib/mcp/tools/*.ts`
- `lib/mcp/financeApiClient.ts`
- `lib/mcp/amount.ts`

Tasks:

1. Add MCP SDK dependencies.
2. Create a Streamable HTTP MCP route at `/mcp`.
3. Register the tools listed above.
4. Add `securitySchemes` per tool:
   - read tools: `transactions:read`
   - create/update: `transactions:write`
5. Return `_meta["mcp/www_authenticate"]` for unauthenticated tool calls.
6. Add accurate annotations for read/write tools.
7. Implement tool handlers by calling existing REST endpoints.
8. Keep `structuredContent` concise.
9. Keep sensitive data and tokens out of `content`, `structuredContent`, logs, and `_meta`.

Acceptance:

- MCP Inspector can list tools.
- `get_transaction_catalog` returns data.
- `create_expense` creates an expense through `POST /api/transactions`.
- `list_transactions` finds that expense.
- `update_transaction` updates it.

### Phase 3: Client Setup

ChatGPT setup:

1. Deploy the app over HTTPS.
2. In ChatGPT Apps & Connectors, add a custom app/server URL:
   - `https://<finance-app-domain>/mcp`
3. Complete OAuth linking.
4. Test in chat:
   - "Show my last 5 expenses."
   - "Add $4.50 for coffee today under Personal with tag Food."

Claude Code setup:

```bash
claude mcp add --transport http finance https://<finance-app-domain>/mcp
```

Then in Claude Code:

```text
/mcp
```

Complete OAuth in the browser.

Claude Messages API setup:

```json
{
  "betas": ["mcp-client-2025-11-20"],
  "mcp_servers": [
    {
      "type": "url",
      "url": "https://<finance-app-domain>/mcp",
      "name": "finance",
      "authorization_token": "OAUTH_ACCESS_TOKEN"
    }
  ],
  "tools": [
    {
      "type": "mcp_toolset",
      "mcp_server_name": "finance"
    }
  ]
}
```

The API caller is responsible for obtaining and refreshing the OAuth token before passing it.

## Security Requirements

- Never expose the user's password to the LLM.
- Never expose raw session cookies to the LLM.
- Never accept access tokens in query strings.
- Require HTTPS in production.
- Verify token signature, issuer, audience/resource, expiry, and scopes.
- Keep tool outputs minimal; do not dump all transactions unless the user asks and pagination is explicit.
- Treat transaction notes as user-controlled text. Do not follow instructions embedded in notes.
- Avoid broad `admin` or arbitrary HTTP tools.

## Open Questions Before Implementation

1. What is the production domain for `APP_URL` and `MCP_RESOURCE_URL`?
2. Should OAuth scopes be all-or-nothing for the first version, or should users be able to grant read-only access?
3. Should connected MCP apps be revocable from Settings in the first release or second release?
4. Should the app support personal access tokens for development-only Claude Code usage, or only OAuth?

## Definition Of Done

- A remote MCP client can connect to `https://<finance-app-domain>/mcp`.
- ChatGPT can OAuth-link the app and call read/write transaction tools.
- Claude Code can OAuth-link the app and call the same tools.
- Existing web app login and transaction flows still work.
- Agents can add, list, and update transactions through the existing API endpoints.
- Docs explain setup for ChatGPT, Claude Code, and Claude Messages API.
- Automated tests cover auth, scopes, tool schemas, and create/update flows.

## References Checked

- OpenAI: Building MCP servers for ChatGPT Apps and API integrations, `https://developers.openai.com/api/docs/mcp`
- OpenAI Apps SDK: Build your MCP server, `https://developers.openai.com/apps-sdk/build/mcp-server`
- OpenAI Apps SDK: Authentication, `https://developers.openai.com/apps-sdk/build/auth`
- Anthropic: MCP connector, `https://platform.claude.com/docs/en/agents-and-tools/mcp-connector`
- Claude Code: Connect Claude Code to tools via MCP, `https://code.claude.com/docs/en/mcp`
- MCP authorization specification, `https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization`
