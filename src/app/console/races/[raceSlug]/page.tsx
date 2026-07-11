import { requireConsoleUser } from "@/lib/auth";
import { getConsoleDefaultHref } from "@/lib/viewer-access";
import { getConsoleRaceEntriesBySlugForUser } from "@/lib/services/console-routes";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function ConsoleRaceEntryPage({ params }: Props) {
  const { raceSlug } = await params;
  const sessionUser = await requireConsoleUser(`/console/races/${raceSlug}`);
  const context = await getConsoleRaceEntriesBySlugForUser({
    raceSlug,
    roles: sessionUser.roles,
    userId: sessionUser.id,
  });

  if (!context) {
    redirect(getConsoleDefaultHref(sessionUser.roles));
  }

  const organizerEntry = context.items.find((item) => item.access === "organizer");
  if (organizerEntry) {
    redirect(organizerEntry.defaultHref);
  }

  const riderEntry = context.items.find((item) => item.access === "rider");
  if (riderEntry) {
    redirect(riderEntry.defaultHref);
  }

  const judgeEntry = context.items.find((item) => item.access === "judge");
  if (judgeEntry) {
    redirect(judgeEntry.defaultHref);
  }

  redirect(getConsoleDefaultHref(sessionUser.roles));
}
