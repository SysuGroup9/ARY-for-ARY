import { ErrorNotice } from "@/app/_components/ary-shared";
import { ConsoleHomeView } from "@/app/_components/console/console-home";
import {
  ConsoleShell,
  buildConsoleRootNavItems,
} from "@/app/_components/console/console-shell";
import { loadDatabaseUser } from "@/lib/auth";
import { getActionFeedbackContent } from "@/lib/action-feedback";
import { buildProfileCompletionHref } from "@/lib/profile-completion";
import { listConsoleRacesForUser } from "@/lib/services/console-routes";
import { getConsoleHomeSections } from "@/lib/viewer-access";
import { redirect } from "next/navigation";

interface Props {
  searchParams?: Promise<{
    feedbackMessage?: string;
    feedbackScope?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ConsoleEntryPage({ searchParams }: Props) {
  const sessionUser = await loadDatabaseUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (!sessionUser) {
    redirect("/login");
  }
  if (!sessionUser.profileCompleted) {
    redirect(buildProfileCompletionHref("/console"));
  }

  const sections = getConsoleHomeSections(sessionUser.roles);
  const races = sections.includes("races")
    ? await listConsoleRacesForUser({
        roles: sessionUser.roles,
        userId: sessionUser.id,
      })
    : [];
  const feedback = getActionFeedbackContent({
    message: resolvedSearchParams?.feedbackMessage,
    scope: resolvedSearchParams?.feedbackScope,
  });

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/", label: "公开站" },
        { label: "控制台" },
      ]}
      description="独立的工作台入口，用于进入赛事控制台、管理控制台和大屏控制台。"
      navItems={buildConsoleRootNavItems(sections)}
      title="控制台首页"
      user={{ username: sessionUser.username, roles: sessionUser.roles }}
    >
      {feedback ? (
        <ErrorNotice message={feedback.message} title={feedback.title} />
      ) : null}
      <ConsoleHomeView raceCount={races.length} sections={sections} />
    </ConsoleShell>
  );
}
