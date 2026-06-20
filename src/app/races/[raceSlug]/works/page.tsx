import { WorksPageView } from "@/app/_components/public/works-page";
import { aryStyles } from "@/app/_components/ary-shared";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function RaceWorksPage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  return (
    <main>
      <WorksPageView race={race} />
      <style>{aryStyles}</style>
    </main>
  );
}
