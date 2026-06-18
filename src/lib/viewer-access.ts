import type { UserRole } from "@/generated/prisma/enums";

export function getHomeRedirectTarget(
  _hasSession: boolean,
): "/" | "/login" | null {
  return null;
}

export function getLoginRedirectTarget(
  hasSession: boolean,
): "/" | "/login" | null {
  return hasSession ? "/" : null;
}

export function getRoleCapabilities(role: UserRole | null): {
  canManage: boolean;
  canRide: boolean;
} {
  return {
    canManage: role === "ORGANIZER",
    canRide: role === "RIDER",
  };
}
