import { createRaceAction } from "@/app/actions";
import {
  CreateRaceForm,
  ErrorNotice,
  Panel,
} from "@/app/_components/ary-shared";
import {
  ConsoleShell,
  buildConsoleRootNavItems,
} from "@/app/_components/console/console-shell";
import { getActionFeedbackContent } from "@/lib/action-feedback";
import { requireConsoleUser } from "@/lib/auth";
import { listUsersByRole } from "@/lib/services/users";
import { hasRole } from "@/lib/user-roles";
import {
  getConsoleHomeSections,
  getCreateRacePageAccess,
} from "@/lib/viewer-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConsoleNewRacePage({
  searchParams,
}: {
  searchParams?: Promise<{
    feedbackMessage?: string;
    feedbackScope?: string;
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionUser = await requireConsoleUser("/console/races/new");
  const access = getCreateRacePageAccess(sessionUser.roles);

  if (!access.allowed) {
    redirect(access.redirectTo ?? "/console");
  }

  const sections = getConsoleHomeSections(sessionUser.roles);
  const organizerOptions = hasRole(sessionUser.roles, "ADMIN")
    ? (await listUsersByRole("ORGANIZER")).map((user) => ({
        id: user.id,
        label: user.profileName || user.username,
      }))
    : [];
  const feedback = getActionFeedbackContent({
    message: resolvedSearchParams?.feedbackMessage,
    scope: resolvedSearchParams?.feedbackScope,
  });

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/console", label: "控制台" },
        { href: "/console/races", label: "赛事控制台" },
        { label: "创建赛事" },
      ]}
      description="该页面承接原先位于公开首页的创建赛事入口。"
      navItems={buildConsoleRootNavItems(sections)}
      title="创建赛事"
      user={{ username: sessionUser.username, roles: sessionUser.roles }}
    >
      {feedback ? (
        <ErrorNotice message={feedback.message} title={feedback.title} />
      ) : null}
      <Panel title="创建赛事" eyebrow="主办方视图">
        <div className="stack">
          <a className="button-secondary" href="/console/races">
            返回赛事控制台
          </a>
          <p className="muted">该页面承接原先位于公开首页的创建赛事入口。</p>
        </div>
      </Panel>

      <Panel title="赛事表单" eyebrow="主办方视图">
        <CreateRaceForm
          action={createRaceAction}
          organizerOptions={organizerOptions}
          returnTo="/console/races/new"
        />
      </Panel>
    </ConsoleShell>
  );
}
