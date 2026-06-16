# Universal SDDS Continuation Instruction

The owner should normally send only:

`Continue SDDS.`

If an agent does not automatically load repository instructions, use this one-time bootstrap message:

> Continue SDDS autonomously. Read the root `AGENTS.md`, then follow its mandatory reading order. Inspect Git state. Resume the single `IN_PROGRESS` task, or execute the first dependency-satisfied `READY` task in `AI Master Brain/17-TASK-LEDGER.md`. Do not ask me for a new task prompt. Do only that task, run its required verification, commit and push the focused change, update the ledger and `18-SESSION-HANDOFF.md`, report evidence, and stop. Ask me only if the active task is blocked by an explicit owner decision or a material safety risk.

## Why this works

- Requirements are not reconstructed from chat.
- The next task is deterministic.
- Dependencies prevent premature dashboard work.
- Each result is tied to verification and a Git commit.
- New sessions read the last handoff and continue safely.
- Changes to project truth require an explicit registered decision.
