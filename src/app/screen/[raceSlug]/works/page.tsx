import { WorksDisplayView } from "@/app/_components/public/works-display";
import { ScreenDisplayShell } from "@/app/_components/public/screen-display-shell";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function ScreenWorksDisplayPage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  return (
    <main>
      <ScreenDisplayShell
        modeLabel="Works Display"
        raceTitle={race.title}
        theme={race.screenDisplay?.theme}
      >
        <WorksDisplayView race={race} />
      </ScreenDisplayShell>
    </main>
  );
}
