# AGENTS.md — SDDS Autonomous Execution Contract

## 1. Mission

Build SDDS as a private, desktop-first, responsive Indian ITR practice-management operating system. The interface must use the locked iDWELL-inspired operational CRM principles without copying iDWELL branding, imagery, terminology, exact screens, or proprietary assets.

## 2. Autonomous continuation rule

Do not ask the owner for a fresh task prompt.

At the start of every session:

1. Confirm the current directory is a Git repository.
2. Inspect `git status --short`, current branch, latest commit, and configured remote without exposing credentials.
3. Read the project brain files in the exact order in Section 3.
4. Read `AI Master Brain/17-TASK-LEDGER.md` and `AI Master Brain/18-SESSION-HANDOFF.md`.
5. Resume the single task marked `IN_PROGRESS`; otherwise select the first task marked `READY` whose dependencies are complete.
6. Execute only that task.
7. Run all required task checks.
8. Review the diff and run `git diff --check`.
9. Commit and push only after the task meets its definition of done.
10. Update the task ledger and session handoff in the same commit, or in a second documentation-only commit when technically necessary.
11. Stop. Do not begin the next task in the same iteration unless the ledger explicitly marks both as one atomic task.

When the user says `Continue SDDS`, follow this protocol immediately.

## 3. Mandatory reading order

1. `AI Master Brain/00-START-HERE.md`
2. `AI Master Brain/01-PROJECT-LOCK.md`
3. `AI Master Brain/02-DECISION-REGISTER.md`
4. `AI Master Brain/03-PRODUCT.md`
5. `AI Master Brain/04-DOMAIN-MODEL.md`
6. `AI Master Brain/05-WORKFLOWS.md`
7. `AI Master Brain/06-ARCHITECTURE.md`
8. `AI Master Brain/07-SECURITY-PRIVACY.md`
9. `AI Master Brain/08-SDDS-IDWELL-OPERATIONAL-CRM-REFERENCE.md`
10. `AI Master Brain/09-DESIGN-SYSTEM.md`
11. `AI Master Brain/10-ROUTE-PAGE-CONTRACTS.md`
12. `AI Master Brain/11-DATA-QUERY-CONTRACTS.md`
13. `AI Master Brain/12-COMPONENT-CONTRACTS.md`
14. Task-specific contracts named by the ledger
15. `AI Master Brain/15-TESTING-ACCEPTANCE.md`
16. `AI Master Brain/16-EXECUTION-PLAN.md`
17. `AI Master Brain/17-TASK-LEDGER.md`
18. `AI Master Brain/18-SESSION-HANDOFF.md`
19. `AI Master Brain/19-OPEN-DECISIONS.md`

Do not reread every large file during a narrow task when the ledger names a smaller required subset, but always read items 00, 01, 02, 17, and 18.

## 4. Authority order

When instructions conflict, use:

1. latest explicit owner decision recorded in `02-DECISION-REGISTER.md`;
2. security and data-integrity restrictions;
3. `01-PROJECT-LOCK.md`;
4. `03-PRODUCT.md`;
5. `04-DOMAIN-MODEL.md` and `05-WORKFLOWS.md`;
6. `06-ARCHITECTURE.md` and `07-SECURITY-PRIVACY.md`;
7. `08-SDDS-IDWELL-OPERATIONAL-CRM-REFERENCE.md`;
8. page, query, and component contracts;
9. the active ledger task;
10. verified repository evidence;
11. existing implementation.

Do not use old chat content or legacy documents to override this order.

## 5. Owner questions

Ask the owner only when:

- the active task is blocked by an item explicitly marked `OWNER DECISION REQUIRED`;
- legal, tax, billing, credential-recovery, production-data, or irreversible migration consequences cannot be resolved safely;
- the repository, Supabase project, or Vercel project cannot be identified from configured project state.

Do not ask about Vercel versus Netlify. Vercel is locked.
Do not ask whether Supabase is required. It is locked.
Do not ask for requirements already present in the brain.

## 6. Scope control

- One task, one focused diff, one verification cycle, one commit, one push.
- Do not perform opportunistic refactors.
- Do not add packages unless the task requires them and the architecture permits them.
- Do not invent fields, statuses, calculations, routes, or business rules.
- Do not use mock operational data outside isolated tests or explicitly labelled development fixtures.
- Never replace real data with hardcoded values to make UI look complete.
- Never weaken RLS, authentication, encryption, validation, or storage privacy to pass a task.

## 7. Greenfield rule

This is a greenfield build. Do not apply brownfield instructions that assume an existing production application, old dashboard, old database, or historical UI must be preserved. Preserve only code and migrations already accepted and committed in this new repository.

## 8. Git and secrets

- Never commit `.env*`, credentials, tokens, encryption keys, service-role keys, database passwords, or private exports.
- Maintain `.env.example` with placeholders only.
- Never use destructive Git commands without explicit owner approval.
- Never rewrite published history.
- Every DONE task must record its commit hash in the ledger.

## 9. Completion report

Report only:

**Result:** done, blocked, or correction required.
**Changed:** exact files and behaviour.
**Verification:** checks and results.
**Git:** branch, commit, push result.
**Next:** next READY task ID, or exact blocker.

Never claim production-ready, secure, pixel-perfect, or regression-free without the defined evidence.
