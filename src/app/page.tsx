import { aryStyles } from "@/app/_components/ary-shared";
import { HomeGallery } from "@/app/_components/public/home-gallery";
import { PublicHomeHero } from "@/app/_components/public/public-home-hero";
import { PublicHeader } from "@/app/_components/public/public-header";
import { loadDatabaseUser } from "@/lib/auth";
import { listRaces } from "@/lib/services/races";
import { buildPublicSiteModel } from "@/lib/public-site";
import { getRoleCapabilities } from "@/lib/viewer-access";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = await loadDatabaseUser();

  const races = await listRaces();
  const { canManage, canRide } = getRoleCapabilities(sessionUser?.role ?? null);

  const publicModel = buildPublicSiteModel(races);

  return (
    <main>
      <PublicHeader hasSession={!!sessionUser} />
      <PublicHomeHero model={publicModel} />

      <section className="shell shell--public-only">
        <section className="content content--public">
          <HomeGallery canManage={canManage} canRide={canRide} model={publicModel} />
        </section>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
