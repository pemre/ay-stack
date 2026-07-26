---
name: hive-wave
description: The house style for parallel delegated work - run a batch ("wave") of 2-4 independent work items in parallel, each in an isolated worktree subagent, with the orchestrator session kept clean for oversight and merging. Work items are whatever the project uses - ticket IDs, issue numbers, or plain one-line task descriptions. Use when the user hands over several independent pieces of work at once (e.g. "/hive-wave T-030 T-032:sonnet" or "/hive-wave 'fix login redirect':sonnet 'add csv export'"), with per-item model assignments as first-class input. Orchestrator-model-agnostic - whichever model runs the session takes the orchestrator seat.
---

# Hive Wave — parallel isolated work batch

You are the orchestrator — whatever model is running this session. The invariants, in priority order: **(1) agents never touch the main checkout, (2) your context stays clean — distilled reports only, (3) user-only decisions reach the user before code is written against them, (4) you merge, you own the result.**

## Input — work items + model routing

A wave is 2-4 **work items**. An item is whatever identifies work in THIS project — a ticket ID (`T-032`), an issue number (`#123`), a Jira key, or a plain one-line task description in quotes. Don't assume any particular backlog convention; resolve each item against how the current project actually tracks work (a tickets/ dir, an issue tracker via `gh`, a TODO doc, or nothing at all).

- Per-item model: `<item>:sonnet` assigns that item's agent a model.
- Wave default: `model=sonnet` anywhere in the args sets the default for unassigned items (e.g. an Opus session orchestrating Sonnet workers). Absent both, agents inherit the session model.
- Remaining free text = extra context/constraints; weave it into the relevant prompts.
- Unassigned + genuinely judgment-heavy item (design fork, security surface): note in the launch summary which model it got, so the user can override early.

## Phase 1 — Prepare (orchestrator, cheap)

1. **Resolve each item to a spec.** Backlog-tracked items: read ONLY that item's ticket/issue (plus its declared dependencies' status — an unclosed dependency gets flagged to the user before launch). Inline one-liner items: the sentence is the spec; state your interpretation and assumptions in the launch summary so the user can correct early — don't interrogate first unless a wrong guess is expensive.
2. **Fence analysis**: from the specs (not by reading source), list which subsystems/dirs each item will touch. Overlap between two items → either narrow the fences explicitly or tell the user the pair can't run in the same wave. Anything touching a shared global (schema/save-format versions, lockfiles, generated indexes, central config) gets flagged as "merge last"; two items needing the same global bump = conflict to surface now.
3. **Decision-gate detection**: an item containing an unresolved design fork the user must ratify (schema bump A/B, UX direction, license choice) runs TWO-STAGE: the agent explores + recommends, ends its turn, you relay to the user, then continue the agent via SendMessage with the ruling. Everything else runs single-stage full implement.

## Phase 2 — Launch (one batch, all agents in one message)

Every agent: `isolation: "worktree"`, background (default), model per args. The prompt for each must carry:

- **Role + standard**: "implementing <item>; this ships; root cause over patch; verify by running."
- **Spec**: point at the ticket/issue file if one exists (the worktree has repo files — don't paste bodies), plus project instructions (CLAUDE.md or equivalent) and any parent/dependency items worth reading. Inline items get the task sentence plus your stated interpretation written out in full — the agent can't see the conversation.
- **Env notes (worktrees are bare)**: dependencies not installed → name the project's install command; gitignored runtime assets (local DB, fixtures, .env) are absent → name the exact read-only copy command from the main checkout for whatever verification needs. Main checkout path is OFF-LIMITS for writes — state it with the literal path.
- **Scope fence**: what NOT to touch, naming what the sibling agents own. If the agent concludes it needs something outside its fence (schema change, shared file), it must STOP and report, not do it.
- **Verification expectation**: the item's acceptance criteria plus the project's standard gates (tests, build, lint/parity harnesses — name them explicitly from project docs). "Run, don't assume"; report verified-with-output vs unverified separately; what needs a real browser/account stays listed as manual.
- **Commit + report shape**: coherent commits in the worktree (English, repo style). Final report: what was built (files + roles), verification evidence, open questions, license/attribution notes if sources were pulled in. Distilled — no file dumps. Genuine user-only decisions → stop and ask.
- Two-stage agents additionally: "Stage 1: explore + committed recommendation with flip-condition, END YOUR TURN, do not implement."

## Phase 3 — Oversee (as reports arrive)

- Never read agent transcripts/output files; consume only the completion reports. If a report is missing something load-bearing (evidence, branch name, license), SendMessage the agent — don't re-derive it yourself.
- Relay decision-gate recommendations to the user in 3-6 lines: the fork, the agent's pick, the flip condition, your own ruling if you disagree. Then continue the agent with the verdict.
- An agent's "all tests pass" without pasted output is an assertion — ask for the output or re-run it yourself at merge time.
- User asks for progress mid-wave → report launch status only; never predict results.

## Phase 4 — Merge (orchestrator authority, sequential)

1. Order: fewest-conflict-surface first; shared-global/version-bump items LAST.
2. For each: fetch the worktree branch, review the diff yourself at senior-reviewer standard (spawn a reviewer agent for large diffs — blind, no agent report attached; use fable-reviewer where available), then merge into the integration branch.
3. After EACH merge: run the project's test + build gates in the main checkout. Break → fix or bounce back to the agent via SendMessage; never merge the next on red.
4. Cross-item seams (two items touching adjacent UI, shared string tables, nav) get a manual look even if both diffs individually reviewed clean.
5. Close out per the project's tracking convention (ticket status + index, issue close, or nothing if untracked). Final user report: per item — merged/held, evidence summary, remaining manual steps, anything cut from scope.

## Anti-patterns (wave-specific)

- Launching sequentially or waiting on one before launching the rest.
- Reading source files yourself in Phase 1 "to write better prompts" — the specs + project docs are enough; agents discover the rest.
- Hardcoding one project's backlog notation into your parsing — resolve items against the project at hand.
- Letting an agent resolve a decision-gate because the recommendation sounded confident.
- Merging on the agent's word without reviewing the diff.
- Polling output files or scheduling wakeups to check on agents — completion notifications arrive on their own.
