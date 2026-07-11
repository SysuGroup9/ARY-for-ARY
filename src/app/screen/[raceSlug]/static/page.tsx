import { StaticDisplayFallback } from "@/app/_components/public/static-display-fallback";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function ScreenStaticNoticePage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  return <StaticDisplayFallback race={race} raceSlug={raceSlug} />;
}
