import { ConsoleShell, buildConsoleSectionNavItems, organizerConsoleSections } from "@/app/_components/console/console-shell";
import { OrganizerConsolePageView } from "@/app/_components/console/organizer-console-page";
import { getActionFeedbackContent } from "@/lib/action-feedback";
import { requireConsoleUser } from "@/lib/auth";
import { getConsoleRaceBySlugForAccess } from "@/lib/services/console-routes";
import { listJudgeAssignmentsForRace } from "@/lib/services/judging";
import { listUsersByRole } from "@/lib/services/users";
import { notFound, redirect } from "next/navigation";

const organizerSectionLabels: Record<string, string> = {
  overview: "总览",
  settings: "设置",
  registrations: "报名",
  riders: "骑手",
  "ca-status": "CA 状态",
  works: "作品",
  judges: "评委分配",
  judging: "评审进度",
  announcements: "公告",
  awards: "奖项",
  reports: "报告",
  maintenance: "维护",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string; section: string }>;
  searchParams?: Promise<{
    feedbackMessage?: string;
    feedbackScope?: string;
  }>;
}

export default async function OrganizerConsoleSectionPage({
  params,
  searchParams,
}: Props) {
  const { raceSlug, section } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionUser = await requireConsoleUser(
    `/console/races/${raceSlug}/organizer/${section}`,
  );
  if (!organizerConsoleSections.includes(section as (typeof organizerConsoleSections)[number])) {
    notFound();
  }

  const context = await getConsoleRaceBySlugForAccess({
    access: "organizer",
    raceSlug,
    roles: sessionUser.roles,
    userId: sessionUser.id,
  });
  if (!context) {
    redirect("/console/races");
  }

  const [judgeAssignments, judges] = await Promise.all([
    listJudgeAssignmentsForRace(context.race.id),
    listUsersByRole("JUDGE"),
  ]);
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
        { label: organizerSectionLabels[section] ?? section },
      ]}
      description="主办方在单场赛事上下文中的工作台。"
      navItems={buildConsoleSectionNavItems({
        baseHref: `/console/races/${raceSlug}/organizer`,
        items: organizerConsoleSections,
        labels: organizerSectionLabels,
      })}
      title={`${context.race.title} / 主办方`}
      user={{ username: sessionUser.username, roles: sessionUser.roles }}
    >
      <OrganizerConsolePageView
        feedback={feedback}
        judgeAssignments={judgeAssignments}
        judges={judges.map((judge) => ({ id: judge.id, username: judge.username }))}
        race={context.race}
        raceSlug={raceSlug}
        section={section as (typeof organizerConsoleSections)[number]}
      />
    </ConsoleShell>
  );
}
