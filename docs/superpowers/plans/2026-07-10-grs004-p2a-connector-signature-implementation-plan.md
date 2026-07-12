# GRS004 / P2-A Connector Credential Fingerprint 与消息签名 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`✅`) syntax for tracking.

**Goal:** 为当前 connector 认证链路补上 credential fingerprint、公钥登记和 signal/snapshot 消息验签，让已登记 credential 的 CAConnection 不再只依赖 bearer secret。

**Architecture:** 直接扩展 `CAConnection` 保存当前 credential 元数据，通过 `ca-signature-helpers.ts` 统一计算 fingerprint、构造 signable digest 并验签。运行时仅改 `completeCAConnectionHandshake()`、`ingestRidingSignalMessage()`、`fetchCASessionSnapshotForConnection()` 三条真实边界链路；旧 connection 保持 bearer-only 兼容模式。

**Tech Stack:** Prisma + SQLite, Next.js server services, Node `crypto`, node:test + tsx, Prisma migrate/generate, local seed/build verification

---

## 文件结构

- `prisma/schema.prisma`
  - 为 `CAConnection` 增加 `credentialFingerprint / publicKeyPem / signatureVersion`
- `src/lib/ca-signature-helpers.ts`
  - 纯函数：fingerprint、signable digest、验签
- `src/lib/ca-signature-helpers.test.ts`
  - 验证 fingerprint 与 Ed25519 验签
- `src/lib/services/ca-fetch.ts`
  - handshake 登记 credential；snapshot 验签
- `src/lib/services/ca-ingestion.ts`
  - signal 验签
- `src/lib/services/ca-signature-verification.test.ts`
  - 覆盖 handshake 登记、signal signed/unsigned、snapshot signed/invalid 场景
- `docs/superpowers/status.md`
  - 记录 `P2-A` 的落地、验证与剩余缺口
- `docs/superpowers/specs/2026-07-10-grs004-p2a-connector-signature-design.md`
  - 回写 implementation notes

### Task 1: Add Pure CA Signature Helper Tests

**Files:**
- Create: `src/lib/ca-signature-helpers.ts`
- Create: `src/lib/ca-signature-helpers.test.ts`
- Test: `src/lib/ca-signature-helpers.test.ts`

✅ **Step 1: Write the failing helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  buildCredentialFingerprint,
  buildSignedPayloadDigest,
  verifySignedPayload,
} from "./ca-signature-helpers";

test("buildCredentialFingerprint returns a stable sha256 fingerprint for PEM keys", () => {
  const { publicKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ format: "pem", type: "spki" }).toString();

  const fingerprint = buildCredentialFingerprint(publicKeyPem);

  assert.match(fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(fingerprint, buildCredentialFingerprint(publicKeyPem));
});

test("verifySignedPayload accepts ed25519:v1 signatures over the payload digest", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ format: "pem", type: "spki" }).toString();
  const payload = {
    schemaVersion: "ary.ca.riding_signal.v0.1",
    messageId: "msg_1",
    idempotencyKey: "idem_1",
    signedAt: "2026-07-10T00:00:00.000Z",
    signatureVersion: "ed25519:v1",
  };
  const digest = buildSignedPayloadDigest(payload);
  const signature = sign(null, Buffer.from(digest, "utf8"), privateKey).toString("base64");

  assert.equal(
    verifySignedPayload({
      payload: { ...payload, signature },
      publicKeyPem,
    }),
    true,
  );
});
```

✅ **Step 2: Run the focused helper test and confirm failure**

Run: `node --import tsx --test src/lib/ca-signature-helpers.test.ts`

Expected: FAIL with missing module / function errors.

✅ **Step 3: Implement the helper module**

✅ **Step 4: Re-run the helper test**

Run: `node --import tsx --test src/lib/ca-signature-helpers.test.ts`

Expected: PASS

### Task 2: Extend Prisma Schema for Connector Credential Fields

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `src/generated/prisma/*`

✅ **Step 1: Add the CAConnection fields**

```prisma
model CAConnection {
  credentialFingerprint String @default("")
  publicKeyPem          String @default("")
  signatureVersion      String @default("")
}
```

✅ **Step 2: Generate Prisma client**

Run: `npm run db:generate`

Expected: PASS

✅ **Step 3: Create and apply migration**

Run: `npx prisma migrate dev --name grs004_p2a_connector_signature`

Expected: PASS

### Task 3: Register Credential in Handshake

**Files:**
- Modify: `src/lib/services/ca-fetch.ts`
- Modify: `src/lib/services/ca-fetch-audit.test.ts`
- Test: `src/lib/services/ca-fetch-audit.test.ts`

✅ **Step 1: Extend the handshake test with credential registration assertions**

Cover:

- handshake with `credentialFingerprint / publicKeyPem / signatureVersion` stores all three fields
- fingerprint mismatch is rejected with `credential_fingerprint_mismatch`

✅ **Step 2: Run the focused handshake test and confirm failure**

Run: `node --import tsx --test src/lib/services/ca-fetch-audit.test.ts`

Expected: FAIL because credential fields are ignored today.

✅ **Step 3: Update handshake schema and persistence**

✅ **Step 4: Re-run the focused handshake test**

Run: `node --import tsx --test src/lib/services/ca-fetch-audit.test.ts`

Expected: PASS

### Task 4: Verify Signed Signal Messages

**Files:**
- Modify: `src/lib/services/ca-ingestion.ts`
- Create: `src/lib/services/ca-signature-verification.test.ts`
- Test: `src/lib/services/ca-signature-verification.test.ts`

✅ **Step 1: Write failing signal signature tests**

Cover:

- signed signal accepted when credential is registered
- missing signature rejected when credential is registered
- invalid signature rejected when credential is registered

✅ **Step 2: Run the focused signature test and confirm failure**

Run: `node --import tsx --test src/lib/services/ca-signature-verification.test.ts`

Expected: FAIL because signal payloads do not carry or verify signatures yet.

✅ **Step 3: Add signal signature fields and verification**

✅ **Step 4: Re-run the focused signature test**

Run: `node --import tsx --test src/lib/services/ca-signature-verification.test.ts`

Expected: PASS

### Task 5: Verify Signed Snapshot Responses

**Files:**
- Modify: `src/lib/services/ca-fetch.ts`
- Modify: `src/lib/services/ca-signature-verification.test.ts`
- Test: `src/lib/services/ca-signature-verification.test.ts`

✅ **Step 1: Add failing snapshot signature tests**

Cover:

- signed snapshot accepted when credential is registered
- invalid snapshot signature rejected when credential is registered
- unsigned snapshot still accepted when no credential is registered

✅ **Step 2: Run the focused signature test and confirm failure**

Run: `node --import tsx --test src/lib/services/ca-signature-verification.test.ts`

Expected: FAIL because snapshot responses are not verified yet.

✅ **Step 3: Add snapshot signature fields and verification**

✅ **Step 4: Re-run the focused signature test**

Run: `node --import tsx --test src/lib/services/ca-signature-verification.test.ts`

Expected: PASS

### Task 6: Update Status and Verify the Slice

**Files:**
- Modify: `docs/superpowers/status.md`
- Modify: `docs/superpowers/specs/2026-07-10-grs004-p2a-connector-signature-design.md`

✅ **Step 1: Update `status.md`**

Record:

- `CAConnection` now stores credential fingerprint/public key/signature version
- registered-credential connections now require signed signal/snapshot
- rotation and revoked/disabled UI remain out of scope

✅ **Step 2: Run focused P2-A tests**

Run: `node --import tsx --test src/lib/ca-signature-helpers.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts`

Expected: PASS

✅ **Step 3: Regenerate Prisma client**

Run: `npm run db:generate`

Expected: PASS

✅ **Step 4: Re-run seed**

Run: `npm run db:seed`

Expected: PASS

✅ **Step 5: Run full build**

Run: `npm run build`

Expected: PASS
