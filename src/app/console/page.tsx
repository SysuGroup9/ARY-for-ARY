import { Panel, aryStyles } from "@/app/_components/ary-shared";
import { loadDatabaseUser } from "@/lib/auth";
import { getRoleCapabilities } from "@/lib/viewer-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConsoleEntryPage() {
  const sessionUser = await loadDatabaseUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const { canManage, canRide } = getRoleCapabilities(sessionUser.role);

  return (
    <main className="shell shell--public-only">
      <section className="content content--public">
        <Panel title="Console Entry" eyebrow="Workspace Entry">
          <div className="stack">
            <p className="muted">
              这是 `grs003` 第 1 片区里的最小 Console Entry，占位承接已登录用户离开公开端后的入口。
            </p>
            <ul className="bullet-list">
              {canManage ? <li>Organizer View 后续会进入 Race Console</li> : null}
              {canRide ? <li>Rider View 后续会进入 Race Workspace</li> : null}
              {!canManage && !canRide ? <li>当前账号暂无公开定义的工作台视角</li> : null}
            </ul>
            <div className="button-row-inline">
              <a className="button-secondary" href="/">
                返回公开首页
              </a>
              {canManage ? (
                <a className="button-secondary" href="/races/new">
                  创建赛事
                </a>
              ) : null}
            </div>
          </div>
        </Panel>
      </section>
      <style>{aryStyles}</style>
    </main>
  );
}
