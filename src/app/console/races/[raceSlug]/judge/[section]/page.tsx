import { ConsoleShell, buildConsoleSectionNavItems, judgeConsoleSections } from "@/app/_components/console/console-shell";
import { JudgeConsolePageView } from "@/app/_components/console/judge-console-page";
import { getActionFeedbackContent } from "@/lib/action-feedback";
import { requireConsoleUser } from "@/lib/auth";
import { getConsoleRaceBySlugForAccess } from "@/lib/services/console-routes";
import { listJudgeAssignmentsForUserInRace } from "@/lib/services/judging";
import { notFound, redirect } from "next/navigation";

const judgeSectionLabels: Record<string, string> = {
  assigned: "已分配作品",
  reviewing: "评审中",
  submitted: "已提交评审",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string; section: string }>;
  searchParams?: Promise<{
    feedbackMessage?: string;
    feedbackScope?: string;
  }>;
}

export default async function JudgeConsoleSectionPage({
  params,
  searchParams,
}: Props) {
  const { raceSlug, section } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionUser = await requireConsoleUser(
    `/console/races/${raceSlug}/judge/${section}`,
  );
  if (!judgeConsoleSections.includes(section as (typeof judgeConsoleSections)[number])) {
    notFound();
  }

  const context = await getConsoleRaceBySlugForAccess({
    access: "judge",
    raceSlug,
    roles: sessionUser.roles,
    userId: sessionUser.id,
  });
  if (!context) {
    redirect("/console/races");
  }

  const assignments = await listJudgeAssignmentsForUserInRace({
    raceId: context.race.id,
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
        { href: "/console/races", label: "赛事控制台" },
        { href: `/console/races/${raceSlug}`, label: context.race.title },
        { label: judgeSectionLabels[section] ?? section },
      ]}
      description="按 `grs003` 组织的评委工作台路由。"
      navItems={buildConsoleSectionNavItems({
        baseHref: `/console/races/${raceSlug}/judge`,
        items: judgeConsoleSections,
        labels: judgeSectionLabels,
      })}
      title={`${context.race.title} / 评委`}
      user={{ username: sessionUser.username, roles: sessionUser.roles }}
    >
      <JudgeConsolePageView
        assignments={assignments}
        feedback={feedback}
        race={context.race}
        raceSlug={raceSlug}
        section={section as (typeof judgeConsoleSections)[number]}
      />
    </ConsoleShell>
  );
}
