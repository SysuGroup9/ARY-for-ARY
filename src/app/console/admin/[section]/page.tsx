import { AdminConsolePageView } from "@/app/_components/console/admin-console-page";
import { ConsoleShell, adminConsoleSections, buildConsoleSectionNavItems } from "@/app/_components/console/console-shell";
import { loadDatabaseUser } from "@/lib/auth";
import { listUsers } from "@/lib/services/users";
import { getConsoleAdminAccess } from "@/lib/viewer-access";
import { notFound, redirect } from "next/navigation";

const adminSectionLabels: Record<string, string> = {
  users: "Users",
  "profile-completion": "Profile Completion",
  roles: "User Roles",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ section: string }>;
}

export default async function AdminConsoleSectionPage({ params }: Props) {
  const sessionUser = await loadDatabaseUser();
  const access = getConsoleAdminAccess(sessionUser?.roles ?? null);

  if (!access.allowed) {
    redirect(access.redirectTo ?? "/console");
  }

  const { section } = await params;
  if (!adminConsoleSections.includes(section as (typeof adminConsoleSections)[number])) {
    notFound();
  }

  const users = await listUsers();

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/console", label: "Console" },
        { href: "/console/admin/users", label: "Admin Console" },
        { label: adminSectionLabels[section] ?? section },
      ]}
      description="Minimal account and role governance branch."
      navItems={buildConsoleSectionNavItems({
        baseHref: "/console/admin",
        items: adminConsoleSections,
        labels: adminSectionLabels,
      })}
      title="Admin Console"
    >
      <AdminConsolePageView
        section={section as (typeof adminConsoleSections)[number]}
        users={users}
      />
    </ConsoleShell>
  );
}
