import { createHash, verify } from "node:crypto";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";

export function buildCredentialFingerprint(publicKeyPem: string) {
  return createHash("sha256")
    .update(publicKeyPem.trim())
    .digest("hex");
}

export function buildSignedPayloadDigest(payload: Record<string, unknown>) {
  const unsignedPayload = { ...payload };
  delete (unsignedPayload as { signature?: unknown }).signature;
  return buildPayloadDigest(unsignedPayload);
}

export function requiresProductionConnectorSignature(input: {
  connectorBaseUrl: string;
  ingestionSource: string;
}) {
  if (input.ingestionSource === "CONNECTOR") {
    return true;
  }

  const connectorBaseUrl = input.connectorBaseUrl.trim();
  if (!connectorBaseUrl) {
    return false;
  }

  try {
    const parsed = new URL(connectorBaseUrl);
    const hostname = parsed.hostname.toLowerCase();
    return !["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return false;
  }
}

export function verifySignedPayload(input: {
  payload: Record<string, unknown> & { signature?: unknown; signatureVersion?: unknown };
  publicKeyPem: string;
}) {
  if (input.payload.signatureVersion !== "ed25519:v1") {
    return false;
  }

  if (typeof input.payload.signature !== "string" || input.payload.signature.length === 0) {
    return false;
  }

  const digest = buildSignedPayloadDigest(input.payload);
  return verify(
    null,
    Buffer.from(digest, "utf8"),
    input.publicKeyPem,
    Buffer.from(input.payload.signature, "base64"),
  );
}
