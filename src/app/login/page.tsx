import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction, loginWithGitHubAction, registerAction } from "@/app/actions";
import {
  AuthTabsPanel,
  ErrorNotice,
  HeroSection,
  SeedAccountsPanel,
  aryStyles,
} from "@/app/_components/ary-shared";
import { loadDatabaseUser } from "@/lib/auth";
import {
  isGitHubOAuthConfigured,
  isLocalAuthFallbackEnabled,
} from "@/lib/auth-entry";
import { getEntryFeedbackContent } from "@/lib/entry-feedback";
import { getPostAuthRedirectTarget } from "@/lib/profile-completion";
import { getLoginRedirectTarget } from "@/lib/viewer-access";
import type { EntryFeedbackMode } from "@/lib/entry-feedback";

interface Props {
  searchParams?: Promise<{
    feedbackCode?: string;
    feedbackMode?: string;
    oauthError?: string;
    returnTo?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: Props) {
  const sessionUser = await loadDatabaseUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnTo = resolvedSearchParams?.returnTo;
  const feedbackCode = resolvedSearchParams?.feedbackCode;
  const feedbackMode =
    resolvedSearchParams?.feedbackMode === "register" ? "register" : "login";
  const oauthError = resolvedSearchParams?.oauthError;
  const githubConfigured = isGitHubOAuthConfigured();
  const localAuthFallbackEnabled = isLocalAuthFallbackEnabled();
  const oauthErrorMessage =
    oauthError === "github_denied"
      ? "你取消了 GitHub 授权，请重试。"
      : oauthError === "github_start_failed"
        ? "GitHub 登录无法启动，请稍后再试。"
        : oauthError === "github_missing_code"
          ? "GitHub 回调缺少必要参数，请重新发起登录。"
          : oauthError === "github_state_mismatch"
            ? "GitHub 登录状态已失效，请从登录页重新发起。"
            : oauthError === "github_exchange_failed"
              ? "GitHub 授权返回未完成，请稍后再试。"
              : oauthError === "github_profile_failed"
                ? "GitHub 账号信息获取失败，请稍后再试。"
                : oauthError === "github_callback_failed"
                  ? "GitHub 登录回调失败，请检查环境变量与回调地址配置。"
                  : oauthError === "github_not_configured"
                    ? "GitHub 登录尚未配置。请在 .env 中设置 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET。"
                    : null;
  const entryFeedback = getEntryFeedbackContent({
    code: feedbackCode,
    mode: feedbackMode as EntryFeedbackMode,
  });
  const authFeedback =
    entryFeedback ??
    (oauthErrorMessage
      ? {
          message: oauthErrorMessage,
          title: "GitHub 登录未完成",
        }
      : null);

  const redirectTarget = sessionUser
    ? getPostAuthRedirectTarget({
        profileCompleted: sessionUser.profileCompleted,
        returnTo,
      })
    : getLoginRedirectTarget(Boolean(sessionUser));
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <main className="auth-page">
      <HeroSection mode="auth" />

      <section className="auth-entry-layout">
        <div className="card" style={{ padding: 32 }}>
          <div className="auth-panel">
            <div className="auth-panel__header">
              <h2 style={{ fontSize: "1.5rem" }}>身份入口</h2>
              <p className="muted" style={{ fontSize: "0.9375rem" }}>
                登录或创建骑手账号。公开浏览不需要登录，报名、提交和评审从登录后开始。
              </p>
            </div>
            {authFeedback ? (
              <ErrorNotice message={authFeedback.message} title={authFeedback.title} />
            ) : null}

            <AuthTabsPanel
              defaultTab={feedbackMode}
              githubAction={githubConfigured ? loginWithGitHubAction : undefined}
              localFallbackDescription={
                localAuthFallbackEnabled
                  ? "本地账号表单当前仅作为开发与演示兜底，不是正式身份入口。"
                  : "当前环境不再开放本地账号登录 / 注册，请使用 GitHub 登录继续。"
              }
              localFallbackTitle={
                localAuthFallbackEnabled ? "开发 fallback" : "本地账号已关闭"
              }
              loginAction={localAuthFallbackEnabled ? loginAction : undefined}
              registerAction={localAuthFallbackEnabled ? registerAction : undefined}
              returnTo={returnTo}
              showLocalFallback={localAuthFallbackEnabled}
            />
          </div>
        </div>

        <aside className="auth-sidebar">
          <div className="card" style={{ padding: 24 }}>
            <div className="auth-sidebar__header">
              <h2 style={{ fontSize: "1.125rem" }}>使用说明</h2>
              <p className="muted" style={{ fontSize: "0.875rem" }}>
                这里负责通过 GitHub 完成正式身份登录。赛事报名、作品提交和评审入口在登录后根据身份进入对应控制台。
              </p>
            </div>
            <div className="auth-sidebar__card">
              <ul className="auth-sidebar__list">
                <li>公开浏览赛事、作品和赛果时，不需要登录。</li>
                <li>正式账号入口使用 GitHub 登录。</li>
                <li>主办方、评委和管理员权限由系统分配。</li>
              </ul>
            </div>
          </div>

          <div
            className="card"
            style={{ padding: 24, background: "var(--muted)", border: "none" }}
          >
            <div className="auth-sidebar__meta">
              <strong style={{ fontSize: "0.9375rem" }}>推荐路径</strong>
              <p className="muted" style={{ fontSize: "0.875rem" }}>
                先使用 GitHub 登录，再回到具体赛事页面完成报名。如果你已有主办方、评委或管理员身份，登录后会自动进入对应控制台入口。
              </p>
            </div>
          </div>

          {localAuthFallbackEnabled ? <SeedAccountsPanel /> : null}

          <Link className="button-secondary auth-sidebar__back" href="/">
            ← 返回公开首页
          </Link>
        </aside>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
