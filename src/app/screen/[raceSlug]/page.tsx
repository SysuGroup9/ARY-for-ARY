import { getRaceBySlug } from "@/lib/services/public-routes";
import {
  resolveScreenDisplayHref,
  type ScreenDisplayFallbackMode,
  type ScreenDisplayMode,
} from "@/lib/services/screen-display";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function ScreenDisplayPage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  const href = resolveScreenDisplayHref({
    fallbackMode:
      (race.screenDisplay?.fallbackMode as ScreenDisplayFallbackMode | undefined) ??
      "auto",
    mode:
      (race.screenDisplay?.mode as ScreenDisplayMode | undefined) ?? "jumbotron",
    raceId: race.id,
    raceSlug,
  });

  redirect(href);
}
