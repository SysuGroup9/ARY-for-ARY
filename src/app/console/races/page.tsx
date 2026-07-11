import { ErrorNotice } from "@/app/_components/ary-shared";
import { ConsoleRacesPageView } from "@/app/_components/console/console-races-page";
import {
  ConsoleShell,
  buildConsoleRootNavItems,
} from "@/app/_components/console/console-shell";
import { requireConsoleUser } from "@/lib/auth";
import { getActionFeedbackContent } from "@/lib/action-feedback";
import { listConsoleRacesForUser } from "@/lib/services/console-routes";
import {
  getConsoleHomeSections,
  getConsoleRacesRootAccess,
} from "@/lib/viewer-access";
import { redirect } from "next/navigation";

interface Props {
  searchParams?: Promise<{
    feedbackMessage?: string;
    feedbackScope?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ConsoleRacesPage({ searchParams }: Props) {
  const sessionUser = await requireConsoleUser("/console/races");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const access = getConsoleRacesRootAccess(sessionUser.roles);
  if (!access.allowed) {
    redirect(access.redirectTo ?? "/console");
  }
  const sections = getConsoleHomeSections(sessionUser.roles);
  const races = await listConsoleRacesForUser({
    roles: sessionUser.roles,
    userId: sessionUser.id,
  });
  const feedback = getActionFeedbackContent({
    message: resolvedSearchParams?.feedbackMessage,
    scope: resolvedSearchParams?.feedbackScope,
  });

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/console", label: "控制台" },
        { label: "赛事控制台" },
      ]}
      description="选择一个你可进入的赛事工作台。"
      navItems={buildConsoleRootNavItems(sections)}
      title="赛事控制台"
      user={{ username: sessionUser.username, roles: sessionUser.roles }}
    >
      {feedback ? (
        <ErrorNotice message={feedback.message} title={feedback.title} />
      ) : null}
      <ConsoleRacesPageView races={races} />
    </ConsoleShell>
  );
}
