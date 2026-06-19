import { loginAction, registerAction } from "@/app/actions";
import {
  AuthTabsPanel,
  HeroSection,
  Panel,
  aryStyles,
} from "@/app/_components/ary-shared";
import { loadDatabaseUser } from "@/lib/auth";
import { getLoginRedirectTarget } from "@/lib/viewer-access";
import { redirect } from "next/navigation";

interface Props {
  searchParams?: Promise<{ returnTo?: string }>;
}

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: Props) {
  const sessionUser = await loadDatabaseUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnTo = resolvedSearchParams?.returnTo;

  const redirectTarget = getLoginRedirectTarget(Boolean(sessionUser));
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <main>
      <HeroSection mode="auth" />

      <section className="auth-entry-layout">
        <Panel title="身份入口" eyebrow="Auth Entry">
          <AuthTabsPanel
            loginAction={loginAction}
            registerAction={registerAction}
            returnTo={returnTo}
          />
        </Panel>

        <div className="sidebar">
          <Panel title="使用说明" eyebrow="Public Entry">
            <div className="stack">
              <strong>这里负责登录现有账号，或创建骑手身份账号。</strong>
              <p className="muted">
                公开浏览无需登录；如果你要以骑手身份报名赛事，请先在这里登录或注册，再进入对应赛事完成报名。
              </p>
              <p className="muted">
                主办方、评委和管理员的控制台访问权取决于既有角色分配，不会在这里自动开通。
              </p>
              <a className="button" href="/">
                返回公开首页
              </a>
            </div>
          </Panel>
        </div>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
