import { BillboardDisplayView } from "@/app/_components/public/billboard-display";
import { ScreenDisplayShell } from "@/app/_components/public/screen-display-shell";
import { aryStyles } from "@/app/_components/ary-shared";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { buildPublicResultsModel } from "@/lib/services/results";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function ScreenBillboardPage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  const resultsModel = await buildPublicResultsModel(race.id);
  const latestAnnouncement =
    [...(race.announcements ?? [])]
      .filter((announcement) => announcement.visibility === "PUBLIC" && announcement.publishedAt)
      .sort(
        (left, right) =>
          right.publishedAt!.getTime() - left.publishedAt!.getTime(),
      )[0] ?? null;
  const riskCount = parseRiskCount(race.projections);
  const screenFeedItems = parseScreenFeedItems(race.projections);

  return (
    <main>
      <ScreenDisplayShell
        modeLabel="Billboard"
        raceTitle={race.title}
        theme={race.screenDisplay?.theme}
      >
        <BillboardDisplayView
          awards={resultsModel.awards}
          latestAnnouncement={latestAnnouncement}
          race={race}
          screenFeedItems={screenFeedItems}
          ridingSkillHighlights={resultsModel.ridingSkillHighlights}
          riskCount={riskCount}
        />
      </ScreenDisplayShell>
      <style>{aryStyles}</style>
    </main>
  );
}

function parseRiskCount(
  projections: Array<{ payloadJson: string; type: string }>,
) {
  const payloadJson = projections.find((projection) => projection.type === "RISK")
    ?.payloadJson;
  if (!payloadJson) {
    return 0;
  }

  try {
    const parsed = JSON.parse(payloadJson) as Array<{
      aggregateIngestionStatus: string;
    }>;
    return parsed.filter(
      (item) =>
        item.aggregateIngestionStatus === "FAILED" ||
        item.aggregateIngestionStatus === "NOT_CONFIGURED",
    ).length;
  } catch {
    return 0;
  }
}

function parseScreenFeedItems(
  projections: Array<{ payloadJson: string; type: string }>,
) {
  const payloadJson = projections.find(
    (projection) => projection.type === "SCREEN_FEED",
  )?.payloadJson;
  if (!payloadJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(payloadJson) as {
      items?: Array<{
        summary: string;
        type:
          | "announcement"
          | "current_leaderboard_projection"
          | "leaderboard_read_model"
          | "session_summary"
          | "works";
      }>;
    };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}
