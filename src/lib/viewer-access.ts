import type { AppRole } from "@/lib/user-roles";
import { hasRole, normalizeRoles } from "@/lib/user-roles";

type ConsoleSection = "admin" | "races" | "screen";
type ConsoleRaceView = "judge" | "organizer" | "rider";

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

export function getRoleCapabilities(roles: readonly AppRole[] | null): {
  canAdmin: boolean;
  canJudge: boolean;
  canManage: boolean;
  canRide: boolean;
  canUseScreen: boolean;
} {
  const normalized = roles ? normalizeRoles(roles) : [];

  return {
    canAdmin: hasRole(normalized, "ADMIN"),
    canJudge: hasRole(normalized, "JUDGE"),
    canManage: hasRole(normalized, "ORGANIZER"),
    canRide: hasRole(normalized, "RIDER"),
    canUseScreen:
      hasRole(normalized, "ADMIN") || hasRole(normalized, "ORGANIZER"),
  };
}

export function getCreateRacePageAccess(roles: readonly AppRole[] | null): {
  allowed: boolean;
  redirectTo: "/" | "/console" | "/login" | null;
} {
  const normalized = roles ? normalizeRoles(roles) : [];

  if (hasRole(normalized, "ORGANIZER")) {
    return {
      allowed: true,
      redirectTo: null,
    };
  }

  return {
    allowed: false,
    redirectTo: roles ? "/console" : "/login",
  };
}

export function getCreateRaceBackTarget(): "/" | "/console/races" {
  return "/";
}

export function getConsoleEntryTarget(hasSession: boolean): "/console" | "/login" {
  return hasSession ? "/console" : "/login";
}

export function getConsoleHomeSections(
  roles: readonly AppRole[] | null,
): ConsoleSection[] {
  const normalized = roles ? normalizeRoles(roles) : [];
  const sections = new Set<ConsoleSection>();

  if (
    hasRole(normalized, "RIDER") ||
    hasRole(normalized, "JUDGE") ||
    hasRole(normalized, "ORGANIZER")
  ) {
    sections.add("races");
  }

  if (hasRole(normalized, "ADMIN")) {
    sections.add("admin");
  }

  if (
    hasRole(normalized, "ADMIN") ||
    hasRole(normalized, "ORGANIZER")
  ) {
    sections.add("screen");
  }

  return (["admin", "races", "screen"] as const).filter((section) =>
    sections.has(section),
  );
}

export function getConsoleDefaultHref(roles: readonly AppRole[] | null): string {
  const normalized = roles ? normalizeRoles(roles) : [];

  if (hasRole(normalized, "ADMIN")) {
    return "/console/admin/users";
  }

  if (
    hasRole(normalized, "ORGANIZER") ||
    hasRole(normalized, "RIDER") ||
    hasRole(normalized, "JUDGE")
  ) {
    return "/console/races";
  }

  return "/login";
}

export function getConsoleRaceViewAccess(input: {
  roles: readonly AppRole[] | null;
  view: ConsoleRaceView;
  isRaceOrganizer: boolean;
  isRaceJudge?: boolean;
  isRaceRider: boolean;
}): {
  allowed: boolean;
  redirectTo: "/console/races" | "/login" | null;
} {
  if (!input.roles) {
    return {
      allowed: false,
      redirectTo: "/login",
    };
  }

  const normalized = normalizeRoles(input.roles);

  if (input.view === "organizer") {
    const allowed = hasRole(normalized, "ORGANIZER") && input.isRaceOrganizer;
    return {
      allowed,
      redirectTo: allowed ? null : "/console/races",
    };
  }

  if (input.view === "rider") {
    const allowed = hasRole(normalized, "RIDER") && input.isRaceRider;
    return {
      allowed,
      redirectTo: allowed ? null : "/console/races",
    };
  }

  const allowed = hasRole(normalized, "JUDGE") && !!input.isRaceJudge;
  return {
    allowed,
    redirectTo: allowed ? null : "/console/races",
  };
}

export function getConsoleAdminAccess(roles: readonly AppRole[] | null): {
  allowed: boolean;
  redirectTo: "/console" | "/login" | null;
} {
  if (!roles) {
    return {
      allowed: false,
      redirectTo: "/login",
    };
  }

  const allowed = hasRole(normalizeRoles(roles), "ADMIN");
  return {
    allowed,
    redirectTo: allowed ? null : "/console",
  };
}

export function getConsoleScreenAccess(roles: readonly AppRole[] | null): {
  allowed: boolean;
  redirectTo: "/console" | "/login" | null;
} {
  if (!roles) {
    return {
      allowed: false,
      redirectTo: "/login",
    };
  }

  const normalized = normalizeRoles(roles);
  const allowed =
    hasRole(normalized, "ADMIN") || hasRole(normalized, "ORGANIZER");

  return {
    allowed,
    redirectTo: allowed ? null : "/console",
  };
}
