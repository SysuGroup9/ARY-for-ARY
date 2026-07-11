import { ConsoleShell, buildConsoleSectionNavItems, riderConsoleSections } from "@/app/_components/console/console-shell";
import { RiderConsolePageView } from "@/app/_components/console/rider-console-page";
import { getActionFeedbackContent } from "@/lib/action-feedback";
import { requireConsoleUser } from "@/lib/auth";
import {
  getConsoleRaceBySlugForAccess,
  getConsoleRiderTeamContext,
} from "@/lib/services/console-routes";
import { getRegistrationForUser } from "@/lib/services/registrations";
import { buildRiderConsoleReportModel } from "@/lib/services/rider-console";
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
  searchParams?: Promise<{
    feedbackMessage?: string;
    feedbackScope?: string;
  }>;
}

export default async function RiderConsoleSectionPage({
  params,
  searchParams,
}: Props) {
  const { raceSlug, section } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionUser = await requireConsoleUser(
    `/console/races/${raceSlug}/rider/${section}`,
  );
  if (!riderConsoleSections.includes(section as (typeof riderConsoleSections)[number])) {
    notFound();
  }

  const context = await getConsoleRaceBySlugForAccess({
    access: "rider",
    raceSlug,
    roles: sessionUser.roles,
    userId: sessionUser.id,
  });
  if (!context) {
    redirect("/console/races");
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
        { label: riderSectionLabels[section] ?? section },
      ]}
      description="骑手在单场赛事上下文中的工作台。"
      navItems={buildConsoleSectionNavItems({
        baseHref: `/console/races/${raceSlug}/rider`,
        items: riderConsoleSections,
        labels: riderSectionLabels,
      })}
      title={`${context.race.title} / 骑手`}
      user={{ username: sessionUser.username, roles: sessionUser.roles }}
    >
      <RiderConsolePageView
        feedback={feedback}
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
