# GRS004 / P2-E 生产 Connector 强制签名策略 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不修改签名协议的前提下，把远程 / 非本地 connector 默认收口到“必须登记 credential 并走签名链路”，同时保留 localhost demo 的 bearer-only 兼容。  
**Architecture:** 新增最小 signature policy helper；在 handshake / signal / snapshot 运行时做统一 enforcement；调整测试把非签名目标的用例迁移到 localhost/manual 连接。  
**Tech Stack:** TypeScript service-layer policy helper, Prisma-backed service tests, node:test + tsx, focused security verification + production build

---

## 文件结构

- Modify: `src/lib/ca-signature-helpers.ts`
  - 新增 production signature policy helper
- Modify: `src/lib/ca-signature-helpers.test.ts`
  - 补 helper 覆盖
- Modify: `src/lib/services/ca-fetch.ts`
  - handshake / snapshot enforcement
- Modify: `src/lib/services/ca-ingestion.ts`
  - signal enforcement
- Modify: `src/lib/services/ca-fetch-audit.test.ts`
  - 补 production vs localhost 边界测试
- Modify: `src/lib/services/ca-signature-verification.test.ts`
  - 补 signal policy 测试
- Modify: `src/lib/services/ca-ingestion-integrity.test.ts`
  - 改用 localhost/manual connection
- Modify: `src/lib/services/ca-fetch-integrity.test.ts`
  - 改用 localhost/manual connection
- Modify: `docs/superpowers/status.md`
  - 记录 P2-E 设计、实现、验证与 recovery snapshot
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p2e-production-signature-enforcement-design.md`
  - 回写 implementation notes
- Modify: `grs004readme.md`
  - 同步用户可见与部署测试说明

### Task 1: Add Failing Policy Coverage

**Files:**
- Modify: `src/lib/ca-signature-helpers.test.ts`
- Modify: `src/lib/services/ca-fetch-audit.test.ts`
- Modify: `src/lib/services/ca-signature-verification.test.ts`

- [ ] **Step 1: Add a failing helper test**

Cover:

- remote `https://connector.example/*` requires production signature policy
- localhost / 127.0.0.1 does not
- `ingestionSource === CONNECTOR` requires production signature policy

- [ ] **Step 2: Add failing service tests**

Cover:

- production handshake without credential → `credential_required`
- localhost handshake without credential still accepted
- production signal without registered credential rejected
- production snapshot without registered credential rejected

- [ ] **Step 3: Run focused tests and confirm failure**

Run:

- `node --import tsx --test src/lib/ca-signature-helpers.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts`

Expected: FAIL before implementation.

### Task 2: Implement Signature Enforcement Policy

**Files:**
- Modify: `src/lib/ca-signature-helpers.ts`
- Modify: `src/lib/services/ca-fetch.ts`
- Modify: `src/lib/services/ca-ingestion.ts`

- [ ] **Step 1: Add production signature policy helper**

Implement:

- localhost detection
- production connector detection based on existing fields

- [ ] **Step 2: Enforce handshake policy**

When production policy applies and no credential is registered or provided:

- reject with `credential_required`

- [ ] **Step 3: Enforce signal policy**

When production policy applies and no credential is registered:

- reject with `credential_required`

- [ ] **Step 4: Enforce snapshot policy**

When production policy applies and no credential is registered:

- reject with `credential_required`

### Task 3: Repair Non-Signature Tests

**Files:**
- Modify: `src/lib/services/ca-ingestion-integrity.test.ts`
- Modify: `src/lib/services/ca-fetch-integrity.test.ts`
- Modify: `src/lib/services/ca-fetch-audit.test.ts`

- [ ] **Step 1: Move integrity-focused tests onto localhost/manual connections**

Keep those tests focused on:

- payloadDigest
- dedupe
- integrity_gap
- stale snapshot

without accidentally depending on production signature policy.

### Task 4: Verify the Slice

**Files:**
- Test: `src/lib/ca-signature-helpers.test.ts`
- Test: `src/lib/services/ca-fetch-audit.test.ts`
- Test: `src/lib/services/ca-signature-verification.test.ts`
- Test: `src/lib/services/ca-ingestion-integrity.test.ts`
- Test: `src/lib/services/ca-fetch-integrity.test.ts`

- [ ] **Step 1: Run focused verification**

Run:

- `node --import tsx --test src/lib/ca-signature-helpers.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts src/lib/services/ca-ingestion-integrity.test.ts src/lib/services/ca-fetch-integrity.test.ts`

Expected: PASS

- [ ] **Step 2: Run production build**

Run:

- `npm run build`

Expected: PASS

### Task 5: Update Docs and Snapshot

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p2e-production-signature-enforcement-design.md`
- Modify: `grs004readme.md`

- [ ] **Step 1: Update `status.md`**

Record:

- `P2-E` design and implementation
- production connector signature enforcement landed
- localhost demo compatibility retained

- [ ] **Step 2: Update the P2-E design doc**

Append:

- exact landed helper and service behavior
- fresh verification commands

- [ ] **Step 3: Update README and add a recovery snapshot**

Include:

- user-visible deployment/testing note
- remaining work outside this slice
