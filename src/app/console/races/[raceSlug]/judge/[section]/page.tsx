import { ConsoleShell, buildConsoleSectionNavItems, judgeConsoleSections } from "@/app/_components/console/console-shell";
import { JudgeConsolePageView } from "@/app/_components/console/judge-console-page";
import { loadDatabaseUser } from "@/lib/auth";
import { getConsoleRaceBySlug } from "@/lib/services/console-routes";
import { listJudgeAssignmentsForUserInRace } from "@/lib/services/judging";
import { getConsoleRaceViewAccess } from "@/lib/viewer-access";
import { notFound, redirect } from "next/navigation";

const judgeSectionLabels: Record<string, string> = {
  assigned: "已分配作品",
  reviewing: "评审中",
  submitted: "已提交评审",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string; section: string }>;
}

export default async function JudgeConsoleSectionPage({ params }: Props) {
  const sessionUser = await loadDatabaseUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const { raceSlug, section } = await params;
  if (!judgeConsoleSections.includes(section as (typeof judgeConsoleSections)[number])) {
    notFound();
  }

  const context = await getConsoleRaceBySlug(raceSlug);
  if (!context) {
    notFound();
  }

  const assignments = await listJudgeAssignmentsForUserInRace({
    raceId: context.race.id,
    userId: sessionUser.id,
  });

  const scopedAccess = getConsoleRaceViewAccess({
    roles: sessionUser.roles,
    view: "judge",
    isRaceOrganizer: false,
    isRaceJudge: assignments.length > 0,
    isRaceRider: false,
  });

  if (!scopedAccess.allowed) {
    redirect(scopedAccess.redirectTo ?? "/console/races");
  }

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
        race={context.race}
        raceSlug={raceSlug}
        section={section as (typeof judgeConsoleSections)[number]}
      />
    </ConsoleShell>
  );
}
