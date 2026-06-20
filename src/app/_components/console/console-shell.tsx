import { logoutAction } from "@/app/actions";
import type { ReactNode } from "react";
import { getRoleLabels, type AppRole } from "@/lib/user-roles";

export type ConsoleNavItem = {
  href: string;
  label: string;
};

export const organizerConsoleSections = [
  "overview",
  "settings",
  "registrations",
  "riders",
  "ca-status",
  "works",
  "judges",
  "judging",
  "awards",
  "reports",
  "maintenance",
] as const;

export const riderConsoleSections = [
  "registration",
  "ca-setup",
  "riding",
  "submission",
  "review",
  "report",
] as const;

export const judgeConsoleSections = [
  "assigned",
  "reviewing",
  "submitted",
] as const;

export const adminConsoleSections = [
  "users",
  "profile-completion",
  "roles",
  "race-requests",
] as const;

export const screenConsoleModes = [
  "jumbotron",
  "billboard",
  "live",
  "leaderboard",
  "works",
  "announcement",
  "calibration",
] as const;

export function buildConsoleRootNavItems(sections: Array<"admin" | "races" | "screen">): ConsoleNavItem[] {
  return sections.map((section) => {
    switch (section) {
      case "races":
        return { href: "/console/races", label: "赛事控制台" };
      case "admin":
        return { href: "/console/admin/users", label: "管理控制台" };
      case "screen":
        return { href: "/console/screen", label: "大屏控制台" };
    }
  });
}

export function buildConsoleSectionNavItems(input: {
  baseHref: string;
  items: readonly string[];
  labels: Record<string, string>;
}): ConsoleNavItem[] {
  return input.items.map((item) => ({
    href: `${input.baseHref}/${item}`,
    label: input.labels[item] ?? item,
  }));
}

export function ConsoleShell({
  breadcrumbs,
  children,
  description,
  navItems,
  title,
  user,
}: {
  breadcrumbs: Array<{ href?: string; label: string }>;
  children: ReactNode;
  description?: string;
  navItems: ConsoleNavItem[];
  title: string;
  user?: { username: string; roles: readonly AppRole[] };
}) {
  const roleLabels = user ? getRoleLabels(user.roles) : [];

  return (
    <main className="console-shell">
      <aside className="console-sidebar">
        <div className="console-brand">
          <a href="/">ARY</a>
          <span>控制台</span>
        </div>
        {user ? (
          <div style={{
            padding: "10px 12px",
            background: "var(--muted)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
          }}>
            <div style={{ fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
              {user.username}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {roleLabels.map((label, i) => (
                <span key={i} className="badge badge-accent" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <form action={logoutAction}>
          <button className="button-secondary" type="submit">
            退出登录
          </button>
        </form>
        <nav className="console-nav" aria-label="控制台导航">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <section className="console-main">
        <header className="console-header">
          <div className="console-breadcrumbs">
            {breadcrumbs.map((item, index) => (
              <span className="console-crumb" key={`${item.label}-${index}`}>
                {item.href ? <a href={item.href}>{item.label}</a> : item.label}
              </span>
            ))}
          </div>
          <div className="console-title-block">
            <p className="eyebrow">工作台</p>
            <h1>{title}</h1>
            {description ? <p className="muted">{description}</p> : null}
          </div>
        </header>

        <div className="console-content">{children}</div>
      </section>
    </main>
  );
}

export const consoleStyles = `
  .console-shell {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 20px;
    padding: 24px;
    min-height: 100vh;
  }

  .console-sidebar,
  .console-header,
  .console-main .panel {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow);
  }

  .console-sidebar {
    display: grid;
    gap: 16px;
    align-self: start;
    padding: 20px;
    position: sticky;
    top: 24px;
  }

  .console-brand {
    display: grid;
    gap: 4px;
  }

  .console-brand a {
    color: var(--foreground);
    font-family: var(--font-display), sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    text-decoration: none;
  }

  .console-brand span {
    color: var(--muted-foreground);
    font-size: 0.92rem;
    font-weight: 600;
  }

  .console-nav {
    display: grid;
    gap: 10px;
  }

  .console-nav a,
  .console-crumb a {
    color: var(--foreground);
    text-decoration: none;
  }

  .console-nav a {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.65);
    border: 1px solid rgba(59, 43, 27, 0.08);
    padding: 0.75rem 0.9rem;
    font-weight: 700;
  }

  .console-main {
    display: grid;
    gap: 20px;
    align-content: start;
  }

  .console-header {
    display: grid;
    gap: 12px;
    padding: 20px 22px;
  }

  .console-breadcrumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    color: var(--muted-foreground);
    font-size: 0.92rem;
  }

  .console-crumb {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .console-crumb:not(:last-child)::after {
    content: "/";
    color: rgba(84, 66, 48, 0.45);
  }

  .console-title-block {
    display: grid;
    gap: 8px;
  }

  .console-title-block h1 {
    margin: 0;
    font-family: var(--font-display), sans-serif;
    line-height: 1;
  }

  .console-content {
    display: grid;
    gap: 20px;
  }

  .console-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }

  .console-link-card {
    display: grid;
    gap: 8px;
    border-radius: 16px;
    border: 1px solid rgba(59, 43, 27, 0.1);
    background: var(--panel-strong);
    color: inherit;
    padding: 18px;
    text-decoration: none;
  }

  .console-link-card strong {
    font-size: 1rem;
  }

  .console-link-card span,
  .console-link-card p {
    color: var(--muted-foreground);
    margin: 0;
  }

  @media (max-width: 1080px) {
    .console-shell {
      grid-template-columns: 1fr;
      padding: 16px;
    }

    .console-sidebar {
      position: static;
    }
  }
`;
