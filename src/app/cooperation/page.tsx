import { CooperationPageView } from "@/app/_components/public/cooperation-page";
import { CooperationForm } from "@/app/_components/cooperation-form";
import { aryStyles } from "@/app/_components/ary-shared";
import { loadDatabaseUser } from "@/lib/auth";

export default async function CooperationPage() {
  const user = await loadDatabaseUser();

  return (
    <main>
      <CooperationPageView />

      <div style={{ maxWidth: 720, margin: "32px auto 0" }}>
        {user ? (
          <CooperationForm />
        ) : (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <h3 style={{ marginBottom: 12 }}>请先登录</h3>
            <p className="muted" style={{ marginBottom: 20 }}>
              企业办赛申请需要登录后才能提交。
            </p>
            <a className="button" href={`/login?returnTo=${encodeURIComponent("/cooperation")}`}>
              登录后继续 →
            </a>
          </div>
        )}
      </div>

      <style>{aryStyles}</style>
    </main>
  );
}
