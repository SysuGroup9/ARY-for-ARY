export function buildJudgingScoreJson(score: number) {
  return { overall: score };
}

export function getJudgingRecordState(
  submittedAt: Date | null,
): "DRAFT" | "SUBMITTED" {
  return submittedAt ? "SUBMITTED" : "DRAFT";
}
