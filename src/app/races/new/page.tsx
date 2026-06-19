import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyNewRacePage() {
  redirect("/console/races/new");
}
