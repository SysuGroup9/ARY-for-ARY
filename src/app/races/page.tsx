import { RacesIndexPageView } from "@/app/_components/public/races-index-page";
import { PublicHeader } from "@/app/_components/public/public-header";
import { aryStyles } from "@/app/_components/ary-shared";
import { loadDatabaseUser } from "@/lib/auth";
import { buildPublicSiteModel } from "@/lib/public-site";
import { listRaces } from "@/lib/services/races";

export const dynamic = "force-dynamic";

export default async function RacesPage() {
  const sessionUser = await loadDatabaseUser();
  const races = await listRaces();
  const publicModel = buildPublicSiteModel(races);

  return (
    <main>
      <PublicHeader roles={sessionUser?.roles ?? null} />
      <section className="shell shell--public-only">
        <section className="content content--public">
          <RacesIndexPageView model={publicModel} />
        </section>
      </section>
      <style>{aryStyles}</style>
    </main>
  );
}
