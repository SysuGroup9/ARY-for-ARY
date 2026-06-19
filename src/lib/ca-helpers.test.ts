import assert from "node:assert/strict";
import test from "node:test";
import {
  canRegisterCAConnectionForPhase,
  getAggregateIngestionStatus,
  getDefaultCAConnectionStatus,
  isConnectionEligibleForValidData,
} from "./ca-helpers";

test("allows CAConnection registration during the current participation phases", () => {
  assert.equal(canRegisterCAConnectionForPhase("active"), true);
  assert.equal(canRegisterCAConnectionForPhase("frozen"), true);
  assert.equal(canRegisterCAConnectionForPhase("registration"), false);
  assert.equal(canRegisterCAConnectionForPhase("finished"), false);
});

test("uses connected as the transitional default CAConnection status", () => {
  assert.equal(getDefaultCAConnectionStatus(), "CONNECTED");
});

test("computes aggregate ingestion status from connection states", () => {
  assert.equal(getAggregateIngestionStatus([]), "NOT_CONFIGURED");
  assert.equal(getAggregateIngestionStatus(["CONNECTED"]), "CONNECTED");
  assert.equal(getAggregateIngestionStatus(["CONNECTED", "FAILED"]), "CONNECTED");
  assert.equal(getAggregateIngestionStatus(["ACTIVE", "FAILED"]), "ACTIVE");
  assert.equal(getAggregateIngestionStatus(["FAILED"]), "FAILED");
  assert.equal(getAggregateIngestionStatus(["NOT_CONFIGURED", "FAILED"]), "FAILED");
});

test("only treats connected or active non-disabled connections as valid ingestion inputs", () => {
  assert.equal(
    isConnectionEligibleForValidData({
      disabledAt: null,
      handshakeCompletedAt: new Date("2026-06-19T09:00:00Z"),
      ingestionStatus: "CONNECTED",
    }),
    true,
  );
  assert.equal(
    isConnectionEligibleForValidData({
      disabledAt: null,
      handshakeCompletedAt: null,
      ingestionStatus: "CONNECTED",
    }),
    false,
  );
  assert.equal(
    isConnectionEligibleForValidData({
      disabledAt: new Date("2026-06-19T09:00:00Z"),
      handshakeCompletedAt: new Date("2026-06-19T08:00:00Z"),
      ingestionStatus: "ACTIVE",
    }),
    false,
  );
});
