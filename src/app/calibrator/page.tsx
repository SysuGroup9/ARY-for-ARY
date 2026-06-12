import { loadDatabaseUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CalibratorClient from "./CalibratorClient";

export const dynamic = "force-dynamic";

export default async function CalibratorPage() {
  const user = await loadDatabaseUser();

  // 仅 Organizer 可访问
  if (!user || user.role !== "ORGANIZER") {
    redirect("/");
  }

  return <CalibratorClient />;
}
