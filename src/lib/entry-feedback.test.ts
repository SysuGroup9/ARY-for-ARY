import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEntryFeedbackHref,
  EntryFeedbackError,
  getEntryFeedbackContent,
  resolveEntryFeedbackCode,
} from "./entry-feedback";

test("buildEntryFeedbackHref keeps the correct page and returnTo", () => {
  assert.equal(
    buildEntryFeedbackHref({
      code: "invalid_credentials",
      mode: "login",
      returnTo: "/races/demo/register",
    }),
    "/login?feedbackCode=invalid_credentials&feedbackMode=login&returnTo=%2Fraces%2Fdemo%2Fregister",
  );

  assert.equal(
    buildEntryFeedbackHref({
      code: "profile_validation_failed",
      mode: "profile",
      returnTo: "/console",
    }),
    "/profile?feedbackCode=profile_validation_failed&returnTo=%2Fconsole",
  );
});

test("resolveEntryFeedbackCode prefers structured entry feedback errors", () => {
  assert.equal(
    resolveEntryFeedbackCode(new EntryFeedbackError("username_taken"), "register"),
    "username_taken",
  );

  assert.equal(
    resolveEntryFeedbackCode(
      {
        issues: [
          {
            code: "custom",
            message: "bad",
            path: ["username"],
          },
        ],
      },
      "login",
    ),
    "validation_failed",
  );

  assert.equal(resolveEntryFeedbackCode(new Error("boom"), "profile"), "unexpected");
});

test("getEntryFeedbackContent returns user-facing titles and messages", () => {
  assert.deepEqual(
    getEntryFeedbackContent({
      code: "invalid_credentials",
      mode: "login",
    }),
    {
      code: "invalid_credentials",
      message: "账号或密码错误，请检查后重试。",
      title: "登录未成功",
    },
  );

  assert.deepEqual(
    getEntryFeedbackContent({
      code: "profile_validation_failed",
      mode: "profile",
    }),
    {
      code: "profile_validation_failed",
      message: "请检查显示名称和机构信息后重新提交。",
      title: "资料保存未成功",
    },
  );

  assert.equal(
    getEntryFeedbackContent({
      code: "not_real",
      mode: "register",
    }),
    null,
  );
});
