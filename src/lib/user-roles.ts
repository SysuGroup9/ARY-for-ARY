export const appRoles = ["ADMIN", "JUDGE", "ORGANIZER", "RIDER"] as const;

export type AppRole = (typeof appRoles)[number];

const rolePriority: Record<AppRole, number> = {
  ADMIN: 0,
  JUDGE: 1,
  ORGANIZER: 2,
  RIDER: 3,
};

export function normalizeRoles(input: readonly string[]): AppRole[] {
  const filtered = input.filter((role): role is AppRole =>
    appRoles.includes(role as AppRole),
  );
  const unique = [...new Set(filtered)].sort(
    (left, right) => rolePriority[left] - rolePriority[right],
  );
  return unique.length === 0 ? ["RIDER"] : unique;
}

export function parseRolesJson(raw: string): AppRole[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return ["RIDER"];
    }

    return normalizeRoles(
      parsed.filter((item): item is string => typeof item === "string"),
    );
  } catch {
    return ["RIDER"];
  }
}

export function serializeRoles(input: readonly string[]): string {
  return JSON.stringify(normalizeRoles(input));
}

export function hasRole(roles: readonly AppRole[], role: AppRole): boolean {
  return roles.includes(role);
}

export function getDefaultActiveRole(roles: readonly AppRole[]): AppRole {
  return normalizeRoles(roles)[0];
}

const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "管理员",
  JUDGE: "评委",
  ORGANIZER: "主办方",
  RIDER: "骑手",
};

export function getRoleLabels(roles: readonly AppRole[]): string[] {
  return normalizeRoles(roles).map((r) => ROLE_LABELS[r]);
}
