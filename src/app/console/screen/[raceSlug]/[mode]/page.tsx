import {
  ConsoleShell,
  buildConsoleSectionNavItems,
  screenConsoleModes,
} from "@/app/_components/console/console-shell";
import { ScreenConsolePageView } from "@/app/_components/console/screen-console-page";
import { loadDatabaseUser } from "@/lib/auth";
import { getEffectiveTrackProfileFromSnapshot } from "@/lib/jumbotron/track-config";
import { getConsoleRaceBySlug } from "@/lib/services/console-routes";
import { buildRaceSnapshot } from "@/lib/services/race-snapshot";
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
}

export default async function ScreenConsoleModePage({ params }: Props) {
  const sessionUser = await loadDatabaseUser();
  const access = getConsoleScreenAccess(sessionUser?.roles ?? null);

  if (!access.allowed) {
    redirect(access.redirectTo ?? "/console");
  }

  const { mode, raceSlug } = await params;
  if (!screenConsoleModes.includes(mode as (typeof screenConsoleModes)[number])) {
    notFound();
  }

  const context = await getConsoleRaceBySlug(raceSlug);
  if (!context) {
    notFound();
  }

  const jumbotronPreview =
    mode === "jumbotron"
      ? await buildJumbotronPreview(context.race.id)
      : undefined;

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
    >
      <ScreenConsolePageView
        mode={mode as (typeof screenConsoleModes)[number]}
        race={context.race}
        raceSlug={raceSlug}
        jumbotronPreview={jumbotronPreview}
      />
    </ConsoleShell>
  );
}

async function buildJumbotronPreview(raceId: string) {
  const snapshot = await buildRaceSnapshot(raceId);
  const trackProfile = getEffectiveTrackProfileFromSnapshot(snapshot);
  return { snapshot, trackProfile };
}
