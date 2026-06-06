import assert from "node:assert/strict";
import test from "node:test";
import { shouldConfirmHideRiderCode } from "./rider-code-visibility";

test("requires confirmation only when disabling already-public rider code", () => {
  assert.equal(
    shouldConfirmHideRiderCode({
      nextChecked: false,
      wasPublic: true,
    }),
    true,
  );

  assert.equal(
    shouldConfirmHideRiderCode({
      nextChecked: true,
      wasPublic: true,
    }),
    false,
  );

  assert.equal(
    shouldConfirmHideRiderCode({
      nextChecked: false,
      wasPublic: false,
    }),
    false,
  );
});
