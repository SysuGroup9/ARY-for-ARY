import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  buildCredentialFingerprint,
  buildSignedPayloadDigest,
  requiresProductionConnectorSignature,
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

test("requiresProductionConnectorSignature treats remote connectors as production but preserves localhost demo compatibility", () => {
  assert.equal(
    requiresProductionConnectorSignature({
      connectorBaseUrl: "https://connector.example/active",
      ingestionSource: "MANUAL",
    }),
    true,
  );
  assert.equal(
    requiresProductionConnectorSignature({
      connectorBaseUrl: "http://localhost:4010",
      ingestionSource: "MANUAL",
    }),
    false,
  );
  assert.equal(
    requiresProductionConnectorSignature({
      connectorBaseUrl: "http://127.0.0.1:4010",
      ingestionSource: "MANUAL",
    }),
    false,
  );
  assert.equal(
    requiresProductionConnectorSignature({
      connectorBaseUrl: "",
      ingestionSource: "CONNECTOR",
    }),
    true,
  );
});
