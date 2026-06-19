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
        "这里是 ARY 的身份入口。公开浏览继续留在公开站，报名、提交、评审和后台工作从登录后进入对应控制台。",
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
    <section className="hero">
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
        <h2>当前重点</h2>
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
          <div key={credential.label}>
            <strong>{credential.label}</strong>
            <p>用户名：{credential.username}</p>
            <p>密码：{credential.password}</p>
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
  :root {
    --accent: #3157a4;
    --accent-dark: #25427d;
    --accent-soft: rgba(49, 87, 164, 0.12);
    --background: #f5efe7;
    --foreground: #1e2430;
    --muted: #6c7280;
    --panel: rgba(255, 255, 255, 0.86);
    --panel-border: rgba(43, 52, 68, 0.08);
    --panel-strong: rgba(255, 255, 255, 0.96);
    --radius-lg: 12px;
    --radius-xl: 16px;
    --shadow: 0 16px 36px rgba(25, 30, 40, 0.08);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: var(--background);
    color: var(--foreground);
    font-family: Arial, Helvetica, sans-serif;
  }

  a {
    color: inherit;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid rgba(43, 52, 68, 0.14);
    border-radius: 12px;
    background: #fff;
    padding: 0.75rem 0.9rem;
  }

  textarea {
    resize: vertical;
  }

  button,
  .button,
  .button-secondary,
  .button-danger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    border: 0;
    border-radius: 12px;
    cursor: pointer;
    padding: 0 14px;
    text-decoration: none;
    font-weight: 700;
  }

  button,
  .button {
    background: var(--accent);
    color: #fff;
  }

  .button-secondary {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(43, 52, 68, 0.12);
    color: var(--foreground);
  }

  .button-danger {
    background: #a73e3e;
    color: #fff;
  }

  .muted {
    color: var(--muted);
  }

  .shell {
    display: grid;
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  .shell--public-only {
    display: block;
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 20px 32px;
  }

  .content,
  .content--public,
  .sidebar,
  .stack,
  .feedback-list,
  .public-gallery {
    display: grid;
    gap: 16px;
  }

  .content--public {
    width: 100%;
  }

  .grid,
  .seed-grid,
  .detail-grid,
  .check-grid,
  .weights-grid,
  .local-picker-grid {
    display: grid;
    gap: 14px;
  }

  .grid,
  .seed-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .check-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .weights-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .local-picker-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow);
    padding: 22px;
  }

  .panel h2 {
    margin: 0;
    line-height: 1.1;
  }

  .panel__body {
    margin-top: 14px;
  }

  .eyebrow {
    margin: 0 0 8px;
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .hero {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 20px;
    padding: 20px;
    max-width: 1240px;
    margin: 0 auto 24px;
  }

  .hero__copy,
  .hero__card {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow);
  }

  .hero__copy {
    padding: 36px;
  }

  .hero__card {
    padding: 28px;
  }

  .hero__eyebrow {
    margin: 0 0 8px;
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .hero h1 {
    margin: 0;
    max-width: 10ch;
    font-size: clamp(3rem, 7vw, 5.5rem);
    line-height: 0.96;
  }

  .hero__lede {
    max-width: 56ch;
    margin: 18px 0 0;
    color: var(--muted);
    line-height: 1.75;
  }

  .hero__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }

  .hero__chips span,
  .meta-pills span,
  .file-chip {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent-dark);
    padding: 0.5rem 0.8rem;
    font-size: 0.92rem;
    font-weight: 600;
  }

  .hero__card ul,
  .bullet-list {
    margin: 0;
    padding-left: 1.2rem;
    line-height: 1.8;
  }

  .auth-entry-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.9fr);
    gap: 20px;
    align-items: stretch;
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 20px 32px;
  }

  .auth-tabs {
    display: grid;
    gap: 14px;
    position: relative;
  }

  .auth-tabs__toggle {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .auth-tabs__switches {
    display: inline-grid;
    grid-template-columns: repeat(2, minmax(0, max-content));
    gap: 8px;
    padding: 6px;
    border-radius: 999px;
    background: rgba(239, 229, 217, 0.85);
    width: fit-content;
  }

  .auth-tabs__switch {
    border-radius: 999px;
    padding: 0.65rem 1rem;
    color: var(--muted);
    font-weight: 700;
    cursor: pointer;
  }

  .auth-tabs__panel {
    display: none;
  }

  #auth-tab-login:checked ~ .auth-tabs__switches label[for="auth-tab-login"],
  #auth-tab-register:checked ~ .auth-tabs__switches label[for="auth-tab-register"] {
    background: var(--accent);
    color: #fff;
  }

  #auth-tab-login:checked ~ .auth-tabs__panel--login,
  #auth-tab-register:checked ~ .auth-tabs__panel--register {
    display: grid;
  }

  .auth-page {
    position: relative;
  }

  .auth-page::before {
    content: "";
    position: absolute;
    inset: 20px 20px auto;
    height: 180px;
    border-radius: 24px;
    background:
      radial-gradient(circle at left top, rgba(49, 87, 164, 0.18), transparent 55%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0));
    pointer-events: none;
    z-index: 0;
  }

  .auth-page > * {
    position: relative;
    z-index: 1;
  }

  .auth-panel {
    min-height: 100%;
  }

  .auth-panel__header {
    display: grid;
    gap: 10px;
    margin-bottom: 18px;
  }

  .auth-panel__header h2,
  .auth-sidebar__header h2 {
    margin: 0;
  }

  .auth-sidebar {
    display: grid;
    gap: 16px;
    align-content: start;
  }

  .auth-sidebar__card,
  .auth-sidebar__tip {
    border-radius: var(--radius-lg);
    border: 1px solid rgba(43, 52, 68, 0.08);
    background: var(--panel-strong);
    padding: 16px;
  }

  .auth-sidebar__header {
    display: grid;
    gap: 10px;
  }

  .auth-sidebar__list {
    margin: 0;
    padding-left: 1.15rem;
    line-height: 1.8;
  }

  .auth-sidebar__meta {
    display: grid;
    gap: 8px;
  }

  .auth-sidebar__meta strong {
    font-size: 0.95rem;
  }

  .auth-sidebar__back {
    width: fit-content;
  }

  .public-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    max-width: 1240px;
    margin: 0 auto;
    padding: 18px 20px;
  }

  .public-header__brand a {
    font-size: 1.2rem;
    font-weight: 800;
    text-decoration: none;
  }

  .public-header__nav,
  .button-row-inline,
  .meta-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .public-header__nav a {
    text-decoration: none;
    color: var(--muted);
    font-weight: 700;
  }

  .public-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  .public-card,
  .public-link-card,
  .picker-card,
  .race-card,
  .identity-card,
  .feedback-thread,
  .highlight-card,
  .comment-card {
    border-radius: var(--radius-lg);
    border: 1px solid rgba(59, 43, 27, 0.1);
    background: var(--panel-strong);
    padding: 16px;
  }

  .public-link-card {
    display: grid;
    gap: 6px;
    text-decoration: none;
    color: inherit;
  }

  .public-card__top,
  .race-card__top,
  .highlight-card__top,
  .feedback-thread__top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table th,
  .table td {
    text-align: left;
    padding: 0.75rem 0.6rem;
    border-bottom: 1px solid rgba(50, 39, 28, 0.1);
    font-size: 0.95rem;
  }

  .table th {
    color: var(--muted);
    font-weight: 600;
  }

  .form-grid {
    display: grid;
    gap: 14px;
  }

  .form-grid label {
    display: grid;
    gap: 8px;
    font-weight: 600;
  }

  .form-grid .full {
    grid-column: 1 / -1;
  }

  .checkbox {
    display: flex !important;
    align-items: center;
    gap: 10px;
    font-weight: 500 !important;
  }

  .checkbox input {
    width: auto;
  }

  .comment-card {
    margin: 0;
    line-height: 1.8;
  }

  .highlight-card pre,
  .shell code {
    overflow-x: auto;
    white-space: pre-wrap;
    border-radius: 12px;
    background: #271f19;
    color: #f6ece1;
    padding: 12px;
  }

  .track-preview {
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid rgba(59, 43, 27, 0.12);
    background: #f4ede4;
  }

  .track-preview img {
    display: block;
    width: 100%;
    height: 180px;
    object-fit: cover;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 1100px) {
    .hero,
    .shell,
    .auth-entry-layout,
    .seed-grid,
    .grid,
    .detail-grid,
    .weights-grid,
    .check-grid,
    .local-picker-grid {
      grid-template-columns: 1fr;
    }

    .public-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .meta-pills {
      justify-content: start;
    }
  }
`;
