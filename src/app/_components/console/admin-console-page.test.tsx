import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { AppRole } from "@/lib/user-roles";
import { AdminConsolePageView } from "./admin-console-page";

const demoUsers = [
  {
    id: "admin_01",
    profileCompleted: true,
    roles: ["ADMIN", "ORGANIZER"] as AppRole[],
    username: "admin_demo",
  },
  {
    id: "judge_01",
    profileCompleted: false,
    roles: ["JUDGE"] as AppRole[],
    username: "judge_demo",
  },
];

test("admin console uses Chinese governance copy for the users section", () => {
  const html = renderToStaticMarkup(
    <AdminConsolePageView section="users" users={demoUsers} />,
  );

  assert.match(html, /管理控制台/);
  assert.match(html, /最小账号治理/);
  assert.match(html, /用户列表/);
  assert.match(html, /资料状态/);
  assert.match(html, /管理员/);
  assert.match(html, /主办方/);
  assert.match(html, /评委/);
  assert.doesNotMatch(html, /Admin Console/);
  assert.doesNotMatch(html, /Users/);
  assert.doesNotMatch(html, /Roles:/);
});

test("admin console uses Chinese profile-completion labels", () => {
  const html = renderToStaticMarkup(
    <AdminConsolePageView section="profile-completion" users={demoUsers} />,
  );

  assert.match(html, /资料补全/);
  assert.match(html, /当前覆盖情况/);
  assert.match(html, /已补全/);
  assert.match(html, /待补全/);
  assert.doesNotMatch(html, /Profile Completion/);
  assert.doesNotMatch(html, /Completed/);
  assert.doesNotMatch(html, /Incomplete/);
});

test("admin console uses Chinese role-governance labels and actions", () => {
  const html = renderToStaticMarkup(
    <AdminConsolePageView section="roles" users={demoUsers} />,
  );

  assert.match(html, /角色维护/);
  assert.match(html, /保存角色/);
  assert.match(html, /管理员/);
  assert.match(html, /评委/);
  assert.match(html, /主办方/);
  assert.match(html, /骑手/);
  assert.doesNotMatch(html, /Role Governance/);
  assert.doesNotMatch(html, /Save Roles/);
});
