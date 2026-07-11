function normalizeReturnTo(value: null | string | undefined): null | string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.startsWith("/profile")) {
    return null;
  }

  return value;
}

export function resolveProfileCompletionReturnTo(
  value: null | string | undefined,
): string {
  return normalizeReturnTo(value) ?? "/";
}

export function buildProfileCompletionHref(
  returnTo?: null | string,
): "/profile" | `/profile?${string}` {
  const normalized = normalizeReturnTo(returnTo);
  if (!normalized) {
    return "/profile";
  }

  return `/profile?${new URLSearchParams({ returnTo: normalized }).toString()}`;
}

export function getPostAuthRedirectTarget(input: {
  profileCompleted: boolean;
  returnTo?: null | string;
}): string {
  const target = resolveProfileCompletionReturnTo(input.returnTo);
  return input.profileCompleted
    ? target
    : buildProfileCompletionHref(target);
}
