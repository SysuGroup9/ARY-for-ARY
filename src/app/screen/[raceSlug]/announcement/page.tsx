import { AnnouncementDisplayView } from "@/app/_components/public/announcement-display";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function AnnouncementScreenPage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  const latestAnnouncement = [...(race.announcements ?? [])]
    .filter((announcement) => announcement.visibility === "PUBLIC" && announcement.publishedAt)
    .sort(
      (left, right) =>
        right.publishedAt!.getTime() - left.publishedAt!.getTime(),
    )[0] ?? null;

  return (
    <AnnouncementDisplayView
      announcement={latestAnnouncement}
      race={race}
      raceSlug={raceSlug}
      theme={race.screenDisplay?.theme}
    />
  );
}
