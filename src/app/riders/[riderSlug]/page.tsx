import { RiderProfilePageView } from "@/app/_components/public/rider-profile-page";
import { getRiderBySlug } from "@/lib/services/public-routes";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ riderSlug: string }>;
}

export default async function RiderPage({ params }: Props) {
  const { riderSlug } = await params;
  const rider = await getRiderBySlug(riderSlug);

  if (!rider) {
    notFound();
  }

  return (
    <RiderProfilePageView
      featuredRaceTitle={rider.featuredRaceTitle}
      featuredWorkTitle={rider.featuredWorkTitle}
      orgLabel={rider.orgLabel}
      publicWorkLinks={rider.publicWorkLinks}
      raceCount={rider.raceCount}
      raceRecords={rider.raceRecords}
      username={rider.username}
      workCount={rider.workCount}
    />
  );
}
