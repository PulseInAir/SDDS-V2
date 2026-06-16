# SDDS Greenfield Project Brain

This package is the repository-level control system for building SDDS as a greenfield, iDWELL-inspired Indian ITR operations CRM.

## Purpose

The package prevents chat-memory drift by storing product truth, design direction, workflows, architecture, task order, completion evidence, and the exact next action inside Git-tracked files.

## Install

Copy:

- `AGENTS.md` to the repository root.
- the complete `AI Master Brain/` folder to the repository root.

Archive or remove the obsolete files listed in `AI Master Brain/20-LEGACY-CONFLICTS.md` after confirming they are not referenced by active automation.

## Daily use

After initial setup, the owner only needs to say:

`Continue SDDS.`

The coding agent must read `AGENTS.md`, select the active or next READY task from `17-TASK-LEDGER.md`, execute only that task, verify it, commit it, push it, and update the ledger and handoff.

## Core rule

Conversation memory is advisory. Git-tracked project files are authoritative.
