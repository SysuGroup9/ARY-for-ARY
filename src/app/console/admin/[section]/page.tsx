import { AdminConsolePageView } from "@/app/_components/console/admin-console-page";
import { RaceRequestsPageView } from "@/app/_components/console/race-requests-page";
import { ErrorNotice } from "@/app/_components/ary-shared";
import {
  ConsoleShell,
  adminConsoleSections,
  buildConsoleSectionNavItems,
} from "@/app/_components/console/console-shell";
import { getActionFeedbackContent } from "@/lib/action-feedback";
import { requireConsoleUser } from "@/lib/auth";
import { listCooperationRequests } from "@/lib/services/cooperation";
import { listUsers } from "@/lib/services/users";
import { getConsoleAdminAccess } from "@/lib/viewer-access";
import { notFound, redirect } from "next/navigation";

const adminSectionLabels: Record<string, string> = {
  users: "用户列表",
  "profile-completion": "资料补全",
  roles: "角色维护",
  "race-requests": "办赛申请审核",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ section: string }>;
  searchParams?: Promise<{
    feedbackMessage?: string;
    feedbackScope?: string;
  }>;
}

export default async function AdminConsoleSectionPage({
  params,
  searchParams,
}: Props) {
  const { section } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionUser = await requireConsoleUser(`/console/admin/${section}`);
  const access = getConsoleAdminAccess(sessionUser.roles);

  if (!access.allowed) {
    redirect(access.redirectTo ?? "/console");
  }
  if (
    !adminConsoleSections.includes(
      section as (typeof adminConsoleSections)[number],
    )
  ) {
    notFound();
  }

  const users = await listUsers();
  const cooperationRequests = await listCooperationRequests();
  const feedback = getActionFeedbackContent({
    message: resolvedSearchParams?.feedbackMessage,
    scope: resolvedSearchParams?.feedbackScope,
  });

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/console", label: "控制台" },
        { href: "/console/admin/users", label: "管理控制台" },
        { label: adminSectionLabels[section] ?? section },
      ]}
      description="最小账号治理视图，用于查看用户、资料补全状态与角色维护。"
      navItems={buildConsoleSectionNavItems({
        baseHref: "/console/admin",
        items: adminConsoleSections,
        labels: adminSectionLabels,
      })}
      title="管理控制台"
      user={{ username: sessionUser.username, roles: sessionUser.roles }}
    >
      {feedback ? (
        <ErrorNotice message={feedback.message} title={feedback.title} />
      ) : null}
      {section === "race-requests" ? (
        <RaceRequestsPageView requests={cooperationRequests} />
      ) : (
        <AdminConsolePageView
          section={section as "profile-completion" | "roles" | "users"}
          users={users}
        />
      )}
    </ConsoleShell>
  );
}
