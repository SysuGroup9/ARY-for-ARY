import { createRaceAction } from "@/app/actions";
import { CreateRaceForm, Panel, aryStyles } from "@/app/_components/ary-shared";
import { loadDatabaseUser } from "@/lib/auth";
import {
  getCreateRaceBackTarget,
  getCreateRacePageAccess,
} from "@/lib/viewer-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewRacePage() {
  const sessionUser = await loadDatabaseUser();
  const access = getCreateRacePageAccess(sessionUser?.role ?? null);

  if (!access.allowed) {
    redirect(access.redirectTo ?? "/");
  }

  const backTarget = getCreateRaceBackTarget();

  return (
    <main className="shell shell--single">
      <section className="content content--single">
        <Panel title="创建赛事" eyebrow="Organizer Studio">
          <div className="stack" style={{ marginBottom: "1.5rem" }}>
            <a className="button-secondary" href={backTarget}>
              返回主页面
            </a>
            <p className="muted">
              这个页面只负责创建赛事。创建成功后会自动返回主页面。
            </p>
          </div>
          <CreateRaceForm action={createRaceAction} />
        </Panel>
      </section>
      <style>{pageStyles}</style>
      <style>{aryStyles}</style>
    </main>
  );
}

const pageStyles = `
.shell--single {
  display: block;
  max-width: 1040px;
}

.content--single {
  width: 100%;
}
`;
