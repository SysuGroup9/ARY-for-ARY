import { logoutAction } from "@/app/actions";
import type { AppRole } from "@/lib/user-roles";
import { getConsoleEntryTarget, getPublicAuthAction } from "@/lib/viewer-access";

export function PublicHeader({ roles }: { roles: readonly AppRole[] | null }) {
  const authAction = getPublicAuthAction({ roles });
  const consoleHref = getConsoleEntryTarget(roles);
  const isAuthenticated = Boolean(roles?.length);

  return (
    <header className="public-header">
      <div className="public-header__brand">
        <a href="/">ARY</a>
      </div>
      <nav className="public-header__nav" aria-label="公开导航">
        <a href="/races">赛事</a>
        <a href="/works">作品</a>
        <a href="/riders">骑手</a>
        <a href="/cooperation">合作</a>
      </nav>
      <div className="public-header__actions">
        {isAuthenticated ? (
          <form action={logoutAction}>
            <button className="button-secondary" type="submit">
              退出登录
            </button>
          </form>
        ) : (
          <a className="button-secondary" href={authAction.href}>
            {authAction.label}
          </a>
        )}
        {consoleHref ? (
          <a className="button-secondary" href={consoleHref}>
            进入控制台
          </a>
        ) : null}
      </div>
    </header>
  );
}
