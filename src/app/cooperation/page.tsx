import { CooperationPageView } from "@/app/_components/public/cooperation-page";
import { CooperationForm } from "@/app/_components/cooperation-form";
import { ErrorNotice, aryStyles } from "@/app/_components/ary-shared";
import { getActionFeedbackContent } from "@/lib/action-feedback";
import { loadDatabaseUser } from "@/lib/auth";

export default async function CooperationPage({
  searchParams,
}: {
  searchParams?: Promise<{
    feedbackMessage?: string;
    feedbackScope?: string;
    submitted?: string;
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await loadDatabaseUser();
  const feedback = getActionFeedbackContent({
    message: resolvedSearchParams?.feedbackMessage,
    scope: resolvedSearchParams?.feedbackScope,
  });
  const submitted = resolvedSearchParams?.submitted === "1";

  return (
    <main>
      <CooperationPageView />

      <div style={{ maxWidth: 720, margin: "32px auto 0" }}>
        {user ? (
          <div className="stack">
            {feedback ? (
              <ErrorNotice message={feedback.message} title={feedback.title} />
            ) : null}
            {submitted ? (
              <div className="card" style={{ textAlign: "center", padding: 40 }}>
                <h3 style={{ marginBottom: 12 }}>提交成功</h3>
                <p className="muted">
                  你的办赛申请已提交，将由管理员审核。审核通过后赛事将自动创建，我们也会在 1-2 个工作日内通过邮件联系你，沟通赛事详情。
                </p>
              </div>
            ) : null}
            <CooperationForm />
          </div>
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
