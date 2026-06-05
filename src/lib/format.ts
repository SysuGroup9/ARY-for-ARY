export function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

export function formatRelativeRole(role: "ORGANIZER" | "RIDER"): string {
  return role === "ORGANIZER" ? "Organizer" : "Rider";
}

export function cn(value: Array<string | false | null | undefined>): string {
  return value.filter(Boolean).join(" ");
}
