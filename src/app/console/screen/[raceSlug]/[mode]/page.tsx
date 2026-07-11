import {
  ConsoleShell,
  buildConsoleSectionNavItems,
  screenConsoleModes,
} from "@/app/_components/console/console-shell";
import { ScreenConsolePageView } from "@/app/_components/console/screen-console-page";
import { getActionFeedbackContent } from "@/lib/action-feedback";
import { requireConsoleUser } from "@/lib/auth";
import { getEffectiveTrackProfileFromSnapshot } from "@/lib/jumbotron/track-config";
import { getScreenConsoleRaceBySlugForUser } from "@/lib/services/console-routes";
import { resolveRaceSnapshotForDisplay } from "@/lib/services/race-snapshot";
import { getConsoleScreenAccess } from "@/lib/viewer-access";
import { notFound, redirect } from "next/navigation";

const screenModeLabels: Record<string, string> = {
  jumbotron: "大屏",
  billboard: "看板",
  live: "实况",
  leaderboard: "榜单",
  works: "作品",
  announcement: "公告",
  calibration: "校准",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ mode: string; raceSlug: string }>;
  searchParams?: Promise<{
    feedbackMessage?: string;
    feedbackScope?: string;
  }>;
}

export default async function ScreenConsoleModePage({
  params,
  searchParams,
}: Props) {
  const { mode, raceSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionUser = await requireConsoleUser(
    `/console/screen/${raceSlug}/${mode}`,
  );
  const access = getConsoleScreenAccess(sessionUser.roles);

  if (!access.allowed) {
    redirect(access.redirectTo ?? "/console");
  }
  if (!screenConsoleModes.includes(mode as (typeof screenConsoleModes)[number])) {
    notFound();
  }

  const context = await getScreenConsoleRaceBySlugForUser({
    raceSlug,
    roles: sessionUser.roles,
    userId: sessionUser.id,
  });
  if (!context) {
    notFound();
  }

  const jumbotronPreview =
    mode === "jumbotron"
      ? await buildJumbotronPreview(context.race.id)
      : undefined;
  const feedback = getActionFeedbackContent({
    message: resolvedSearchParams?.feedbackMessage,
    scope: resolvedSearchParams?.feedbackScope,
  });

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/console", label: "控制台" },
        { href: "/console/screen", label: "大屏控制台" },
        { href: `/console/screen/${raceSlug}/jumbotron`, label: context.race.title },
        { label: screenModeLabels[mode] ?? mode },
      ]}
      description="按 `grs003` 模式分支组织的大屏控制路由。"
      navItems={buildConsoleSectionNavItems({
        baseHref: `/console/screen/${raceSlug}`,
        items: screenConsoleModes,
        labels: screenModeLabels,
      })}
      title={`${context.race.title} / 大屏`}
      user={{ username: sessionUser.username, roles: sessionUser.roles }}
    >
      <ScreenConsolePageView
        feedback={feedback}
        mode={mode as (typeof screenConsoleModes)[number]}
        race={context.race}
        raceSlug={raceSlug}
        screenDisplay={context.race.screenDisplay}
        jumbotronPreview={jumbotronPreview}
      />
    </ConsoleShell>
  );
}

async function buildJumbotronPreview(raceId: string) {
  const snapshotResult = await resolveRaceSnapshotForDisplay(raceId);
  const trackProfile = snapshotResult.snapshot
    ? getEffectiveTrackProfileFromSnapshot(snapshotResult.snapshot)
    : null;
  const source =
    snapshotResult.snapshot && trackProfile ? snapshotResult.source : "static";

  return {
    fallbackReason:
      source === "static"
        ? snapshotResult.fallbackReason ?? "track_profile_unavailable"
        : snapshotResult.fallbackReason,
    snapshot: source === "static" ? null : snapshotResult.snapshot,
    source,
    trackProfile: source === "static" ? null : trackProfile,
  };
}
