import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProfileCompletionHref,
  getPostAuthRedirectTarget,
} from "@/lib/profile-completion";

test("buildProfileCompletionHref preserves safe returnTo paths and normalizes invalid values", () => {
  assert.equal(
    buildProfileCompletionHref("/console/races"),
    "/profile?returnTo=%2Fconsole%2Fraces",
  );
  assert.equal(buildProfileCompletionHref("https://example.com"), "/profile");
  assert.equal(buildProfileCompletionHref("//evil"), "/profile");
});

test("getPostAuthRedirectTarget sends incomplete users to profile completion before their return target", () => {
  assert.equal(
    getPostAuthRedirectTarget({
      profileCompleted: false,
      returnTo: "/races/race_active--sorting-challenge/register",
    }),
    "/profile?returnTo=%2Fraces%2Frace_active--sorting-challenge%2Fregister",
  );

  assert.equal(
    getPostAuthRedirectTarget({
      profileCompleted: true,
      returnTo: "/console",
    }),
    "/console",
  );
});
