import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicHeader } from "./public-header";

test("anonymous public header keeps the identity entry pointed at /login", () => {
  const html = renderToStaticMarkup(<PublicHeader roles={null} />);

  assert.match(html, /href="\/login"/);
  assert.match(html, /登录 \/ 注册/);
  assert.doesNotMatch(html, /进入控制台/);
  assert.doesNotMatch(html, /退出登录/);
});

test("authenticated public header keeps console entry and removes the login CTA", () => {
  const html = renderToStaticMarkup(<PublicHeader roles={["RIDER"]} />);

  assert.match(html, /退出登录/);
  assert.match(html, /href="\/console"/);
  assert.match(html, /进入控制台/);
  assert.doesNotMatch(html, /登录 \/ 注册/);
});

test("login page source keeps GitHub action wiring, callback errors, and local fallback gating", () => {
  const source = readFileSync("src/app/login/page.tsx", "utf8");

  assert.match(source, /github_start_failed/);
  assert.match(source, /github_state_mismatch/);
  assert.match(source, /github_exchange_failed/);
  assert.match(source, /github_profile_failed/);
  assert.match(source, /github_callback_failed/);
  assert.match(source, /github_not_configured/);
  assert.match(source, /feedbackCode/);
  assert.match(source, /feedbackMode/);
  assert.match(source, /getEntryFeedbackContent/);
  assert.match(source, /ErrorNotice/);
  assert.match(source, /defaultTab=\{feedbackMode\}/);
  assert.match(source, /githubConfigured \? loginWithGitHubAction : undefined/);
  assert.match(source, /returnTo=\{returnTo\}/);
  assert.match(source, /showLocalFallback=\{localAuthFallbackEnabled\}/);
  assert.match(source, /localAuthFallbackEnabled \? <SeedAccountsPanel \/> : null/);
});

test("github oauth service source rejects placeholder credentials as not configured", () => {
  const source = readFileSync("src/lib/github-oauth.ts", "utf8");

  assert.match(source, /isGitHubOAuthConfigured/);
  assert.match(source, /github_not_configured/);
});
