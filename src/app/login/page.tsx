import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction, loginWithGitHubAction, registerAction } from "@/app/actions";
import {
  AuthTabsPanel,
  HeroSection,
  Panel,
  SeedAccountsPanel,
  aryStyles,
} from "@/app/_components/ary-shared";
import { loadDatabaseUser } from "@/lib/auth";
import { getLoginRedirectTarget } from "@/lib/viewer-access";

interface Props {
  searchParams?: Promise<{ oauthError?: string; returnTo?: string }>;
}

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: Props) {
  const sessionUser = await loadDatabaseUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnTo = resolvedSearchParams?.returnTo;
  const oauthError = resolvedSearchParams?.oauthError;
  const oauthErrorMessage =
    oauthError === "github_denied"
      ? "你取消了 GitHub 授权，请重试。"
      : oauthError === "github_missing_code"
        ? "GitHub 回调缺少必要参数，请重新发起登录。"
        : oauthError === "github_callback_failed"
          ? "GitHub 登录回调失败，请检查环境变量与回调地址配置。"
          : oauthError === "github_not_configured"
            ? "GitHub 登录尚未配置。请在 .env 中设置 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET，或使用本地账号登录。"
            : null;

  const redirectTarget = getLoginRedirectTarget(Boolean(sessionUser));
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <main className="auth-page">
      <HeroSection mode="auth" />

      <section className="auth-entry-layout">
        <div className="card" style={{padding:32}}>
          <div className="auth-panel">
            <div className="auth-panel__header">
              <h2 style={{fontSize:"1.5rem"}}>身份入口</h2>
              <p className="muted" style={{fontSize:"0.9375rem"}}>
                登录或创建骑手账号。公开浏览不需要登录，报名、提交和评审从登录后开始。
              </p>
            </div>

            {oauthErrorMessage ? <p className="muted" style={{color:"#DC2626"}}>{oauthErrorMessage}</p> : null}

            <AuthTabsPanel
              githubAction={loginWithGitHubAction}
              loginAction={loginAction}
              registerAction={registerAction}
              returnTo={returnTo}
            />
          </div>
        </div>

        <aside className="auth-sidebar">
          <div className="card" style={{padding:24}}>
            <div className="auth-sidebar__header">
              <h2 style={{fontSize:"1.125rem"}}>使用说明</h2>
              <p className="muted" style={{fontSize:"0.875rem"}}>
                这里负责登录现有账号或创建新的骑手账号。赛事报名、作品提交和评审入口在登录后根据身份进入对应控制台。
              </p>
            </div>
            <div className="auth-sidebar__card">
              <ul className="auth-sidebar__list">
                <li>公开浏览赛事、作品和赛果时，不需要登录。</li>
                <li>公开注册默认只创建骑手账号。</li>
                <li>主办方、评委和管理员权限由系统分配。</li>
              </ul>
            </div>
          </div>

          <div className="card" style={{padding:24,background:"var(--muted)",border:"none"}}>
            <div className="auth-sidebar__meta">
              <strong style={{fontSize:"0.9375rem"}}>推荐路径</strong>
              <p className="muted" style={{fontSize:"0.875rem"}}>
                先注册或登录，再回到具体赛事页面完成报名。如果你已有主办方、评委或管理员身份，登录后会自动进入对应控制台入口。
              </p>
            </div>
          </div>

          <SeedAccountsPanel />

          <Link className="button-secondary auth-sidebar__back" href="/">
            ← 返回公开首页
          </Link>
        </aside>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
