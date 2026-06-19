import { loadDatabaseUser } from "@/lib/auth";
import { getConsoleDefaultHref, getConsoleRaceViewAccess } from "@/lib/viewer-access";
import {
  getConsoleRaceBySlug,
  getConsoleRiderTeamContext,
} from "@/lib/services/console-routes";
import { listJudgeAssignmentsForUserInRace } from "@/lib/services/judging";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function ConsoleRaceEntryPage({ params }: Props) {
  const sessionUser = await loadDatabaseUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const { raceSlug } = await params;
  const context = await getConsoleRaceBySlug(raceSlug);

  if (!context) {
    notFound();
  }

  const riderTeam = await getConsoleRiderTeamContext({
    raceId: context.race.id,
    userId: sessionUser.id,
  });
  const judgeAssignments = await listJudgeAssignmentsForUserInRace({
    raceId: context.race.id,
    userId: sessionUser.id,
  });

  const organizerAccess = getConsoleRaceViewAccess({
    roles: sessionUser.roles,
    view: "organizer",
    isRaceOrganizer: context.race.organizerId === sessionUser.id,
    isRaceRider: false,
  });

  if (organizerAccess.allowed) {
    redirect(`/console/races/${raceSlug}/organizer/overview`);
  }

  const riderAccess = getConsoleRaceViewAccess({
    roles: sessionUser.roles,
    view: "rider",
    isRaceOrganizer: false,
    isRaceRider: !!riderTeam,
  });

  if (riderAccess.allowed) {
    redirect(`/console/races/${raceSlug}/rider/registration`);
  }

  const judgeAccess = getConsoleRaceViewAccess({
    roles: sessionUser.roles,
    view: "judge",
    isRaceOrganizer: false,
    isRaceJudge: judgeAssignments.length > 0,
    isRaceRider: false,
  });

  if (judgeAccess.allowed) {
    redirect(`/console/races/${raceSlug}/judge/assigned`);
  }

  redirect(getConsoleDefaultHref(sessionUser.roles));
}
