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
      items: [
        "Browse races, works, results, and rider profiles.",
        "Enter the current featured race in one or two clicks.",
        "Keep console workflows out of the public gallery.",
      ],
      lede:
        "The public side of ARY is now a gallery-first experience focused on races, works, results, and rider profiles.",
    },
    auth: {
      items: [
        "Public signup creates Rider accounts only.",
        "Organizer, Judge, and Admin access is assigned from Console.",
        "Public browsing stays on the public site after login flows are separated.",
      ],
      lede:
        "This page is the identity entry for ARY. Public browsing stays on the public site; workspace access starts from login.",
    },
    member: {
      items: [
        "Public site and Console now live on separate routes.",
        "Race workspaces are moving under /console/*.",
        "The next refactor slice is deeper grs003 domain alignment.",
      ],
      lede:
        "ARY is being refactored from a mixed dashboard into separate public and console experiences aligned to grs003.",
    },
  }[mode];

  return (
    <section className="hero">
      <div className="hero__copy">
        <p className="hero__eyebrow">ARY</p>
        <h1>Public Yard, Private Race Source.</h1>
        <p className="hero__lede">{content.lede}</p>
        <div className="hero__chips">
          <span>Next.js 16</span>
          <span>Prisma 7</span>
          <span>SQLite</span>
          <span>Console Split</span>
        </div>
      </div>
      <div className="hero__card">
        <h2>Current Focus</h2>
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
  loginAction,
  registerAction,
}: {
  loginAction: FormAction;
  registerAction: FormAction;
}) {
  return (
    <div className="auth-tabs">
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
          Login
        </label>
        <label className="auth-tabs__switch" htmlFor="auth-tab-register">
          Register
        </label>
      </div>

      <div className="auth-tabs__panel auth-tabs__panel--login">
        <AuthForm
          action={loginAction}
          description="Use an existing ARY account to enter Console or continue participating in races."
          submitLabel="Login"
          title="Login"
        />
      </div>

      <div className="auth-tabs__panel auth-tabs__panel--register">
        <AuthForm
          action={registerAction}
          description="Public signup creates a Rider account only. Organizer, Judge, and Admin roles are assigned from Console."
          submitLabel="Register"
          title="Register"
        />
      </div>
    </div>
  );
}

export function SeedAccountsPanel() {
  const credentials = getDemoCredentials();

  return (
    <Panel title="Seed Accounts" eyebrow="Demo">
      <div className="seed-grid">
        {credentials.map((credential) => (
          <div key={credential.label}>
            <strong>{credential.label}</strong>
            <p>username: {credential.username}</p>
            <p>password: {credential.password}</p>
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
  submitLabel,
  title,
}: {
  action: FormAction;
  description: string;
  submitLabel: string;
  title: string;
}) {
  return (
    <form action={action} className="form-grid">
      <div className="stack">
        <strong>{title}</strong>
        <p className="muted">{description}</p>
      </div>
      <label>
        Username
        <input name="username" placeholder="username" required />
      </label>
      <label>
        Password
        <input
          name="password"
          placeholder="password"
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
    grid-template-columns: minmax(0, 1.25fr) 320px;
    gap: 20px;
    align-items: start;
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
