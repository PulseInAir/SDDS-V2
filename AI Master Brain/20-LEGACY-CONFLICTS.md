# Legacy Conflicts and Quarantine Rules

These legacy instructions must not control the greenfield build.

## Obsolete project artefacts

- old screenshot-specific dashboard task lists;
- `MASTER_PLAN.md` containing gradient cards, fake trends, decorative chart, avatars, or table-to-card conversion;
- `TASK.docx` / `TASK.xlsx` generated for the former dashboard redesign;
- the old `SDDS master execution sequence.docx` where it assumes an existing production application and brownfield audit;
- generic `design.md` sections about heroes, conversion, pricing, testimonials, marketing CTAs, and landing-page storytelling;
- generic architecture rules that ask Vercel versus Netlify or recommend Razorpay/Stripe;
- product text that names Google Drive as authoritative storage;
- any old instruction requiring the blue-gradient screenshot system or carved white sidebar cut-out.

## Reusable content retained

Retain valid business/security principles from older documents when they agree with the project lock:

- one client source of truth;
- assessment-year organisation;
- history preservation;
- privacy and encryption;
- RLS and private storage;
- invoices/payments/refunds/notices/follow-up;
- verification, Git discipline, and rollback safety.

## Repository action

During G00:

1. Move conflicting legacy artefacts to `docs/archive/legacy-pre-greenfield/`, or remove them if Git history already preserves them and no tooling depends on them.
2. Add a short archive README stating they are non-authoritative.
3. Search the repository for references to their names.
4. Update active references to the numbered project brain.
5. Do not blend old visual tasks into the new ledger.
