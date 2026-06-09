import { JumbotronRaceLiveView } from "@/app/jumbotron/_components/jumbotron-race-live-view";
import {
  buildJumbotronSnapshotFromRace,
  type DcrRaceInput,
} from "@/lib/jumbotron/adapter";
import {
  cityHairpinTrack,
  devcompassOvalTrack,
} from "@/lib/jumbotron/mock-racing-data";
import { listRaces } from "@/lib/services/races";

export const dynamic = "force-dynamic";

interface JumbotronSearchParams {
  debug?: string;
  raceId?: string;
  track?: string;
}

export default async function JumbotronPage({
  searchParams,
}: {
  searchParams?: Promise<JumbotronSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const races = await loadJumbotronRaces();
  const race = selectRace(races, params.raceId);
  const track = params.track === "city-hairpin" ? cityHairpinTrack : devcompassOvalTrack;
  const snapshot = buildJumbotronSnapshotFromRace(
    race as DcrRaceInput | null,
    track,
    new Date(),
  );

  return (
    <JumbotronRaceLiveView
      debug={params.debug === "1" || params.debug === "true"}
      races={races.map((item) => ({
        id: item.id,
        title: item.title,
      }))}
      snapshot={snapshot}
    />
  );
}

async function loadJumbotronRaces(): Promise<Awaited<ReturnType<typeof listRaces>>> {
  try {
    return await listRaces();
  } catch (error) {
    console.warn("Jumbotron fell back to mock data because races failed to load.", error);
    return [];
  }
}

function selectRace<T extends { id: string; phase: string }>(
  races: T[],
  raceId: string | undefined,
): T | null {
  if (raceId) {
    return races.find((race) => race.id === raceId) ?? null;
  }

  return (
    races.find((race) => race.phase === "active") ??
    races.find((race) => race.phase === "frozen") ??
    races[0] ??
    null
  );
}
