import { loadDatabaseUser } from "@/lib/auth";
import { hasRole } from "@/lib/user-roles";
import { redirect } from "next/navigation";
import CalibratorClient from "./CalibratorClient";

export const dynamic = "force-dynamic";

export default async function CalibratorPage() {
  const user = await loadDatabaseUser();

  // 仅 Organizer 可访问
  if (!user || !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }

  return <CalibratorClient />;
}
