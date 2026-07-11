import assert from "node:assert/strict";
import test from "node:test";
import {
  buildActionFeedbackHref,
  getActionFeedbackContent,
} from "./action-feedback";

test("buildActionFeedbackHref maps technical errors into friendly route feedback", () => {
  assert.equal(
    buildActionFeedbackHref({
      error: new Error("Race not found"),
      returnTo: "/races/demo/register",
      scope: "public_register",
    }),
    "/races/demo/register?feedbackScope=public_register&feedbackMessage=%E5%BD%93%E5%89%8D%E8%B5%9B%E4%BA%8B%E4%B8%8D%E5%8F%AF%E7%94%A8%EF%BC%8C%E8%AF%B7%E8%BF%94%E5%9B%9E%E8%B5%9B%E4%BA%8B%E9%A1%B5%E5%90%8E%E9%87%8D%E8%AF%95%E3%80%82",
  );

  assert.equal(
    buildActionFeedbackHref({
      error: new Error("当前作品已锁定，不能继续修改"),
      returnTo: "/console/races/demo/rider/submission",
      scope: "rider_submission",
    }),
    "/console/races/demo/rider/submission?feedbackScope=rider_submission&feedbackMessage=%E5%BD%93%E5%89%8D%E4%BD%9C%E5%93%81%E5%B7%B2%E9%94%81%E5%AE%9A%EF%BC%8C%E4%B8%8D%E8%83%BD%E7%BB%A7%E7%BB%AD%E4%BF%AE%E6%94%B9",
  );

  assert.equal(
    buildActionFeedbackHref({
      error: new Error("CAConnection not found for current operator"),
      returnTo: "/console/races/demo/organizer/ca-status",
      scope: "organizer_ca_status",
    }),
    "/console/races/demo/organizer/ca-status?feedbackScope=organizer_ca_status&feedbackMessage=%E5%BD%93%E5%89%8D%E8%BF%9E%E6%8E%A5%E5%99%A8%E4%B8%8D%E5%AD%98%E5%9C%A8%EF%BC%8C%E6%88%96%E4%BD%A0%E5%B7%B2%E7%BB%8F%E6%97%A0%E6%9D%83%E7%BB%A7%E7%BB%AD%E6%93%8D%E4%BD%9C%E5%AE%83%E3%80%82",
  );
});

test("getActionFeedbackContent returns consistent titles by scope", () => {
  assert.deepEqual(
    getActionFeedbackContent({
      message: "账号状态异常",
      scope: "public_register",
    }),
    {
      message: "账号状态异常",
      title: "报名未完成",
    },
  );

  assert.deepEqual(
    getActionFeedbackContent({
      message: "快照抓取失败",
      scope: "rider_ca_setup",
    }),
    {
      message: "快照抓取失败",
      title: "CA 接入未完成",
    },
  );

  assert.deepEqual(
    getActionFeedbackContent({
      message: "主题包路径无效",
      scope: "cooperation_request",
    }),
    {
      message: "主题包路径无效",
      title: "合作申请未提交",
    },
  );

  assert.deepEqual(
    getActionFeedbackContent({
      message: "请先报名参赛后再反馈",
      scope: "rider_review",
    }),
    {
      message: "请先报名参赛后再反馈",
      title: "结果反馈未完成",
    },
  );

  assert.deepEqual(
    getActionFeedbackContent({
      message: "当前反馈处理失败",
      scope: "organizer_feedback",
    }),
    {
      message: "当前反馈处理失败",
      title: "反馈处理未完成",
    },
  );

  assert.deepEqual(
    getActionFeedbackContent({
      message: "当前评审进度操作失败",
      scope: "organizer_judging",
    }),
    {
      message: "当前评审进度操作失败",
      title: "评审进度操作未完成",
    },
  );

  assert.deepEqual(
    getActionFeedbackContent({
      message: "大屏切换失败",
      scope: "screen_console",
    }),
    {
      message: "大屏切换失败",
      title: "大屏设置未完成",
    },
  );

  assert.equal(
    getActionFeedbackContent({
      message: "x",
      scope: "not_real",
    }),
    null,
  );
});
