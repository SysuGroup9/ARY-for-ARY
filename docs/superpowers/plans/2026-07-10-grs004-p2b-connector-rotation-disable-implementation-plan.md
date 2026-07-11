# GRS004 / P2-B Connector Secret Rotation 与 Disabled Connector 可视化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为当前 `CAConnection` 增加 secret rotation、disable/enable 操作与现有控制台可视化，让 connector 安全状态可被业务操作并被现有页面看见。

**Architecture:** 直接扩展 `CAConnection` 增加 `secretVersion / secretRotatedAt / disabledReason`。运行时复用现有 `disabledAt` 拒绝逻辑，并在 `ca-connections.ts + actions.ts + Rider/Organizer Console` 这条现有路径上补轮换、禁用、恢复与展示；不新建额外的 connector 管理子系统。

**Tech Stack:** Prisma + SQLite, Next.js server actions/services, node:test + tsx, React server rendering tests, Prisma migrate/generate, local seed/build verification

---

## 文件结构

- `prisma/schema.prisma`
  - 为 `CAConnection` 增加 `secretVersion / secretRotatedAt / disabledReason`
- `src/lib/services/ca-connections.ts`
  - 新增：
    - `rotateCAConnectionSecretForRider()`
    - `disableCAConnectionForOrganizer()`
    - `enableCAConnectionForOrganizer()`
- `src/lib/services/ca-rotation-disable.test.ts`
  - 覆盖 service 层轮换、禁用、恢复与审计写入
- `src/app/actions.ts`
  - 新增 server actions：
    - `rotateCAConnectionSecretAction`
    - `disableCAConnectionAction`
    - `enableCAConnectionAction`
- `src/app/_components/console/rider-console-page.tsx`
  - 补 rider 侧 secretVersion / disabled 状态展示与轮换按钮
- `src/app/_components/console/organizer-console-page.tsx`
  - 补 organizer 侧 CA 状态明细与 disable/enable 按钮
- `src/app/_components/console/rider-console-page.test.tsx`
  - 覆盖新增安全状态展示
- `src/app/_components/console/organizer-console-page.test.tsx`
  - 覆盖新增 CA 状态与操作按钮展示
- `docs/superpowers/status.md`
  - 记录 `P2-B` 的实现、验证与剩余缺口
- `docs/superpowers/specs/2026-07-10-grs004-p2b-connector-rotation-disable-design.md`
  - 回写 implementation notes

### Task 1: Extend Prisma Schema for Rotation / Disable Metadata

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `src/generated/prisma/*`

- [ ] **Step 1: Add the CAConnection fields**

```prisma
model CAConnection {
  secretVersion  Int      @default(1)
  secretRotatedAt DateTime?
  disabledReason String   @default("")
}
```

- [ ] **Step 2: Generate Prisma client**

Run: `npm run db:generate`

Expected: PASS

- [ ] **Step 3: Create and apply migration**

Run: `npx prisma migrate dev --name grs004_p2b_connector_rotation_disable`

Expected: PASS

### Task 2: Add Failing Service Tests for Rotation / Disable / Enable

**Files:**
- Create: `src/lib/services/ca-rotation-disable.test.ts`
- Test: `src/lib/services/ca-rotation-disable.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:

- rider rotates own secret:
  - `connectorSecret` changes
  - `secretVersion + 1`
  - `secretRotatedAt` set
  - `handshakeCompletedAt` cleared
  - audit `ca_connection.secret_rotated`
- organizer disables own race connection:
  - `disabledAt` set
  - `disabledReason` persisted
  - audit `ca_connection.disabled`
- organizer enables own race connection:
  - `disabledAt` cleared
  - `disabledReason` cleared
  - audit `ca_connection.enabled`

- [ ] **Step 2: Run the focused service test and confirm failure**

Run: `node --import tsx --test src/lib/services/ca-rotation-disable.test.ts`

Expected: FAIL because functions do not exist yet.

- [ ] **Step 3: Implement the service functions in `ca-connections.ts`**

- [ ] **Step 4: Re-run the focused service test**

Run: `node --import tsx --test src/lib/services/ca-rotation-disable.test.ts`

Expected: PASS

### Task 3: Wire Server Actions

**Files:**
- Modify: `src/app/actions.ts`

- [ ] **Step 1: Add server actions**

Add:

- `rotateCAConnectionSecretAction`
- `disableCAConnectionAction`
- `enableCAConnectionAction`

- [ ] **Step 2: Revalidate console paths after each mutation**

Expected revalidate targets:

- `/console/races`
- relevant race console paths

### Task 4: Surface Rotation / Disabled State in Rider Console

**Files:**
- Modify: `src/app/_components/console/rider-console-page.tsx`
- Modify: `src/app/_components/console/rider-console-page.test.tsx`
- Test: `src/app/_components/console/rider-console-page.test.tsx`

- [ ] **Step 1: Add failing UI assertions**

Cover:

- `secretVersion`
- `secretRotatedAt`
- `disabled` state / reason
- rotation button

- [ ] **Step 2: Run the focused rider console test and confirm failure**

Run: `node --import tsx --test src/app/_components/console/rider-console-page.test.tsx`

Expected: FAIL because the new copy/UI does not exist yet.

- [ ] **Step 3: Add the rider-side status block and rotation form**

- [ ] **Step 4: Re-run the focused rider console test**

Run: `node --import tsx --test src/app/_components/console/rider-console-page.test.tsx`

Expected: PASS

### Task 5: Surface Disable / Enable State in Organizer Console

**Files:**
- Modify: `src/app/_components/console/organizer-console-page.tsx`
- Modify: `src/app/_components/console/organizer-console-page.test.tsx`
- Test: `src/app/_components/console/organizer-console-page.test.tsx`

- [ ] **Step 1: Add failing UI assertions**

Cover:

- CA status cards show `secretVersion / disabledAt / disabledReason / handshakeCompletedAt`
- disable / enable action buttons appear in `ca-status`

- [ ] **Step 2: Run the focused organizer console test and confirm failure**

Run: `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`

Expected: FAIL because the new copy/UI does not exist yet.

- [ ] **Step 3: Add organizer-side CA status details and disable/enable forms**

- [ ] **Step 4: Re-run the focused organizer console test**

Run: `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`

Expected: PASS

### Task 6: Verify Rotation Alters Runtime Auth Behavior

**Files:**
- Modify: `src/lib/services/ca-fetch-audit.test.ts`
- Test: `src/lib/services/ca-fetch-audit.test.ts`

- [ ] **Step 1: Add a failing auth regression test**

Cover:

- rotate secret
- old secret handshake rejected
- new secret handshake accepted

- [ ] **Step 2: Run the focused fetch audit test and confirm failure**

Run: `node --import tsx --test src/lib/services/ca-fetch-audit.test.ts`

Expected: FAIL until rotation function rewrites the secret and clears handshake.

- [ ] **Step 3: Re-run after service/action implementation**

Run: `node --import tsx --test src/lib/services/ca-fetch-audit.test.ts`

Expected: PASS

### Task 7: Update Status and Verify the Slice

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p2b-connector-rotation-disable-design.md`

- [ ] **Step 1: Update `status.md`**

Record:

- `CAConnection` now tracks secret rotation and disable metadata
- rider can rotate secret
- organizer can disable/enable connectors
- revoked credential is represented by secret rotation; no separate `revokedAt`

- [ ] **Step 2: Run focused P2-B tests**

Run: `node --import tsx --test src/lib/services/ca-rotation-disable.test.ts src/lib/services/ca-fetch-audit.test.ts src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx`

Expected: PASS

- [ ] **Step 3: Regenerate Prisma client**

Run: `npm run db:generate`

Expected: PASS

- [ ] **Step 4: Re-run seed**

Run: `npm run db:seed`

Expected: PASS

- [ ] **Step 5: Run full build**

Run: `npm run build`

Expected: PASS
