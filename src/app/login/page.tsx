import { loginAction, registerAction } from "@/app/actions";
import {
  AuthTabsPanel,
  HeroSection,
  Panel,
  SeedAccountsPanel,
  aryStyles,
} from "@/app/_components/ary-shared";
import { loadDatabaseUser } from "@/lib/auth";
import { getLoginRedirectTarget } from "@/lib/viewer-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const sessionUser = await loadDatabaseUser();

  const redirectTarget = getLoginRedirectTarget(Boolean(sessionUser));
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <main>
      <HeroSection mode="auth" />

      <section className="auth-entry-layout">
        <Panel title="账户中心" eyebrow="Auth">
          <AuthTabsPanel
            loginAction={loginAction}
            registerAction={registerAction}
          />
        </Panel>

        <div className="sidebar">
          <Panel title="登录说明" eyebrow="Entry">
            <div className="stack">
              <strong>这里是唯一的身份进入入口。</strong>
              <p className="muted">
                公开观众浏览统一在首页完成；如果你要报名、提交代码或管理比赛，请先在这里登录或注册。
              </p>
              <a className="button" href="/">
                返回公开首页
              </a>
            </div>
          </Panel>
          <SeedAccountsPanel />
        </div>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
