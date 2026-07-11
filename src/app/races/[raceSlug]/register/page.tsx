import { aryStyles } from "@/app/_components/ary-shared";
import { PublicHeader } from "@/app/_components/public/public-header";
import { RaceRegisterPageView } from "@/app/_components/public/race-register-page";
import { getActionFeedbackContent } from "@/lib/action-feedback";
import { loadDatabaseUser } from "@/lib/auth";
import { getRaceBySlug } from "@/lib/services/public-routes";
import { getRegistrationForUser } from "@/lib/services/registrations";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ raceSlug: string }>;
  searchParams?: Promise<{
    feedbackMessage?: string;
    feedbackScope?: string;
  }>;
}

export default async function RaceRegisterPage({ params, searchParams }: Props) {
  const { raceSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const race = await getRaceBySlug(raceSlug);

  if (!race) {
    notFound();
  }

  const sessionUser = await loadDatabaseUser();
  const registration = sessionUser
    ? await getRegistrationForUser(race.id, sessionUser.id)
    : null;
  const feedback = getActionFeedbackContent({
    message: resolvedSearchParams?.feedbackMessage,
    scope: resolvedSearchParams?.feedbackScope,
  });

  return (
    <main>
      <PublicHeader roles={sessionUser?.roles ?? null} />
      <section className="shell shell--public-only">
        <section className="content content--public">
          <RaceRegisterPageView
            feedback={feedback}
            race={race}
            raceSlug={raceSlug}
            registration={registration}
            sessionUser={sessionUser}
          />
        </section>
      </section>
      <style>{aryStyles}</style>
    </main>
  );
}
