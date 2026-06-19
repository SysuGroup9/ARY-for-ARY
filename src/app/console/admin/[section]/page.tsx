import { AdminConsolePageView } from "@/app/_components/console/admin-console-page";
import {
  ConsoleShell,
  adminConsoleSections,
  buildConsoleSectionNavItems,
} from "@/app/_components/console/console-shell";
import { loadDatabaseUser } from "@/lib/auth";
import { listUsers } from "@/lib/services/users";
import { getConsoleAdminAccess } from "@/lib/viewer-access";
import { notFound, redirect } from "next/navigation";

const adminSectionLabels: Record<string, string> = {
  users: "用户列表",
  "profile-completion": "资料补全",
  roles: "角色维护",
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
  if (
    !adminConsoleSections.includes(
      section as (typeof adminConsoleSections)[number],
    )
  ) {
    notFound();
  }

  const users = await listUsers();

  return (
    <ConsoleShell
      breadcrumbs={[
        { href: "/console", label: "控制台" },
        { href: "/console/admin/users", label: "管理控制台" },
        { label: adminSectionLabels[section] ?? section },
      ]}
      description="最小账号治理视图，用于查看用户、资料补全状态与角色维护。"
      navItems={buildConsoleSectionNavItems({
        baseHref: "/console/admin",
        items: adminConsoleSections,
        labels: adminSectionLabels,
      })}
      title="管理控制台"
    >
      <AdminConsolePageView
        section={section as (typeof adminConsoleSections)[number]}
        users={users}
      />
    </ConsoleShell>
  );
}
