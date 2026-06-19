# GRS003 User Roles Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move ARY from a single-role user model toward `grs003` `User.roles` semantics so Admin/Judge identity and console access are no longer fake placeholders.

**Architecture:** Add a roles-backed user representation, update auth/session and capability helpers to authorize by membership, make public registration rider-only, and turn Admin Console into a minimal real role-governance surface while keeping GitHub OAuth out of this pass.

**Tech Stack:** Prisma + SQLite, Next.js App Router, jose session auth, Zod, node:test + tsx, Prisma generate/migrate, Next build verification

---

### Task 1: Add Role Utility Tests and Helpers

**Files:**
- Create: `src/lib/user-roles.ts`
- Create: `src/lib/user-roles.test.ts`
- Test: `src/lib/user-roles.test.ts`

- [ ] **Step 1: Write failing tests for parsing and normalizing roles**
- [ ] **Step 2: Run the focused test file and confirm failure**
- [ ] **Step 3: Implement role parsing, normalization, membership, and default active-role helpers**
- [ ] **Step 4: Re-run the focused test file**

### Task 2: Change Registration Validation to Rider-Only Public Signup

**Files:**
- Modify: `src/lib/validation.ts`
- Modify: `src/lib/validation.test.ts`
- Modify: `src/app/_components/ary-shared.tsx`
- Test: `src/lib/validation.test.ts`

- [ ] **Step 1: Update tests so register schema expects only username and password**
- [ ] **Step 2: Run the focused test file and confirm failure**
- [ ] **Step 3: Remove public role selection from validation and auth UI**
- [ ] **Step 4: Re-run the focused test file**

### Task 3: Introduce Roles-Backed User Storage and Auth Semantics

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/services/users.ts`
- Modify: `src/lib/viewer-access.ts`
- Modify: `src/lib/viewer-access.test.ts`
- Test: `src/lib/viewer-access.test.ts`

- [ ] **Step 1: Update schema to support judge/admin and roles-backed storage**
- [ ] **Step 2: Update auth/session to expose roles collection and authorize by membership**
- [ ] **Step 3: Update capability helpers to consume roles collections**
- [ ] **Step 4: Re-run focused helper tests**

### Task 4: Make Admin Console Role Governance Real

**Files:**
- Modify: `src/app/_components/console/admin-console-page.tsx`
- Modify: `src/app/console/admin/[section]/page.tsx`
- Modify: `src/app/actions.ts`
- Modify: `src/lib/services/users.ts`
- Test: build verification

- [ ] **Step 1: Add list-all-users and update-user-roles services**
- [ ] **Step 2: Add admin action for role updates**
- [ ] **Step 3: Replace the pure placeholder roles page with real editable membership UI**
- [ ] **Step 4: Keep profile-completion section explicit about what is still pending**

### Task 5: Refresh Seed Data and Local Prisma Client

**Files:**
- Modify: `prisma/seed.ts`
- Generated: Prisma client output
- Test: Prisma generate / build verification

- [ ] **Step 1: Add seeded admin and judge users**
- [ ] **Step 2: Align existing organizer/rider seeds to the new roles-backed representation**
- [ ] **Step 3: Run Prisma generate and apply the local schema update as needed**

### Task 6: Sync Superpowers Docs

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-06-19-grs003-user-roles-foundation-design.md`

- [ ] **Step 1: Record what really changed in identity semantics**
- [ ] **Step 2: Explicitly call out remaining GitHub OAuth and profile-completion gaps**

### Task 7: Verify the Slice

**Files:**
- Test only

- [ ] **Step 1: Run focused role/helper tests**

Run: `node --import tsx --test src/lib/user-roles.test.ts src/lib/validation.test.ts src/lib/viewer-access.test.ts`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS
