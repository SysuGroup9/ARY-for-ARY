import { getConsoleEntryTarget } from "@/lib/viewer-access";

export function PublicHeader({ hasSession }: { hasSession: boolean }) {
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
        <a className="button-secondary" href={getConsoleEntryTarget(hasSession)}>
          {hasSession ? "进入控制台" : "登录"}
        </a>
      </div>
    </header>
  );
}
