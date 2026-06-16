# START HERE — SDDS

**Project type:** Private Internal Operations CRM  
**Build mode:** Greenfield  
**Deployment:** Vercel  
**Backend:** Supabase  
**Design direction:** iDWELL-inspired operational CRM, adapted to Indian ITR practice management

## One-sentence operating model

SDDS manages one permanent client record and one operational filing case per client per assessment year, with linked filings, documents, invoices, payments, refunds, intimations/notices, communications, follow-ups, and activity history.

## How continuity works

The project does not depend on chat memory.

- Locked truth lives in numbered project-brain files.
- Approved changes live in the decision register.
- Work order and status live in the task ledger.
- The latest technical state and next action live in the session handoff.
- Evidence lives in Git commits, migrations, tests, screenshots, and deployment records.

## Owner command

Use only:

`Continue SDDS.`

The agent must autonomously select and complete the active or next READY task according to `AGENTS.md`.

## Never do

- Do not mix another dashboard design into SDDS.
- Do not start with decorative dashboard cards.
- Do not design screens before defining their real entities, queries, actions, states, and permissions.
- Do not treat a filed case as complete before required post-filing closure.
- Do not overwrite original filing records with revisions.
- Do not expose permanent public document URLs.
- Do not store or log plaintext ITR portal passwords.
