import { createRaceAction } from "@/app/actions";
import { CreateRaceForm, Panel } from "@/app/_components/ary-shared";
import { ConsoleShell, buildConsoleRootNavItems } from "@/app/_components/console/console-shell";
import { loadDatabaseUser } from "@/lib/auth";
import { getConsoleHomeSections, getCreateRacePageAccess } from "@/lib/viewer-access";
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
        { href: "/console", label: "Console" },
        { href: "/console/races", label: "Race Console" },
        { label: "Create Race" },
      ]}
      description="Organizer-only race creation lives under Console instead of the public site."
      navItems={buildConsoleRootNavItems(sections)}
      title="Create Race"
    >
      <Panel title="Create Race" eyebrow="Organizer View">
        <div className="stack">
          <a className="button-secondary" href="/console/races">
            Back to Race Console
          </a>
          <p className="muted">
            This route replaces the old public-side creation entry.
          </p>
        </div>
      </Panel>

      <Panel title="Race Form" eyebrow="Organizer View">
        <CreateRaceForm action={createRaceAction} />
      </Panel>
    </ConsoleShell>
  );
}
