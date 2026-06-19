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
          : null;

  const redirectTarget = getLoginRedirectTarget(Boolean(sessionUser));
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <main className="auth-page">
      <HeroSection mode="auth" />

      <section className="auth-entry-layout">
        <Panel title="身份入口" eyebrow="登录 / 注册">
          <div className="auth-panel">
            <div className="auth-panel__header">
              <h2>进入你的赛事工作流</h2>
              <p className="muted">
                继续使用已有账号，或先创建骑手账号。公开浏览仍保留在公开站，登录后再进入报名、提交和评审流程。
              </p>
            </div>

            {oauthErrorMessage ? <p className="muted">{oauthErrorMessage}</p> : null}

            <AuthTabsPanel
              githubAction={loginWithGitHubAction}
              loginAction={loginAction}
              registerAction={registerAction}
              returnTo={returnTo}
            />
          </div>
        </Panel>

        <aside className="auth-sidebar">
          <Panel title="使用说明" eyebrow="访问边界">
            <div className="auth-sidebar__header">
              <p className="muted">
                这里负责登录现有账号，或创建新的骑手账号。赛事报名、作品提交和评审入口，都在登录后根据身份进入对应控制台。
              </p>
            </div>
            <div className="auth-sidebar__card">
              <ul className="auth-sidebar__list">
                <li>公开浏览赛事、作品和赛果时，不需要登录。</li>
                <li>公开注册默认只创建骑手账号，不自动授予后台角色。</li>
                <li>主办方、评委和管理员权限由系统已有角色分配决定。</li>
              </ul>
            </div>
          </Panel>

          <div className="auth-sidebar__tip">
            <div className="auth-sidebar__meta">
              <strong>当前推荐路径</strong>
              <p className="muted">
                先注册或登录，再回到具体赛事页面完成报名；如果你已经具备主办方、评委或管理员身份，登录后会进入对应控制台入口。
              </p>
            </div>
          </div>

          <SeedAccountsPanel />

          <Link className="button-secondary auth-sidebar__back" href="/">
            返回公开首页
          </Link>
        </aside>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
