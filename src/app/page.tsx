import { aryStyles } from "@/app/_components/ary-shared";
import { HomeGallery } from "@/app/_components/public/home-gallery";
import { PublicHomeHero } from "@/app/_components/public/public-home-hero";

import { loadDatabaseUser } from "@/lib/auth";
import { buildPublicSiteModel } from "@/lib/public-site";
import { listPublicRaces } from "@/lib/services/public-routes";
import { getRoleCapabilities } from "@/lib/viewer-access";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = await loadDatabaseUser();

  const races = await listPublicRaces();
  const { canManage, canRide } = getRoleCapabilities(sessionUser?.roles ?? null);

  const publicModel = buildPublicSiteModel(races);

  return (
    <main>
      <PublicHomeHero />

      <section className="shell shell--public-only">
        <section className="content content--public">
          <HomeGallery canManage={canManage} canRide={canRide} model={publicModel} />
        </section>
      </section>

      <style>{aryStyles}</style>
    </main>
  );
}
