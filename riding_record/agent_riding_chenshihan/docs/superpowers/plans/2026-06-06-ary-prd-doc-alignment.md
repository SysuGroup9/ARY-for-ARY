# ARY PRD Doc Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and maintain agent-facing documents that force future implementation work to start from `PRD.md`, understand the current repository’s privacy tradeoffs, and avoid drifting back into outdated PoC assumptions.

**Architecture:** Keep `PRD.md` untouched as the requirement baseline, then layer agent-facing superpowers docs on top of it: one context/design doc and one execution plan. These docs should guide future implementation without mutating the public-facing repo docs by default.

**Tech Stack:** Markdown, PRD-driven workflow, existing Next.js + Prisma + SQLite codebase context

---

### Task 1: Maintain A Stable Agent-Facing PRD Context Spec

**Files:**
- Create: `docs/superpowers/specs/2026-06-06-ary-prd-context-design.md`
- Test: `PRD.md`

- [ ] **Step 1: Re-read `PRD.md` before editing the spec**

Run: `Get-Content -LiteralPath 'D:\Desktop\ARY-for-ARY\PRD.md' -Encoding UTF8`
Expected: full PRD text visible before spec editing starts

- [ ] **Step 2: Keep the spec focused on reading order and mismatch prevention**

```md
## Required Reading Order

1. `PRD.md`
2. this file
3. `src/lib/services/submissions.ts`
4. `src/lib/services/scoring.ts`
5. runner routes under `src/app/api/runner/tasks/`
```

- [ ] **Step 3: Capture the non-negotiable mismatches explicitly**

```md
### 1. PRD says localStorage, running PoC uses SQLite
### 2. PRD runner API is conceptual, repo API is actual
### 3. Public leaderboard cadence is not yet automated
### 4. Current harness is showcase-derived, not an independent second pipeline
### 5. ARY still keeps best-archive raw content
```

- [ ] **Step 4: Add privacy-preserving instructions for future agents**

```md
For every change touching artifacts, answer:

- who can see it
- who stores it
- when it is deleted
- whether it becomes a public projection later
```

- [ ] **Step 5: Verify the spec file reads cleanly**

Run: `Get-Content -LiteralPath 'D:\Desktop\ARY-for-ARY\docs\superpowers\specs\2026-06-06-ary-prd-context-design.md'`
Expected: complete markdown with no placeholders or contradictory instructions

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-06-06-ary-prd-context-design.md
git commit -m "docs: add agent-facing PRD context spec"
```

### Task 2: Maintain A Plan For Future PRD-Aligned Work

**Files:**
- Create: `docs/superpowers/plans/2026-06-06-ary-prd-doc-alignment.md`
- Test: `src/lib/services/submissions.ts`

- [ ] **Step 1: Anchor the plan in the current codebase, not a hypothetical rewrite**

```md
**Goal:** Create and maintain agent-facing documents that force future implementation work to start from `PRD.md`

**Architecture:** Keep `PRD.md` untouched as the requirement baseline, then layer agent-facing superpowers docs on top of it
```

- [ ] **Step 2: Include a task that explicitly checks the real submission lifecycle**

```md
Read:

- `src/lib/services/submissions.ts`
- `src/lib/services/scoring.ts`

Confirm:

- submissions are stored first
- artifacts are nulled after scoring
- best results remain in `TeamArchive`
```

- [ ] **Step 3: Include a task that blocks future overclaiming**

```md
Never describe:

- automated leaderboard cadence
- fully separate harness pipeline
- zero raw artifact retention

unless the code has actually been changed and verified
```

- [ ] **Step 4: Include verification steps for the plan itself**

Run: `Get-Content -LiteralPath 'D:\Desktop\ARY-for-ARY\docs\superpowers\plans\2026-06-06-ary-prd-doc-alignment.md'`
Expected: plan contains only concrete steps and no `TODO` / `TBD`

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-06-06-ary-prd-doc-alignment.md
git commit -m "docs: add agent-facing PRD doc alignment plan"
```

### Task 3: Use These Docs As The Default Future Entry Point

**Files:**
- Modify: `docs/superpowers/specs/2026-06-06-ary-prd-context-design.md`
- Modify: `docs/superpowers/plans/2026-06-06-ary-prd-doc-alignment.md`
- Test: `README.md`

- [ ] **Step 1: Add a note in the spec that public docs are secondary**

```md
Do not start from `README.md` or `ROADMAP.md` and infer the product from there.
```

- [ ] **Step 2: Add a note in the plan that public docs should not be the first target by default**

```md
These superpowers docs are the agent-facing default entry point.
Public repo docs should only be updated when the user explicitly asks or when implementation drift must be surfaced publicly.
```

- [ ] **Step 3: Verify both docs still agree with each other**

Run: `Get-Content -LiteralPath 'D:\Desktop\ARY-for-ARY\docs\superpowers\specs\2026-06-06-ary-prd-context-design.md'; Get-Content -LiteralPath 'D:\Desktop\ARY-for-ARY\docs\superpowers\plans\2026-06-06-ary-prd-doc-alignment.md'`
Expected: the plan and spec both treat `PRD.md` as the baseline and public docs as secondary

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-06-06-ary-prd-context-design.md docs/superpowers/plans/2026-06-06-ary-prd-doc-alignment.md
git commit -m "docs: make PRD-first agent docs the default entry point"
```
