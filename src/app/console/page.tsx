import { ConsoleHomeView } from "@/app/_components/console/console-home";
import { ConsoleShell, buildConsoleRootNavItems } from "@/app/_components/console/console-shell";
import { loadDatabaseUser } from "@/lib/auth";
import { listConsoleRacesForUser } from "@/lib/services/console-routes";
import { getConsoleHomeSections } from "@/lib/viewer-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConsoleEntryPage() {
  const sessionUser = await loadDatabaseUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const sections = getConsoleHomeSections(sessionUser.roles);
  const races = sections.includes("races")
    ? await listConsoleRacesForUser({
        roles: sessionUser.roles,
        userId: sessionUser.id,
      })
    : [];

  return (
    <ConsoleShell
      breadcrumbs={[{ href: "/", label: "公开站" }, { label: "控制台" }]}
      description="独立的工作台入口，用于进入赛事控制台、管理控制台和大屏控制台。"
      navItems={buildConsoleRootNavItems(sections)}
      title="控制台首页"
    >
      <ConsoleHomeView raceCount={races.length} sections={sections} />
    </ConsoleShell>
  );
}
