import { ConsoleShell, buildConsoleRootNavItems } from "@/app/_components/console/console-shell";
import { ScreenConsolePageView } from "@/app/_components/console/screen-console-page";
import { loadDatabaseUser } from "@/lib/auth";
import { listScreenConsoleRacesForUser } from "@/lib/services/console-routes";
import { getConsoleHomeSections, getConsoleScreenAccess } from "@/lib/viewer-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ScreenConsoleRootPage() {
  const sessionUser = await loadDatabaseUser();
  const access = getConsoleScreenAccess(sessionUser?.roles ?? null);

  if (!access.allowed) {
    redirect(access.redirectTo ?? "/console");
  }

  const sections = getConsoleHomeSections(sessionUser?.roles ?? null);
  const races = await listScreenConsoleRacesForUser({
    roles: sessionUser!.roles,
    userId: sessionUser!.id,
  });

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/console", label: "控制台" },
        { label: "大屏控制台" },
      ]}
      description="选择一场赛事，并进入当前需要的展示模式。"
      navItems={buildConsoleRootNavItems(sections)}
      title="大屏控制台"
    >
      <ScreenConsolePageView races={races} />
    </ConsoleShell>
  );
}
