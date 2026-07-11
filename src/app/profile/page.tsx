import { redirect } from "next/navigation";
import { completeProfileAction } from "@/app/actions";
import { ErrorNotice, HeroSection, Panel, aryStyles } from "@/app/_components/ary-shared";
import { loadDatabaseUser } from "@/lib/auth";
import { getEntryFeedbackContent } from "@/lib/entry-feedback";
import { resolveProfileCompletionReturnTo } from "@/lib/profile-completion";

interface Props {
  searchParams?: Promise<{ feedbackCode?: string; returnTo?: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: Props) {
  const sessionUser = await loadDatabaseUser();
  if (!sessionUser) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnTo = resolvedSearchParams?.returnTo;
  const feedback = getEntryFeedbackContent({
    code: resolvedSearchParams?.feedbackCode,
    mode: "profile",
  });
  if (sessionUser.profileCompleted) {
    redirect(resolveProfileCompletionReturnTo(returnTo));
  }

  return (
    <main className="auth-page">
      <HeroSection mode="auth" />

      <section className="auth-entry-layout">
        <div className="card" style={{ padding: 32 }}>
          <Panel title="资料补全" eyebrow="Profile Setup">
            <div className="stack">
              {feedback ? (
                <ErrorNotice message={feedback.message} title={feedback.title} />
              ) : null}
              <p className="muted">
                你已经完成登录，但还需要补全最小个人资料，之后才能继续进入控制台、报名和提交流程。
              </p>
              <div className="public-link-card" style={{ padding: 16 }}>
                <strong>{sessionUser.username}</strong>
                <span className="muted">
                  GitHub 账号：{sessionUser.githubAccount ?? "未绑定"}
                </span>
              </div>
              <form action={completeProfileAction} className="form-grid">
                <input
                  name="returnTo"
                  type="hidden"
                  value={resolveProfileCompletionReturnTo(returnTo)}
                />
                <label>
                  显示名称
                  <input
                    defaultValue={sessionUser.profileName}
                    name="profileName"
                    placeholder="请输入公开显示名称"
                    required
                  />
                </label>
                <label>
                  机构 / 标签
                  <input
                    defaultValue={sessionUser.profileOrgLabel}
                    name="profileOrgLabel"
                    placeholder="例如：独立骑手 / ARY Lab"
                  />
                </label>
                <button type="submit">保存并继续</button>
              </form>
            </div>
          </Panel>
        </div>

        <aside className="auth-sidebar">
          <Panel title="为什么要补全" eyebrow="Next Step">
            <ul className="auth-sidebar__list">
              <li>补全后才会被视为正式 ARY 用户。</li>
              <li>后续报名、进入控制台和角色授权都会基于这份资料继续。</li>
              <li>Admin 侧可以查看资料补全状态，但不代替你填写个人资料。</li>
            </ul>
          </Panel>
        </aside>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
