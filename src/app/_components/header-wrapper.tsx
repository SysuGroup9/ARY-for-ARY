"use client";

import { usePathname } from "next/navigation";
import { PublicHeader } from "@/app/_components/public/public-header";
import type { AppRole } from "@/lib/user-roles";

const HIDDEN_PREFIXES = ["/screen/", "/screen", "/jumbotron/", "/jumbotron"];

export function HeaderWrapper({ roles }: { roles: readonly AppRole[] | null }) {
  const pathname = usePathname();
  if (pathname && HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <PublicHeader roles={roles} />;
}
