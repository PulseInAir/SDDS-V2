# SDDS Decision Register

Only the owner may change a LOCKED decision. Add a superseding decision; do not silently rewrite history.

| ID | Status | Decision | Effect |
|---|---|---|---|
| D-001 | LOCKED | Project type is `Private Internal Operations CRM`. | Do not apply public SaaS or landing-page assumptions. |
| D-002 | LOCKED | Build mode is greenfield. | Legacy brownfield redesign tasks are obsolete. |
| D-003 | LOCKED | Vercel is the deployment platform. | Do not ask Vercel versus Netlify. |
| D-004 | LOCKED | Supabase provides PostgreSQL, Auth, RLS, and private Storage. | No Firebase or Google Drive primary storage. |
| D-005 | LOCKED | Central work object is Client + Assessment Year filing case. | All operational modules map to this model. |
| D-006 | LOCKED | iDWELL inspiration is limited to hierarchy, density, navigation, and workflow presentation. | No copied identity, property domain, exact screens, or second design system. |
| D-007 | LOCKED | Desktop-first and intentionally responsive. | Do not use marketing-style mobile-first composition; mobile must remain usable. |
| D-008 | LOCKED | Privacy Mode is enabled by default. | Sensitive identifiers and money are masked by default. |
| D-009 | LOCKED | Portal passwords use authenticated reversible server-side encryption. | Never log plaintext; record reveal metadata only. |
| D-010 | LOCKED | Filing revisions create separate linked records. | Never overwrite original filing history. |
| D-011 | LOCKED | Payments are manually recorded as Cash or UPI for MVP. | No Razorpay, Stripe, or payment gateway. |
| D-012 | LOCKED | Single operational user now, minimally multi-user-ready data model. | One workspace and owner membership; no advanced RBAC yet. |
| D-013 | LOCKED | Dashboard metrics must come from defined queries and link to filtered work where practical. | No fake values or decorative analytics. |
| D-014 | LOCKED | Board and table are alternative views of the same filing-case query and filters. | Counts and records must reconcile. |
| D-015 | LOCKED | Supabase Storage is authoritative for documents. | Google Drive may be considered only as a later import/sync integration. |
| D-016 | LOCKED | Import is implemented after the production schema and validation rules are locked. | Avoid repeated import migrations. |
| D-017 | LOCKED | One task per implementation iteration. | Agent updates ledger and handoff after each task. |
| D-018 | LOCKED | User should need only the command `Continue SDDS.` | Agent obtains work from Git-tracked state. |
| D-019 | LOCKED | Google Drive is approved as the off-platform encrypted backup destination, while Supabase private Storage remains the primary live document store. | Backup policy may use Google Drive for encrypted retention and restore evidence, but not as authoritative runtime storage. |

## Decision change template

```md
### D-XXX — Title
Status: PROPOSED | LOCKED | SUPERSEDED
Date:
Owner approval evidence:
Supersedes:
Decision:
Reason:
Affected contracts:
Affected tasks:
Migration/rollback impact:
```
