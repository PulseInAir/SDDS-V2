# SDDS Architecture Contract

## 1. Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Supabase PostgreSQL, Auth, and private Storage
- Vercel
- GitHub

Use free-tier-compatible architecture. Do not introduce paid services, payment gateways, or always-on workers for MVP.

## 2. Application boundaries

```text
src/
  app/
    (auth)/
    (app)/
    api/                 # only when a route handler is necessary
  components/
    ui/
    layout/
  features/
    dashboard/
    clients/
    filing-cases/
    documents/
    invoices/
    refunds/
    tax-events/
    follow-up/
    settings/
    imports/
  lib/
    auth/
    db/
    supabase/
    security/
    validation/
    observability/
  types/
  styles/
  tests/
```

Feature folders may contain components, server actions, queries, schemas, and types. Keep database access and secrets out of presentation components.

## 3. Rendering and data access

- Prefer Server Components for initial authenticated reads.
- Use Client Components only for interactive state that requires the browser.
- Use server actions or route handlers for mutations with server-side validation and authorisation.
- Centralise typed query and mutation helpers.
- Avoid fetch waterfalls, duplicated queries, and broad client-side global stores.
- Paginate large lists.
- Preserve URL-addressable filters where useful.

## 4. Authentication

- Supabase Auth protects all internal routes.
- Middleware or equivalent server checks redirect unauthenticated users.
- Database RLS is the final data boundary; hidden UI is not authorisation.
- Initial membership is one owner in one workspace.
- Authentication method remains an open setup decision until repository bootstrap, but must use supported Supabase Auth without weakening security.

## 5. Database

- SQL migrations are version-controlled.
- Use foreign keys, checks, unique constraints, indexes, and transactions.
- Every business table carries workspace ownership directly or through an unambiguous parent validated by policy.
- Avoid cascade deletion of business history.
- Use generated TypeScript database types.

## 6. Storage

- Private bucket: `sdds-documents`.
- Suggested path: `workspaces/{workspaceId}/clients/{clientId}/{assessmentYear}/{documentType}/{timestamp}-{safeFilename}`.
- Store metadata in PostgreSQL.
- Generate short-lived signed URLs in authorised server code.
- Validate size, MIME type, ownership, and safe filename.

## 7. Encryption

- Server-only authenticated encryption using AES-256-GCM or equivalent reviewed implementation.
- Versioned payload format.
- 32-byte key; 64 hexadecimal characters when represented as hex.
- Decryption endpoint/action returns only the selected credential after authorisation.

## 8. Validation

- Validate at UI boundaries for usability and again on the server for trust.
- Use one shared schema contract where practical.
- Database constraints remain authoritative.

## 9. Observability

- Structured safe logs without sensitive values.
- Capture server errors and rejected mutations with correlation identifiers where possible.
- Use Vercel/Supabase free observability first.

## 10. Performance budgets

- Immediate navigation feedback.
- No blank-screen route transitions.
- No unbounded client queries.
- Avoid whole-app client rendering.
- Use skeletons that preserve layout.
- Optimise icons and fonts; no unnecessary animation package.

## 11. Deployment environments

- Local development
- Vercel Preview
- Vercel Production

Each uses explicitly configured Supabase/environment values. Never expose secrets in `NEXT_PUBLIC_*` unless the value is intentionally public.
