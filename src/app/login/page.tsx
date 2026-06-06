import { loginAction, registerAction } from "@/app/actions";
import {
  AudienceEntryPanel,
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
          <AudienceEntryPanel />
          <SeedAccountsPanel />
        </div>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
