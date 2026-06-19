import { createRaceAction } from "@/app/actions";
import { CreateRaceForm, Panel } from "@/app/_components/ary-shared";
import {
  ConsoleShell,
  buildConsoleRootNavItems,
} from "@/app/_components/console/console-shell";
import { loadDatabaseUser } from "@/lib/auth";
import {
  getConsoleHomeSections,
  getCreateRacePageAccess,
} from "@/lib/viewer-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConsoleNewRacePage() {
  const sessionUser = await loadDatabaseUser();
  const access = getCreateRacePageAccess(sessionUser?.roles ?? null);

  if (!access.allowed) {
    redirect(access.redirectTo ?? "/console");
  }

  const sections = getConsoleHomeSections(sessionUser?.roles ?? null);

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/console", label: "控制台" },
        { href: "/console/races", label: "赛事控制台" },
        { label: "创建赛事" },
      ]}
      description="该页面承接原先位于公开首页的创建赛事入口。"
      navItems={buildConsoleRootNavItems(sections)}
      title="创建赛事"
    >
      <Panel title="创建赛事" eyebrow="主办方视图">
        <div className="stack">
          <a className="button-secondary" href="/console/races">
            返回赛事控制台
          </a>
          <p className="muted">该页面承接原先位于公开首页的创建赛事入口。</p>
        </div>
      </Panel>

      <Panel title="赛事表单" eyebrow="主办方视图">
        <CreateRaceForm action={createRaceAction} />
      </Panel>
    </ConsoleShell>
  );
}
