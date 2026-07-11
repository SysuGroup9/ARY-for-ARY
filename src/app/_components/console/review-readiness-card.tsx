import type { ReviewReadinessSummary } from "@/lib/review-readiness-helpers";

export function ReviewReadinessCard({
  summary,
}: {
  summary: ReviewReadinessSummary;
}) {
  return (
    <div className="public-link-card">
      <strong>评审前风险提示</strong>
      <span>状态：{getReviewReadinessStatusLabel(summary.status)}</span>
      <span>CA 接入：{getIngestionStatusLabel(summary.aggregateIngestionStatus)}</span>
      <span>内部证据数：{summary.internalEvidenceCount}</span>
      {summary.reviewNeededEvidenceCount > 0 ? (
        <span>需复核证据数：{summary.reviewNeededEvidenceCount}</span>
      ) : null}
      {summary.mediumConfidenceEvidenceCount > 0 ? (
        <span>中可信度证据数：{summary.mediumConfidenceEvidenceCount}</span>
      ) : null}
      {summary.reasons.length ? (
        <div className="stack">
          {summary.reasons.map((reason) => (
            <span key={reason.code}>
              复核原因：{reason.label}（{getSeverityLabel(reason.severity)}）
            </span>
          ))}
          {summary.evidenceFlagCodes.map((flag) => (
            <span key={flag}>复核标记：{flag}</span>
          ))}
        </div>
      ) : (
        <span>复核原因：无</span>
      )}
    </div>
  );
}

function getReviewReadinessStatusLabel(status: ReviewReadinessSummary["status"]) {
  return status === "ready" ? "已就绪" : "需要复核";
}

function getIngestionStatusLabel(status: string) {
  switch (String(status).trim().toUpperCase()) {
    case "ACTIVE":
      return "活跃中";
    case "CONNECTED":
      return "已连接";
    case "FAILED":
      return "接入失败";
    case "NOT_CONFIGURED":
      return "未接入";
    default:
      return status;
  }
}

function getSeverityLabel(severity: "high" | "medium") {
  return severity === "high" ? "高" : "中";
}
