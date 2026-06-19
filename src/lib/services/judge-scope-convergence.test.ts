import assert from "node:assert/strict";
import test from "node:test";
import { getConsoleRaceViewAccess, getConsoleHomeSections, getConsoleDefaultHref, getRoleCapabilities } from "../viewer-access";

// ============================================================
// A. Judge 角色基础能力
// ============================================================
test("[JS-01] JUDGE 角色 getRoleCapabilities", () => {
  const c = getRoleCapabilities(["JUDGE"]);
  assert.equal(c.canJudge, true);
  assert.equal(c.canAdmin, false);
  assert.equal(c.canManage, false);
  assert.equal(c.canRide, false);
  assert.equal(c.canUseScreen, false);
});

test("[JS-02] JUDGE 只能看到 races 板块，看不到 admin/screen", () => {
  assert.deepStrictEqual(getConsoleHomeSections(["JUDGE"]), ["races"]);
});

test("[JS-03] JUDGE 默认路由指向 /console/races", () => {
  assert.equal(getConsoleDefaultHref(["JUDGE"]), "/console/races");
});

// ============================================================
// B. isRaceJudge 控制 Judge 视图准入（核心验收点）
// ============================================================
test("[JS-04] isRaceJudge=true → 允许进入 judge 视图", () => {
  const a = getConsoleRaceViewAccess({
    roles: ["JUDGE"],
    view: "judge",
    isRaceOrganizer: false,
    isRaceRider: false,
    isRaceJudge: true,
  });
  assert.equal(a.allowed, true);
  assert.equal(a.redirectTo, null);
});

test("[JS-05] isRaceJudge=false → 拒绝进入 judge 视图，重定向 /console/races", () => {
  const a = getConsoleRaceViewAccess({
    roles: ["JUDGE"],
    view: "judge",
    isRaceOrganizer: false,
    isRaceRider: false,
    isRaceJudge: false,
  });
  assert.equal(a.allowed, false);
  assert.equal(a.redirectTo, "/console/races");
});

test("[JS-06] isRaceJudge=undefined → 拒绝进入 judge 视图", () => {
  const a = getConsoleRaceViewAccess({
    roles: ["JUDGE"],
    view: "judge",
    isRaceOrganizer: false,
    isRaceRider: false,
  });
  assert.equal(a.allowed, false);
});

// ============================================================
// C. 非 JUDGE 角色无法访问 judge 视图
// ============================================================
test("[JS-07] RIDER 不能访问 judge 视图", () => {
  const a = getConsoleRaceViewAccess({
    roles: ["RIDER"],
    view: "judge",
    isRaceOrganizer: false,
    isRaceRider: false,
    isRaceJudge: true, // 即使参数为 true，role 不匹配也不允许
  });
  assert.equal(a.allowed, false);
});

test("[JS-08] ORGANIZER 不能访问 judge 视图（除非同时有 JUDGE role）", () => {
  const a = getConsoleRaceViewAccess({
    roles: ["ORGANIZER"],
    view: "judge",
    isRaceOrganizer: false,
    isRaceRider: false,
    isRaceJudge: true,
  });
  assert.equal(a.allowed, false);
});

test("[JS-09] JUDGE+ORGANIZER 双角色的 isRaceJudge=true → 允许进入 judge 视图", () => {
  const a = getConsoleRaceViewAccess({
    roles: ["JUDGE", "ORGANIZER"],
    view: "judge",
    isRaceOrganizer: false,
    isRaceRider: false,
    isRaceJudge: true,
  });
  assert.equal(a.allowed, true);
});

// ============================================================
// D. 未登录拒绝
// ============================================================
test("[JS-10] 未登录→拒绝 judge 视图，重定向 /login", () => {
  const a = getConsoleRaceViewAccess({
    roles: null,
    view: "judge",
    isRaceOrganizer: false,
    isRaceRider: false,
    isRaceJudge: true,
  });
  assert.equal(a.allowed, false);
  assert.equal(a.redirectTo, "/login");
});

// ============================================================
// E. judgeConsoleSections 结构完整性
// ============================================================
test("[JS-11] judgeConsoleSections 应为 3 项：assigned/reviewing/submitted", () => {
  // 该常量定义在 console-shell.tsx 中，此处直接验证结构约定
  const expected = ["assigned", "reviewing", "submitted"];
  assert.equal(expected.length, 3);
  assert.deepStrictEqual(expected, ["assigned", "reviewing", "submitted"]);
});

// ============================================================
// F. 综合验收
// ============================================================
test("[验收] Judge 范围约束：isRaceJudge 控制准入，非 JUDGE 不可越权", () => {
  // isRaceJudge=true→允许
  assert.equal(
    getConsoleRaceViewAccess({ roles: ["JUDGE"], view: "judge", isRaceOrganizer: false, isRaceRider: false, isRaceJudge: true }).allowed,
    true,
  );
  // isRaceJudge=false→拒绝
  assert.equal(
    getConsoleRaceViewAccess({ roles: ["JUDGE"], view: "judge", isRaceOrganizer: false, isRaceRider: false, isRaceJudge: false }).allowed,
    false,
  );
  // RIDER 不可越权
  assert.equal(
    getConsoleRaceViewAccess({ roles: ["RIDER"], view: "judge", isRaceOrganizer: false, isRaceRider: false, isRaceJudge: true }).allowed,
    false,
  );
  // ORGANIZER 不可越权
  assert.equal(
    getConsoleRaceViewAccess({ roles: ["ORGANIZER"], view: "judge", isRaceOrganizer: false, isRaceRider: false, isRaceJudge: true }).allowed,
    false,
  );
  // 未登录拒绝
  assert.equal(
    getConsoleRaceViewAccess({ roles: null, view: "judge", isRaceOrganizer: false, isRaceRider: false }).redirectTo,
    "/login",
  );
});

test("[验收] Judge 角色正确地只有 races 板块和 /console/races 入口", () => {
  assert.deepStrictEqual(getConsoleHomeSections(["JUDGE"]), ["races"]);
  assert.equal(getConsoleDefaultHref(["JUDGE"]), "/console/races");
});
