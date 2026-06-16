# SDDS Open Decisions

Agents must not invent these answers. Most do not block early development.

| ID | Decision | Recommended default | Blocking task |
|---|---|---|---|
| O-001 | Supabase Auth sign-in method | Email + password for the single owner unless current owner account setup suggests magic link | G09 before final auth UX |
| O-002 | Invoice legal identity, address, logo, signature, and GST/tax treatment | Keep tax fields configurable/hidden until confirmed; do not state GST assumptions | G20 final invoice template |
| O-003 | Exact assessment-year rollover date/rules | Use configured AY records; do not infer solely from current date until owner confirms automation rule | G23/G24 automation |
| O-004 | Backup destination, retention, and encryption | Protected off-platform destination with periodic encrypted logical export and restore test | G31 |
| O-005 | WhatsApp method and consent/logging | MVP one-click `wa.me` launch plus manual communication log; no automated sending | G23 if automation requested |
| O-006 | Final notice/intimation/refund taxonomy beyond minimum contract | Start with minimum controlled values and approve additions before migration lock | G21/G22 |
| O-007 | Production sender/email notification service | None for MVP unless a real workflow requires it | future |
| O-008 | Future staff roles | Keep owner membership only; define roles only when staff are actually added | future |

## Decision protocol

When an item blocks the active task, the agent must present:

- one recommended decision;
- why it is safest;
- exact affected files/migrations;
- consequence of deferring;
- one direct owner approval question.
