import type { HarnessEntry, LeaderboardEntry } from "../types";

interface LeaderboardTableProps {
  rows: LeaderboardEntry[] | HarnessEntry[];
  mode: "public" | "harness";
  hidden?: boolean;
}

function isPublicRow(
  row: LeaderboardEntry | HarnessEntry,
): row is LeaderboardEntry {
  return "totalScore" in row;
}

export function LeaderboardTable({
  rows,
  mode,
  hidden = false,
}: LeaderboardTableProps) {
  if (hidden) {
    return (
      <div className="empty-panel">
        <strong>封榜中</strong>
        <p>比赛已进入封榜阶段，提交仍然开放，但公开排名暂时隐藏。</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="empty-panel">
        <strong>暂无数据</strong>
        <p>等待 Runner 同步公开投影，或等待 Organizer 生成赛后展示。</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="leaderboard">
        <thead>
          <tr>
            <th>排名</th>
            <th>队伍</th>
            {mode === "public" ? <th>Agent</th> : null}
            <th>{mode === "public" ? "总分" : "Harness 分"}</th>
            <th>{mode === "public" ? "任务/对话" : "推理/关键词"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.teamId}>
              <td>#{index + 1}</td>
              <td>{row.teamName}</td>
              {mode === "public" ? (
                <td>{isPublicRow(row) ? row.agentType : "-"}</td>
              ) : null}
              <td>
                {isPublicRow(row) ? `${row.totalScore}` : `${row.harnessScore}`}
              </td>
              <td>
                {isPublicRow(row)
                  ? `${row.taskScore} / ${row.dialogueScore}`
                  : `${row.reasoningScore} / ${row.keywordScore}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
