# GRS004 / P0-B sequence 防重放校验 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `ingestRidingSignalMessage()` 中为同一 `caConnectionId + caSessionId` 下的 signal sequence 增加单调性与 replay guard。  
**Architecture:** 为 `CAIngestionEvent` 增加 `caSessionId` 和唯一边界；在 signal ingestion 成功写业务状态前做 sequence 校验；异常 sequence 只留审计和取证事件，不推进业务投影。  
**Tech Stack:** Prisma schema + migration, TypeScript CA ingestion guard, node:test + tsx, focused CA integrity verification + production build

---

## 文件结构

- Modify: `prisma/schema.prisma`
  - 为 `CAIngestionEvent` 增加 `caSessionId` 与唯一约束
- Modify: `src/lib/services/ca-ingestion.ts`
  - 在 signal ingestion 中接入 sequence monotonicity / replay guard
- Modify: `src/lib/services/ca-fetch.ts`
  - 写 snapshot ingestion event 时补 `caSessionId`
- Modify: `src/lib/services/ca-ingestion-integrity.test.ts`
  - 补 replay / out-of-order 覆盖
- Optional Modify: `src/lib/ca-integrity-helpers.ts`
  - 若需要抽 sequence helper
- Modify: `docs/superpowers/status.md`
  - 记录 `P0-B` 设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p0b-sequence-replay-guard-design.md`
  - 回写 implementation notes
- Modify: `grs004readme.md`
  - 同步当前新增能力与测试命令

### Task 1: Add Failing Replay-Guard Coverage

**Files:**
- Modify: `src/lib/services/ca-ingestion-integrity.test.ts`

- [ ] **Step 1: Add repeated-sequence replay test**

Cover:

- 同一 session 下第二条相同 sequence 不再推进业务状态
- 写 `ca_signal.ingest` / `integrity_gap`
- `reason = sequence_replayed`

- [ ] **Step 2: Add out-of-order sequence test**

Cover:

- 同一 session 下较小 sequence 不再推进业务状态
- 写 `ca_signal.ingest` / `integrity_gap`
- `reason = sequence_out_of_order`

- [ ] **Step 3: Run focused test and confirm failure**

Run:

- `node --import tsx --test src/lib/services/ca-ingestion-integrity.test.ts`

Expected: FAIL before implementation.

### Task 2: Implement Sequence Replay Guard

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/services/ca-ingestion.ts`
- Modify: `src/lib/services/ca-fetch.ts`

- [ ] **Step 1: Add `caSessionId` and uniqueness boundary**

Add:

- `CAIngestionEvent.caSessionId`
- unique constraint for `[caConnectionId, caSessionId, sequence]`

- [ ] **Step 2: Enforce replay / monotonicity guard**

Before business write:

- load max accepted sequence for same connection+session
- classify replay / out-of-order
- on conflict, write integrity-gap evidence + audit only

- [ ] **Step 3: Keep risk semantics aligned**

Do not:

- auto DQ
- expand to snapshot business semantics

### Task 3: Verify the Slice

**Files:**
- Test: `src/lib/services/ca-ingestion-integrity.test.ts`

- [ ] **Step 1: Run focused verification**

Run:

- `node --import tsx --test src/lib/services/ca-ingestion-integrity.test.ts`

Expected: PASS

- [ ] **Step 2: Run production build**

Run:

- `npm run build`

Expected: PASS

### Task 4: Update Docs and Snapshot

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p0b-sequence-replay-guard-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- `P0-B` design and implementation
- sequence now acts as replay guard

- [ ] **Step 2: Update the P0-B design doc**

Append:

- exact landed schema/runtime behavior
- fresh verification commands

- [ ] **Step 3: Add a new recovery snapshot**

Include:

- authoritative files
- what landed
- what remains outside this slice
- exact verification commands
