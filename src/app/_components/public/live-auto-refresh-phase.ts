const LIVE_AUTO_REFRESH_PHASES = new Set([
  "registration",
  "running",
  "submitting",
  "judging",
  "active",
  "frozen",
]);

export function shouldEnableLiveAutoRefresh(
  phase: null | string | undefined,
): boolean {
  return LIVE_AUTO_REFRESH_PHASES.has(String(phase ?? "").trim().toLowerCase());
}
