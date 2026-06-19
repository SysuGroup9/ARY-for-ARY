import { ConsoleRacesPageView } from "@/app/_components/console/console-races-page";
import { ConsoleShell, buildConsoleRootNavItems } from "@/app/_components/console/console-shell";
import { loadDatabaseUser } from "@/lib/auth";
import { listConsoleRacesForUser } from "@/lib/services/console-routes";
import { getConsoleHomeSections } from "@/lib/viewer-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConsoleRacesPage() {
  const sessionUser = await loadDatabaseUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const sections = getConsoleHomeSections(sessionUser.roles);
  const races = await listConsoleRacesForUser({
    roles: sessionUser.roles,
    userId: sessionUser.id,
  });

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/console", label: "控制台" },
        { label: "赛事控制台" },
      ]}
      description="选择一个你可进入的赛事工作台。"
      navItems={buildConsoleRootNavItems(sections)}
      title="赛事控制台"
    >
      <ConsoleRacesPageView races={races} />
    </ConsoleShell>
  );
}
