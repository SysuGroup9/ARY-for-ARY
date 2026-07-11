import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthTabsPanel } from "@/app/_components/ary-shared";

test("auth entry tabs use readable Chinese labels", () => {
  const html = renderToStaticMarkup(
    <AuthTabsPanel
      loginAction={async () => {}}
      registerAction={async () => {}}
    />,
  );

  assert.match(html, /登录/);
  assert.match(html, /注册/);
  assert.match(html, /用户名/);
  assert.match(html, /密码/);
  assert.doesNotMatch(html, />Login</);
  assert.doesNotMatch(html, />Register</);
  assert.doesNotMatch(html, /Username/);
  assert.doesNotMatch(html, /Password/);
});

test("auth entry can hide local account forms when only GitHub should remain", () => {
  const html = renderToStaticMarkup(
    <AuthTabsPanel
      githubAction={async () => {}}
      localFallbackDescription="当前环境不再开放本地账号登录 / 注册，请使用 GitHub 登录继续。"
      localFallbackTitle="本地账号已关闭"
      showLocalFallback={false}
    />,
  );

  assert.match(html, /使用 GitHub 登录/);
  assert.match(html, /本地账号已关闭/);
  assert.doesNotMatch(html, /用户名/);
  assert.doesNotMatch(html, /密码/);
  assert.doesNotMatch(html, /创建骑手账号/);
});

test("auth entry can render a shared inline error notice", () => {
  const html = renderToStaticMarkup(
    <AuthTabsPanel
      defaultTab="register"
      feedback={{
        message: "该用户名已被占用，请更换后重试。",
        title: "注册未成功",
      }}
      loginAction={async () => {}}
      registerAction={async () => {}}
    />,
  );

  assert.match(html, /注册未成功/);
  assert.match(html, /该用户名已被占用，请更换后重试。/);
  assert.match(html, /role="alert"/);
});

test("login page source uses readable Chinese copy", () => {
  const source = readFileSync("src/app/login/page.tsx", "utf8");

  assert.match(source, /身份入口/);
  assert.match(source, /使用说明/);
  assert.match(source, /返回公开首页/);
  assert.doesNotMatch(source, /Auth Entry/);
  assert.doesNotMatch(source, /Public Entry/);
});

test("login page keeps demo accounts panel behind the local fallback gate", () => {
  const source = readFileSync("src/app/login/page.tsx", "utf8");

  assert.match(source, /localAuthFallbackEnabled \? <SeedAccountsPanel \/> : null/);
});

test("user service source gates local username/password auth behind the fallback flag", () => {
  const source = readFileSync("src/lib/services/users.ts", "utf8");

  assert.match(source, /isLocalAuthFallbackEnabled/);
  assert.match(source, /EntryFeedbackError/);
  assert.match(source, /local_auth_disabled/);
  assert.match(source, /username_taken/);
  assert.match(source, /invalid_credentials/);
});

test("shared auth source has no merge conflict markers", () => {
  const source = readFileSync("src/app/_components/ary-shared.tsx", "utf8");

  assert.doesNotMatch(source, /<<<<<<<|=======|>>>>>>>/);
});

test("riders and works index pages use readable Chinese headings", () => {
  const ridersSource = readFileSync("src/app/riders/page.tsx", "utf8");
  const worksSource = readFileSync("src/app/works/page.tsx", "utf8");

  assert.match(ridersSource, /骑手/);
  assert.match(ridersSource, /精选骑手/);
  assert.doesNotMatch(ridersSource, /title="Riders"/);
  assert.doesNotMatch(ridersSource, /eyebrow="Featured Riders"/);

  assert.match(worksSource, /作品/);
  assert.match(worksSource, /公开作品/);
  assert.doesNotMatch(worksSource, /title="Works"/);
  assert.doesNotMatch(worksSource, /eyebrow="Public Works"/);
});

test("create-race form source no longer contains visible mojibake text", () => {
  const source = readFileSync(
    "src/app/_components/create-race-form-client.tsx",
    "utf8",
  );

  const mojibakeMarkers = ["浣", "闂", "鎺", "娴", "銆"];
  for (const marker of mojibakeMarkers) {
    assert.equal(
      source.includes(marker),
      false,
      `unexpected mojibake marker ${marker} in create-race form`,
    );
  }
});
