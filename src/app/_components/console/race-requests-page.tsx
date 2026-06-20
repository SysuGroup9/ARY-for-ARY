import {
  approveCooperationRequestAction,
  rejectCooperationRequestAction,
} from "@/app/actions";
import { Panel } from "@/app/_components/ary-shared";

type CooperationRequestRow = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  raceTitle: string;
  raceSummary: string;
  taskDescription: string;
  trainingDataSummary: string;
  evaluationNotes: string;
  keywordsText: string;
  signupStart: string;
  signupEnd: string;
  raceStart: string;
  raceEnd: string;
  tokenLimit: number;
  maxTeamSize: number;
  submissionIntervalHours: number;
  freezeMinutesBeforeEnd: number;
  hasTrainingData: boolean;
  enableFreeze: boolean;
  displayShowTrainingData: boolean;
  displayShowOrganizerComment: boolean;
  displayShowTopHighlights: boolean;
  displayShowRiderCode: boolean;
  notes: string;
  status: string;
  createdAt: Date;
};

const statusLabelMap: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已批准",
  REJECTED: "已拒绝",
};

const statusColorMap: Record<string, string> = {
  PENDING: "var(--accent)",
  APPROVED: "var(--success, #16a34a)",
  REJECTED: "var(--destructive, #dc2626)",
};

export function RaceRequestsPageView({
  requests,
}: {
  requests: CooperationRequestRow[];
}) {
  const pending = requests.filter((r) => r.status === "PENDING");
  const processed = requests.filter((r) => r.status !== "PENDING");

  return (
    <>
      <Panel title="办赛申请审核" eyebrow="管理控制台">
        <p className="muted">
          企业提交的办赛申请列表。审核通过后将自动创建赛事，审批者为赛事主办方。
        </p>
      </Panel>

      {requests.length === 0 && (
        <Panel title="暂无申请">
          <p className="muted">当前没有办赛申请记录。</p>
        </Panel>
      )}

      {pending.length > 0 && (
        <Panel
          title={`待审核申请（${pending.length}）`}
          eyebrow="等待处理"
          style={{ borderColor: "var(--accent)" }}
        >
          <div className="stack">
            {pending.map((req) => (
              <RequestCard key={req.id} request={req} showActions />
            ))}
          </div>
        </Panel>
      )}

      {processed.length > 0 && (
        <Panel
          title={`已处理申请（${processed.length}）`}
          eyebrow="历史记录"
        >
          <div className="stack">
            {processed.map((req) => (
              <RequestCard key={req.id} request={req} showActions={false} />
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

function RequestCard({
  request,
  showActions,
}: {
  request: CooperationRequestRow;
  showActions: boolean;
}) {
  return (
    <div className="public-link-card" style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong style={{ fontSize: "1.0625rem" }}>{request.raceTitle}</strong>
          <div style={{ marginTop: 4, fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            {request.companyName} · 联系人：{request.contactName}（{request.contactEmail}
            {request.contactPhone ? ` · ${request.contactPhone}` : ""}）
          </div>
        </div>
        <span
          style={{
            background: statusColorMap[request.status] ?? "var(--muted)",
            color: "#fff",
            padding: "2px 10px",
            borderRadius: "999px",
            fontSize: "0.8125rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabelMap[request.status] ?? request.status}
        </span>
      </div>

      <div style={{ marginTop: 10 }}>
        <p style={{ margin: "0 0 4px", color: "var(--muted-foreground)" }}>
          {request.raceSummary}
        </p>
      </div>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
          fontSize: "0.8125rem",
          color: "var(--muted-foreground)",
        }}
      >
        <span>🕐 报名：{formatDate(request.signupStart)} → {formatDate(request.signupEnd)}</span>
        <span>🏁 比赛：{formatDate(request.raceStart)} → {formatDate(request.raceEnd)}</span>
        <span>👥 每组上限：{request.maxTeamSize}人</span>
        <span>🔤 Token：{request.tokenLimit}</span>
      </div>

      {request.keywordsText && (
        <div style={{ marginTop: 6, fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
          标签：{request.keywordsText}
        </div>
      )}

      <details style={{ marginTop: 10 }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--muted-foreground)",
          }}
        >
          查看详情
        </summary>
        <div style={{ marginTop: 8, paddingLeft: 4 }}>
          <DetailRow label="题目描述" value={request.taskDescription} />
          <DetailRow label="训练数据说明" value={request.trainingDataSummary || "（无）"} />
          <DetailRow label="评测说明" value={request.evaluationNotes} />
          <DetailRow
            label="赛事设置"
            value={[
              request.hasTrainingData && "有训练数据",
              request.enableFreeze &&
                `封榜（提前${request.freezeMinutesBeforeEnd}分钟）`,
              request.displayShowTrainingData && "赛后公开训练数据",
              request.displayShowOrganizerComment && "赛后公开评语",
              request.displayShowTopHighlights && "显示 Top Highlights",
              request.displayShowRiderCode && "公开骑手代码",
            ]
              .filter(Boolean)
              .join(" · ")}
          />
          <DetailRow label="提交间隔" value={`${request.submissionIntervalHours} 小时`} />
          {request.notes && <DetailRow label="补充说明" value={request.notes} />}
        </div>
      </details>

      {showActions && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 10,
          }}
        >
          <form action={approveCooperationRequestAction}>
            <input name="requestId" type="hidden" value={request.id} />
            <button
              type="submit"
              style={{
                background: "var(--success, #16a34a)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "6px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              批准并创建赛事
            </button>
          </form>
          <form action={rejectCooperationRequestAction}>
            <input name="requestId" type="hidden" value={request.id} />
            <button
              type="submit"
              style={{
                background: "var(--destructive, #dc2626)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "6px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              拒绝
            </button>
          </form>
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          fontSize: "0.75rem",
          color: "var(--muted-foreground)",
        }}
      >
        提交时间：{formatDateTime(request.createdAt)}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{label}：</span>
      <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
        {value}
      </span>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return iso;
  }
}

function formatDateTime(d: Date) {
  try {
    const date = new Date(d);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return String(d);
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
