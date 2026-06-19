import { submitJudgingRecordAction } from "@/app/actions";
import { Panel } from "@/app/_components/ary-shared";
import { getJudgingRecordState } from "@/lib/judging-helpers";
import type { RaceListItem } from "@/lib/services/races";

export function JudgeConsolePageView({
  assignments,
  race,
  raceSlug,
  section,
}: {
  assignments: Array<{
    assignedByUser: { username: string };
    assignedAt: Date;
    id: string;
    judge: { username: string };
    judgingRecord: null | {
      comments: string;
      scoreResultJson: string;
      scoreRidingJson: string;
      submittedAt: Date | null;
    };
    work: {
      awards: Array<{ awardName: string; rank: number }>;
      registration: {
        evidences: Array<{ summary: string; type: string }>;
        user: { username: string };
      };
      summary: string;
      title: string;
    };
  }>;
  race: RaceListItem;
  raceSlug: string;
  section: "assigned" | "reviewing" | "submitted";
}) {
  const filteredAssignments =
    section === "assigned"
      ? assignments
      : section === "reviewing"
        ? assignments.filter(
            (assignment) =>
              getJudgingRecordState(assignment.judgingRecord?.submittedAt ?? null) === "DRAFT",
          )
        : assignments.filter(
            (assignment) =>
              getJudgingRecordState(assignment.judgingRecord?.submittedAt ?? null) === "SUBMITTED",
          );

  return (
    <>
      <Panel title={judgeSectionTitle[section]} eyebrow="Judge View">
        <p className="muted">
          当前赛事：<a href={`/races/${raceSlug}`}>{race.title}</a>
        </p>
      </Panel>

      <section className="stack">
        {filteredAssignments.length === 0 ? (
          <Panel title="暂无分配任务" eyebrow="Judge View">
            <p className="muted">当前分区暂无评审任务。</p>
          </Panel>
        ) : (
          filteredAssignments.map((assignment) => {
            const currentResultScore = parseScoreJson(
              assignment.judgingRecord?.scoreResultJson,
            );
            const currentRidingScore = parseScoreJson(
              assignment.judgingRecord?.scoreRidingJson,
            );

            return (
              <Panel
                key={assignment.id}
                title={assignment.work.title}
                eyebrow={`Assigned by ${assignment.assignedByUser.username}`}
              >
                <div className="stack">
                  <p className="muted">{assignment.work.summary}</p>
                  <div className="detail-grid">
                    <div>
                      <dt>骑手</dt>
                      <dd>{assignment.work.registration.user.username}</dd>
                    </div>
                    <div>
                      <dt>状态</dt>
                      <dd>{getJudgingRecordState(assignment.judgingRecord?.submittedAt ?? null)}</dd>
                    </div>
                    <div>
                      <dt>证据数</dt>
                      <dd>{assignment.work.registration.evidences.length}</dd>
                    </div>
                    <div>
                      <dt>奖项数</dt>
                      <dd>{assignment.work.awards.length}</dd>
                    </div>
                  </div>

                  <div className="stack">
                    {assignment.work.registration.evidences.slice(0, 3).map((evidence, index) => (
                      <div className="public-link-card" key={`${assignment.id}-evidence-${index}`}>
                        <strong>{evidence.type}</strong>
                        <span>{evidence.summary}</span>
                      </div>
                    ))}
                  </div>

                  <form action={submitJudgingRecordAction} className="form-grid">
                    <input name="assignmentId" type="hidden" value={assignment.id} />
                    <label>
                      结果评分
                      <input
                        defaultValue={currentResultScore}
                        max={100}
                        min={0}
                        name="scoreResultTotal"
                        type="number"
                      />
                    </label>
                    <label>
                      骑行评分
                      <input
                        defaultValue={currentRidingScore}
                        max={100}
                        min={0}
                        name="scoreRidingTotal"
                        type="number"
                      />
                    </label>
                    <label className="full">
                      评语
                      <textarea
                        defaultValue={assignment.judgingRecord?.comments ?? ""}
                        name="comments"
                        required
                        rows={4}
                      />
                    </label>
                    <div className="button-row-inline">
                      <button name="submit" type="submit" value="false">
                        保存草稿
                      </button>
                      <button className="button-secondary" name="submit" type="submit" value="true">
                        提交评审
                      </button>
                    </div>
                  </form>
                </div>
              </Panel>
            );
          })
        )}
      </section>
    </>
  );
}

const judgeSectionTitle = {
  assigned: "已分配作品",
  reviewing: "评审中",
  submitted: "已提交评审",
} as const;

function parseScoreJson(raw: null | string | undefined): number {
  if (!raw) {
    return 0;
  }

  try {
    const parsed = JSON.parse(raw) as { overall?: number };
    return parsed.overall ?? 0;
  } catch {
    return 0;
  }
}
