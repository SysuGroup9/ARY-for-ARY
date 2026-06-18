import { getConsoleEntryTarget } from "@/lib/viewer-access";

export function PublicHeader({ hasSession }: { hasSession: boolean }) {
  return (
    <header className="public-header">
      <div className="public-header__brand">
        <a href="/">ARY</a>
      </div>
      <nav className="public-header__nav" aria-label="Public Header">
        <a href="/races">Races</a>
        <a href="/works">Works</a>
        <a href="/riders">Riders</a>
        <a href="/cooperation">Cooperation</a>
      </nav>
      <div className="public-header__actions">
        <a className="button-secondary" href={getConsoleEntryTarget(hasSession)}>
          {hasSession ? "Console Entry" : "Login"}
        </a>
      </div>
    </header>
  );
}
