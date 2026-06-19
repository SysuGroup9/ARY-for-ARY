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

test("login page source uses readable Chinese copy", () => {
  const source = readFileSync("src/app/login/page.tsx", "utf8");

  assert.match(source, /身份入口/);
  assert.match(source, /使用说明/);
  assert.match(source, /返回公开首页/);
  assert.doesNotMatch(source, /Auth Entry/);
  assert.doesNotMatch(source, /Public Entry/);
});

test("login page renders the shared demo accounts panel", () => {
  const source = readFileSync("src/app/login/page.tsx", "utf8");

  assert.match(source, /SeedAccountsPanel/);
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
