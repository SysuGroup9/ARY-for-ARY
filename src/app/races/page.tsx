import { RacesIndexPageView } from "@/app/_components/public/races-index-page";

import { aryStyles } from "@/app/_components/ary-shared";
import { loadDatabaseUser } from "@/lib/auth";
import { buildPublicSiteModel } from "@/lib/public-site";
import { listPublicRaces } from "@/lib/services/public-routes";

export const dynamic = "force-dynamic";

export default async function RacesPage() {
  const sessionUser = await loadDatabaseUser();
  const races = await listPublicRaces();
  const publicModel = buildPublicSiteModel(races);

  return (
    <main>

      <section className="shell shell--public-only">
        <section className="content content--public">
          <RacesIndexPageView model={publicModel} />
        </section>
      </section>
      <style>{aryStyles}</style>
    </main>
  );
}
