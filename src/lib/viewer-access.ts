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

export function getCreateRacePageAccess(role: UserRole | null): {
  allowed: boolean;
  redirectTo: "/" | "/login" | null;
} {
  if (role === "ORGANIZER") {
    return {
      allowed: true,
      redirectTo: null,
    };
  }

  return {
    allowed: false,
    redirectTo: role ? "/" : "/login",
  };
}

export function getCreateRaceBackTarget(): "/" {
  return "/";
}

export function getConsoleEntryTarget(hasSession: boolean): "/console" | "/login" {
  return hasSession ? "/console" : "/login";
}
