import { ConsoleShell, buildConsoleSectionNavItems, riderConsoleSections } from "@/app/_components/console/console-shell";
import { RiderConsolePageView } from "@/app/_components/console/rider-console-page";
import { loadDatabaseUser } from "@/lib/auth";
import {
  getConsoleRaceBySlug,
  getConsoleRiderTeamContext,
} from "@/lib/services/console-routes";
import { getRegistrationForUser } from "@/lib/services/registrations";
import { buildRiderConsoleReportModel } from "@/lib/services/rider-console";
import { getConsoleRaceViewAccess } from "@/lib/viewer-access";
import { notFound, redirect } from "next/navigation";

const riderSectionLabels: Record<string, string> = {
  registration: "报名",
  "ca-setup": "CA 接入",
  riding: "骑行状态",
  submission: "作品提交",
  review: "评审结果",
  report: "骑手报告",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string; section: string }>;
}

export default async function RiderConsoleSectionPage({ params }: Props) {
  const sessionUser = await loadDatabaseUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const { raceSlug, section } = await params;
  if (!riderConsoleSections.includes(section as (typeof riderConsoleSections)[number])) {
    notFound();
  }

  const context = await getConsoleRaceBySlug(raceSlug);
  if (!context) {
    notFound();
  }

  const riderTeam = await getConsoleRiderTeamContext({
    raceId: context.race.id,
    userId: sessionUser.id,
  });
  const registration = await getRegistrationForUser(context.race.id, sessionUser.id);
  const reportModel = await buildRiderConsoleReportModel({
    raceId: context.race.id,
    userId: sessionUser.id,
  });

  const access = getConsoleRaceViewAccess({
    roles: sessionUser.roles,
    view: "rider",
    isRaceOrganizer: false,
    isRaceRider: !!registration || !!riderTeam,
  });

  if (!access.allowed) {
    redirect(access.redirectTo ?? "/console/races");
  }

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/console", label: "控制台" },
        { href: "/console/races", label: "赛事控制台" },
        { href: `/console/races/${raceSlug}`, label: context.race.title },
        { label: riderSectionLabels[section] ?? section },
      ]}
      description="骑手在单场赛事上下文中的工作台。"
      navItems={buildConsoleSectionNavItems({
        baseHref: `/console/races/${raceSlug}/rider`,
        items: riderConsoleSections,
        labels: riderSectionLabels,
      })}
      title={`${context.race.title} / 骑手`}
    >
      <RiderConsolePageView
        race={context.race}
        registration={registration}
        raceSlug={raceSlug}
        reviewSummary={reportModel.reviewSummary ? { summary: reportModel.reviewSummary.summary, title: reportModel.reviewSummary.title } : null}
        riderReports={reportModel.riderReports.map((report) => ({
          summary: report.summary,
          title: report.title,
        }))}
        riderTeam={riderTeam}
        section={section as (typeof riderConsoleSections)[number]}
      />
    </ConsoleShell>
  );
}
