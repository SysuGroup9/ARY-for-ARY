import type { ReactNode } from "react";
import CreateRaceFormClient from "@/app/_components/create-race-form-client";
import { getDemoCredentials } from "@/lib/demo-credentials";

type FormAction = (formData: FormData) => void | Promise<void>;

export function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function Card({
  eyebrow,
  title,
  children,
  accent,
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`card${accent ? " card-accent" : ""}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {title ? <h2>{title}</h2> : null}
      <div style={{ marginTop: title ? 14 : 0 }}>{children}</div>
    </div>
  );
}

export function HeroSection({
  mode,
}: {
  mode: "member" | "auth" | "audience";
}) {
  const content = {
    audience: {
      lede:
        "ARY 的公开站以赛事、作品、赛果和骑手档案为主线，让第一次进入的人也能快速看懂当前赛场。",
      items: [
        "浏览赛事、作品、赛果和骑手档案",
        "快速进入当前主推赛事与公开页面",
        "让控制台工作流不干扰公开浏览体验",
      ],
    },
    auth: {
      lede:
        "登录后进入报名、提交和评审流程。公开浏览仍保留在公开站，不需要登录即可访问。",
      items: [
        "公开注册默认只创建骑手账号",
        "主办方、评委和管理员身份由控制台分配",
        "登录后继续参与赛事，或进入对应工作台",
      ],
    },
    member: {
      lede:
        "ARY 正在从混合式单页重构为符合 grs003 的公开站与控制台分层体验，当前重点仍是中文化与赛事工作流收口。",
      items: [
        "公开站与控制台已经拆成独立路由",
        "赛事工作区继续向 /console/* 收口",
        "下一轮重点仍是 grs003 的深层语义对齐",
      ],
    },
  }[mode];

  return (
    <section className="hero-split">
      <div className="hero__copy">
        <p className="hero__eyebrow">ARY</p>
        <h1>公开赛场，私有赛源。</h1>
        <p className="hero__lede">{content.lede}</p>
        <div className="hero__chips">
          <span>Next.js 16</span>
          <span>Prisma 7</span>
          <span>SQLite</span>
          <span>控制台分层</span>
        </div>
      </div>
      <div className="hero__card">
        <h2 style={{fontSize:"1.125rem",marginBottom:16}}>当前重点</h2>
        <ul>
          {content.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AuthTabsPanel({
  githubAction,
  loginAction,
  registerAction,
  returnTo,
}: {
  githubAction?: FormAction;
  loginAction: FormAction;
  registerAction: FormAction;
  returnTo?: string;
}) {
  return (
    <div className="auth-tabs">
      {githubAction ? (
        <form action={githubAction} className="form-grid auth-oauth-form">
          {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
          <button className="button-secondary" type="submit">
            使用 GitHub 登录
          </button>
          <p className="muted">
            这是符合 GRS003 要求的正式身份入口。下方本地账号表单保留为开发与演示兜底。
          </p>
        </form>
      ) : null}
      <input
        className="auth-tabs__toggle"
        defaultChecked
        id="auth-tab-login"
        name="auth-tab"
        type="radio"
      />
      <input
        className="auth-tabs__toggle"
        id="auth-tab-register"
        name="auth-tab"
        type="radio"
      />

      <div className="auth-tabs__switches">
        <label className="auth-tabs__switch" htmlFor="auth-tab-login">
          登录
        </label>
        <label className="auth-tabs__switch" htmlFor="auth-tab-register">
          注册
        </label>
      </div>

      <div className="auth-tabs__panel auth-tabs__panel--login">
        <AuthForm
          action={loginAction}
          description="使用已有 ARY 账号继续报名、提交作品，或在已分配角色后进入对应控制台。"
          returnTo={returnTo}
          submitLabel="登录"
          title="已有账号登录"
        />
      </div>

      <div className="auth-tabs__panel auth-tabs__panel--register">
        <AuthForm
          action={registerAction}
          description="公开注册默认只创建骑手账号。完成注册后，再进入对应赛事完成报名。"
          returnTo={returnTo}
          submitLabel="注册骑手账号"
          title="创建骑手账号"
        />
      </div>
    </div>
  );
}

export function SeedAccountsPanel() {
  const credentials = getDemoCredentials();

  return (
    <Panel title="演示账号" eyebrow="Demo">
      <div className="seed-grid">
        {credentials.map((credential) => (
          <div key={credential.label} className="public-link-card" style={{padding:12}}>
            <strong style={{fontSize:"0.9375rem"}}>{credential.label}</strong>
            <span className="badge badge-accent" style={{marginTop:4}}>{credential.role}</span>
            <div style={{marginTop:8}}>
              <p className="muted text-sm">用户名：<code style={{fontFamily:"var(--font-mono)",background:"var(--muted)",padding:"2px 6px",borderRadius:4}}>{credential.username}</code></p>
              <p className="muted text-sm">密　码：<code style={{fontFamily:"var(--font-mono)",background:"var(--muted)",padding:"2px 6px",borderRadius:4}}>{credential.password}</code></p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function CreateRaceForm({ action }: { action: FormAction }) {
  return <CreateRaceFormClient action={action} />;
}

function AuthForm({
  action,
  description,
  returnTo,
  submitLabel,
  title,
}: {
  action: FormAction;
  description: string;
  returnTo?: string;
  submitLabel: string;
  title: string;
}) {
  return (
    <form action={action} className="form-grid">
      <div className="stack">
        <strong>{title}</strong>
        <p className="muted">{description}</p>
      </div>
      {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
      <label>
        用户名
        <input name="username" placeholder="请输入用户名" required />
      </label>
      <label>
        密码
        <input
          name="password"
          placeholder="请输入密码"
          required
          type="password"
        />
      </label>
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

export const aryStyles = `
  /* ═══ ARY Component Styles v2 ═══ */

  /* ── Shell & Layout ── */
  .shell {
    display: grid;
    grid-template-columns: 340px minmax(0, 1fr);
    gap: var(--space-5);
    align-items: start;
  }
  .shell--public-only {
    display: block;
    max-width: 100%;
    margin: 0 auto;
    padding: 0 0 var(--space-8);
  }
  .content,
  .content--public,
  .sidebar,
  .feedback-list,
  .public-gallery {
    display: grid;
    gap: var(--space-4);
    width: 100%;
  }

  /* ── Grids ── */
  .grid, .seed-grid, .check-grid, .local-picker-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--space-3);
  }
  .detail-grid dt {
    font-size: 0.8125rem;
    color: var(--muted-foreground);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .detail-grid dd { font-weight: 600; font-size: 1rem; margin: 0; }
  .weights-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-3);
  }

  /* ── Public Header ── */
  .public-header {
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);
    max-width: 1240px; margin: 0 auto; padding: 12px 20px;
    background: rgba(255,255,255,0.75); backdrop-filter: blur(20px);
    box-shadow: var(--shadow-ring);
    position: sticky; top: 0; z-index: 50;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }
  .public-header__brand a {
    font-family: var(--font-display); font-size: 1.45rem; font-weight: 600;
    background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
    -webkit-background-clip: text; background-clip: text; color: transparent;
    text-decoration: none; letter-spacing: -0.01em;
  }
  .public-header__nav,
  .button-row-inline,
  .meta-pills {
    display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center;
  }
  .public-header__nav a {
    text-decoration: none; color: var(--muted-foreground); font-weight: 500; font-size: 0.9375rem;
    padding: 6px 10px; border-radius: var(--radius-sm); transition: all 0.15s;
  }
  .public-header__nav a:hover { color: var(--accent); background: var(--accent-soft); }

  .public-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }

  /* ── Public Cards ── */
  .public-card,
  .public-link-card {
    display: grid; gap: 6px;
    border-radius: var(--radius-md);
    background: var(--card);
    padding: var(--space-4);
    box-shadow: var(--shadow-ring);
    transition: all 0.2s ease;
    text-decoration: none;
    color: inherit;
  }
  .public-card:hover { box-shadow: var(--shadow-card); transform: translateY(-2px); }
  .public-link-card:hover { box-shadow: var(--shadow-subtle); }

  .public-card__top,
  .race-card__top,
  .highlight-card__top,
  .feedback-thread__top {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }

  /* ── Auth ── */
  .auth-entry-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.9fr);
    gap: var(--space-6);
    align-items: start;
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 20px var(--space-8);
  }
  .auth-page {
    position: relative;
    padding-top: var(--space-4);
    padding-bottom: var(--space-16);
  }
  .auth-page::before {
    content: "";
    position: absolute;
    inset: 20px 20px auto;
    height: 180px;
    border-radius: var(--radius-2xl);
    background:
      radial-gradient(circle at left top, rgba(35,98,255,0.06), transparent 60%),
      linear-gradient(135deg, rgba(35,98,255,0.03), rgba(255,255,255,0));
    pointer-events: none;
    z-index: 0;
  }
  .auth-page > * { position: relative; z-index: 1; }
  .auth-tabs { display: grid; gap: 14px; position: relative; }
  .auth-tabs__toggle { position: absolute; opacity: 0; pointer-events: none; }
  .auth-tabs__switches {
    display: inline-grid;
    grid-template-columns: repeat(2, minmax(0, max-content));
    gap: var(--space-2); padding: 5px;
    border-radius: var(--radius-full);
    background: var(--muted);
    width: fit-content;
  }
  .auth-tabs__switch {
    border-radius: var(--radius-full);
    padding: 0.6rem 1.1rem;
    color: var(--muted-foreground);
    font-weight: 600; font-size: 0.9375rem;
    cursor: pointer; transition: all 0.15s;
  }
  .auth-tabs__panel { display: none; }
  #auth-tab-login:checked ~ .auth-tabs__switches label[for="auth-tab-login"],
  #auth-tab-register:checked ~ .auth-tabs__switches label[for="auth-tab-register"] {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 2px 8px rgba(35,98,255,0.25);
  }
  #auth-tab-login:checked ~ .auth-tabs__panel--login,
  #auth-tab-register:checked ~ .auth-tabs__panel--register { display: grid; }

  .auth-panel { min-height: 100%; }
  .auth-panel__header {
    display: grid; gap: var(--space-2);
    margin-bottom: var(--space-6);
  }
  .auth-panel__header h2,
  .auth-sidebar__header h2 {
    margin: 0; font-size: 1.125rem; font-weight: 600; font-family: var(--font-body);
  }

  .auth-sidebar { display: grid; gap: var(--space-4); align-content: start; }
  .auth-sidebar__card {
    border-radius: var(--radius-md);
    background: var(--muted);
    padding: 14px 16px;
    margin-top: var(--space-2);
  }
  .auth-sidebar__header { display: grid; gap: var(--space-2); }
  .auth-sidebar__list {
    margin: 0; padding-left: 1.15rem;
    line-height: 1.8; font-size: 0.9375rem;
    color: var(--muted-foreground);
  }
  .auth-sidebar__meta { display: grid; gap: 6px; }
  .auth-sidebar__meta strong { font-size: 1rem; }
  .auth-sidebar__back { width: fit-content; font-size: 0.9375rem; }

  /* ── Forms ── */
  .form-grid { display: grid; gap: 14px; }
  .form-grid label { display: grid; gap: var(--space-2); font-weight: 600; font-size: 1rem; }
  .form-grid .full { grid-column: 1 / -1; }
  .checkbox {
    display: flex !important; align-items: center;
    gap: var(--space-2); font-weight: 500 !important;
  }
  .checkbox input { width: auto; }

  /* ── Code blocks ── */
  .highlight-card pre,
  .shell code {
    overflow-x: auto; white-space: pre-wrap;
    border-radius: 12px;
    background: #0d1117; color: #e6edf3;
    padding: 12px; font-size: 0.875rem;
  }

  /* ── Track Preview ── */
  .track-preview {
    overflow: hidden; border-radius: var(--radius-lg);
    background: var(--muted);
  }
  .track-preview img {
    display: block; width: 100%;
    height: 180px; object-fit: cover;
  }

  /* ── Meta Pills ── */
  .meta-pills span {
    display: inline-flex; align-items: center;
    min-height: 34px;
    border-radius: var(--radius-full);
    background: var(--accent-soft);
    color: var(--accent);
    padding: 0.4rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  /* ── Utility ── */
  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0);
    white-space: nowrap; border: 0;
  }

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .shell, .auth-entry-layout, .seed-grid, .grid,
    .detail-grid, .weights-grid, .check-grid, .local-picker-grid {
      grid-template-columns: 1fr;
    }
    .public-header { flex-direction: column; align-items: flex-start; }
    .meta-pills { justify-content: start; }
    .hero-split { grid-template-columns: 1fr; }
  }
`;
