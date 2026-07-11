export function buildJudgingScoreJson(score: number) {
  return { overall: score };
}

export function readJudgingScoreTotal(scoreJson: null | string | undefined): number {
  if (!scoreJson) {
    return 0;
  }

  try {
    const parsed = JSON.parse(scoreJson);
    const overall = parsed?.overall;
    return typeof overall === "number" && Number.isFinite(overall) ? overall : 0;
  } catch {
    return 0;
  }
}

export function getJudgingRecordState(
  submittedAt: Date | null,
): "DRAFT" | "SUBMITTED" {
  return submittedAt ? "SUBMITTED" : "DRAFT";
}
