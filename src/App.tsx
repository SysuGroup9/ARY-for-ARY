import { useState } from "react";
import "./App.css";
import "./index.css";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { RaceCard } from "./components/RaceCard";
import { SectionTitle } from "./components/SectionTitle";
import { ShowcaseList } from "./components/ShowcaseList";
import { StatPill } from "./components/StatPill";
import { useAryStore } from "./hooks/useAryStore";
import {
  buildLeaderboard,
  clearRaceData,
  createRace,
  getCurrentUser,
  getFeedbackThreadsForViewer,
  getNotificationsForTeam,
  getRaceGroups,
  getRacePhase,
  getRacePhaseLabel,
  getTeamForCaptain,
  loginUser,
  logoutUser,
  publishLeaderboard,
  publishOrganizerComment,
  publishShowcase,
  pullRunnerTask,
  registerTeam,
  registerUser,
  replyFeedback,
  scoreRunnerTask,
  sendFeedback,
  shouldHidePublicLeaderboard,
  submitEntry,
  updateRaceContent,
  updateTeamComment,
} from "./lib/domain";
import { downloadJson } from "./lib/exporters";
import { formatDateTime } from "./lib/time";
import type {
  AgentType,
  AryState,
  Notification,
  Race,
  RaceWeights,
  Submission,
  Team,
  TeamArchive,
  UserRole,
} from "./types";

const defaultWeights: RaceWeights = {
  taskPassRate: 0.5,
  codeReview: 0.5,
  reasoning: 0.7,
  keywords: 0.3,
  totalTask: 0.5,
  totalToken: 0.3,
  totalDialogue: 0.2,
};

const AGENTS: AgentType[] = [
  "claude",
  "copilot",
  "deepseek",
  "zhipu",
  "openai",
  "custom",
];

type ActiveTab = "overview" | "organizer" | "rider" | "runner" | "audience";

function App() {
  const { state, setState, replaceWithSeed } = useAryStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(
    state.races[0]?.id ?? null,
  );
  const [notice, setNotice] = useState<string>("");

  const races = state.races;
  const selectedRace =
    races.find((race) => race.id === selectedRaceId) ?? races[0] ?? null;
  const currentUser = getCurrentUser(state);

  function commit(
    producer: () => typeof state,
    successMessage: string,
  ) {
    try {
      const next = producer();
      setState(next);
      setNotice(successMessage);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "操作失败。");
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__copy">
          <p className="hero__eyebrow">ARY GRS 001</p>
          <h1>Public Yard, Private Race Source</h1>
          <p className="hero__lede">
            一个纯前端 localStorage PoC，用来证明 Organizer 可以保留核心 Race
            数据所有权，而 ARY 仍然能完成赛事创建、披露、组织与展示。
          </p>
          <div className="hero__stats">
            <StatPill label="赛事数" value={state.races.length} />
            <StatPill label="队伍数" value={state.teams.length} />
            <StatPill label="已归档最佳提交" value={state.teamArchives.length} />
            <StatPill
              label="当前账号"
              value={currentUser ? `${currentUser.displayName}` : "未登录"}
            />
          </div>
        </div>
        <div className="hero__panel">
          <div className="panel panel--accent">
            <strong>PoC 边界</strong>
            <ul>
              <li>业务数据存在浏览器 localStorage，不依赖服务端数据库。</li>
              <li>Runner 通过页面模拟拉取任务与回传公开投影。</li>
              <li>Organizer 私有测试代码不进入 ARY。</li>
            </ul>
            <button className="button-ghost" onClick={() => replaceWithSeed()} type="button">
              重置为种子数据
            </button>
          </div>
        </div>
      </header>

      <nav className="tab-bar">
        {(
          [
            ["overview", "Overview"],
            ["organizer", "Organizer"],
            ["rider", "Rider"],
            ["runner", "Runner"],
            ["audience", "Audience"],
          ] as const
        ).map(([tab, label]) => (
          <button
            className={activeTab === tab ? "is-active" : ""}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {notice ? <div className="notice-bar">{notice}</div> : null}

      <main className="layout">
        <aside className="sidebar">
          <SectionTitle
            eyebrow="Race Browser"
            title="赛事列表"
            description="按当前时间自动计算状态，验证 ARY 的公开披露能力。"
          />
          <RaceBrowser
            selectedRaceId={selectedRace?.id ?? null}
            onSelectRace={setSelectedRaceId}
            races={races}
          />
        </aside>

        <section className="content">
          {selectedRace ? (
            <RaceOverview race={selectedRace} state={state} />
          ) : (
            <div className="panel">
              <p>当前没有赛事，请先用 Organizer 端创建一场比赛。</p>
            </div>
          )}

          {activeTab === "overview" && selectedRace ? (
            <OverviewSection race={selectedRace} state={state} />
          ) : null}

          {activeTab === "organizer" && selectedRace ? (
            <OrganizerSection
              currentUserRole={currentUser?.role ?? null}
              onLogin={(username, password) =>
                commit(() => loginUser(state, username, password), "Organizer 登录成功。")
              }
              onRegister={(username, password, displayName) =>
                commit(
                  () =>
                    registerUser(state, {
                      username,
                      password,
                      displayName,
                      role: "organizer",
                    }),
                  "Organizer 账号已创建并登录。",
                )
              }
              onLogout={() => commit(() => logoutUser(state), "已退出当前账号。")}
              race={selectedRace}
              state={state}
              onCreateRace={(input) =>
                commit(
                  () => createRace(state, currentUser?.id ?? "", input),
                  "赛事已创建。",
                )
              }
              onUpdateRace={(input) =>
                commit(
                  () =>
                    updateRaceContent(
                      state,
                      currentUser?.id ?? "",
                      selectedRace.id,
                      input,
                    ),
                  "题目与训练数据说明已更新，并已广播通知。",
                )
              }
              onPublishComment={(comment) =>
                commit(
                  () =>
                    publishOrganizerComment(
                      state,
                      currentUser?.id ?? "",
                      selectedRace.id,
                      comment,
                    ),
                  "Organizer 评论已保存。",
                )
              }
              onUpdateTeamComment={(teamId, content) =>
                commit(
                  () =>
                    updateTeamComment(
                      state,
                      currentUser?.id ?? "",
                      selectedRace.id,
                      teamId,
                      content,
                    ),
                  "队伍赛后评论已更新。",
                )
              }
              onReplyFeedback={(threadId, content, markResolved) =>
                commit(
                  () =>
                    replyFeedback(
                      state,
                      currentUser?.id ?? "",
                      threadId,
                      content,
                      markResolved,
                    ),
                  markResolved ? "反馈已回复并标记 resolved。" : "反馈已回复。",
                )
              }
              onPublishLeaderboard={() =>
                commit(
                  () => publishLeaderboard(state, currentUser?.id ?? "", selectedRace.id),
                  "公开榜单已按最新归档同步。",
                )
              }
              onPublishShowcase={() =>
                commit(
                  () => publishShowcase(state, currentUser?.id ?? "", selectedRace.id),
                  "赛后展示与 Harness 榜单已生成。",
                )
              }
              onDownloadArchives={() =>
                downloadJson(
                  `${selectedRace.title}-archives.json`,
                  state.teamArchives.filter((archive) => archive.raceId === selectedRace.id),
                )
              }
              onDownloadScores={() =>
                downloadJson(
                  `${selectedRace.title}-scores.json`,
                  buildLeaderboard(state, selectedRace.id),
                )
              }
              onClearRace={() =>
                commit(
                  () => clearRaceData(state, currentUser?.id ?? "", selectedRace.id),
                  "比赛已一键清除。",
                )
              }
            />
          ) : null}

          {activeTab === "rider" && selectedRace ? (
            <RiderSection
              currentUserRole={currentUser?.role ?? null}
              race={selectedRace}
              state={state}
              onLogin={(username, password) =>
                commit(() => loginUser(state, username, password), "Rider 登录成功。")
              }
              onRegister={(username, password, displayName) =>
                commit(
                  () =>
                    registerUser(state, {
                      username,
                      password,
                      displayName,
                      role: "rider",
                    }),
                  "Rider 账号已创建并登录。",
                )
              }
              onLogout={() => commit(() => logoutUser(state), "已退出当前账号。")}
              onRegisterTeam={(input) =>
                commit(
                  () => registerTeam(state, currentUser?.id ?? "", selectedRace.id, input),
                  "队伍报名成功。",
                )
              }
              onSubmit={(input) =>
                commit(
                  () => submitEntry(state, currentUser?.id ?? "", selectedRace.id, input),
                  "提交已进入待评测队列。",
                )
              }
              onSendFeedback={(content) =>
                commit(
                  () => sendFeedback(state, currentUser?.id ?? "", selectedRace.id, content),
                  "反馈已发送给 Organizer。",
                )
              }
            />
          ) : null}

          {activeTab === "runner" && selectedRace ? (
            <RunnerSection
              race={selectedRace}
              state={state}
              onPullTask={() => {
                try {
                  const result = pullRunnerTask(
                    state,
                    selectedRace.organizerId,
                    selectedRace.id,
                  );
                  setState(result.nextState);
                  setNotice(`Runner 已拉取任务 ${result.task.id}。`);
                } catch (error) {
                  setNotice(error instanceof Error ? error.message : "拉取失败。");
                }
              }}
              onScoreTask={(submissionId, input) =>
                commit(
                  () =>
                    scoreRunnerTask(
                      state,
                      selectedRace.organizerId,
                      selectedRace.id,
                      submissionId,
                      input,
                    ),
                  "Runner 结果已回传，临时提交物已从队列删除。",
                )
              }
            />
          ) : null}

          {activeTab === "audience" && selectedRace ? (
            <AudienceSection race={selectedRace} />
          ) : null}
        </section>
      </main>
    </div>
  );
}

function RaceBrowser({
  races,
  selectedRaceId,
  onSelectRace,
}: {
  races: Race[];
  selectedRaceId: string | null;
  onSelectRace: (raceId: string) => void;
}) {
  const groups = getRaceGroups({
    races,
  } as never);

  return (
    <div className="race-browser">
      {Object.entries(groups).map(([phase, groupedRaces]) => (
        <section className="race-group" key={phase}>
          <h3>{getRacePhaseLabel(phase as never)}</h3>
          {groupedRaces.length === 0 ? (
            <p className="muted">暂无赛事</p>
          ) : (
            groupedRaces.map((race) => (
              <RaceCard
                key={race.id}
                onSelect={onSelectRace}
                race={race}
                selected={selectedRaceId === race.id}
              />
            ))
          )}
        </section>
      ))}
    </div>
  );
}

function RaceOverview({ race, state }: { race: Race; state: AryState }) {
  const phase = getRacePhase(race);
  const leaderboard = race.publicLeaderboard;
  const teamCount = state.teams.filter((team) => team.raceId === race.id).length;
  const queued = state.submissions.filter(
    (submission) => submission.raceId === race.id && submission.status !== "scored",
  ).length;

  return (
    <section className="panel panel--overview">
      <div className="panel__header">
        <div>
          <p className="section-eyebrow">Race Detail</p>
          <h2>{race.title}</h2>
          <p className="section-description">{race.summary}</p>
        </div>
        <span className={`phase-badge phase-badge--${phase}`}>
          {getRacePhaseLabel(phase)}
        </span>
      </div>
      <div className="meta-grid">
        <StatPill label="报名人数" value={teamCount} />
        <StatPill label="待评测任务" value={queued} />
        <StatPill
          label="榜单更新"
          value={race.lastLeaderboardSyncAt ? formatDateTime(race.lastLeaderboardSyncAt) : "未同步"}
        />
        <StatPill label="关键词数" value={race.keywords.length} />
      </div>
      <div className="rule-grid">
        <article>
          <h3>公开规则</h3>
          <ul>
            <li>题目压缩包：{race.taskPackageLabel}</li>
            <li>提交频率：每 {race.submissionIntervalHours} 小时一次</li>
            <li>每组人数上限：{race.maxTeamSize}</li>
            <li>榜单颗粒度：{race.updateGranularityMinutes} 分钟</li>
          </ul>
        </article>
        <article>
          <h3>公开时间线</h3>
          <ul>
            <li>报名开始：{formatDateTime(race.signupStart)}</li>
            <li>报名结束：{formatDateTime(race.signupEnd)}</li>
            <li>比赛开始：{formatDateTime(race.raceStart)}</li>
            <li>比赛结束：{formatDateTime(race.raceEnd)}</li>
          </ul>
        </article>
        <article>
          <h3>赛后披露</h3>
          <ul>
            <li>训练数据：{race.display.showTrainingData ? "公开" : "不公开"}</li>
            <li>Organizer 评论：{race.display.showOrganizerComment ? "公开" : "不公开"}</li>
            <li>Riding Highlights：Top {race.display.highlightCount}</li>
            <li>Rider 代码：{race.display.showRiderCode ? "公开" : "不公开"}</li>
          </ul>
        </article>
      </div>
      <div className="panel">
        <h3>公开榜单</h3>
        <LeaderboardTable
          hidden={shouldHidePublicLeaderboard(race)}
          mode="public"
          rows={leaderboard}
        />
      </div>
    </section>
  );
}

function OverviewSection({
  race,
  state,
}: {
  race: Race;
  state: AryState;
}) {
  const archives = state.teamArchives.filter(
    (archive: TeamArchive) => archive.raceId === race.id,
  );
  const submissions = state.submissions.filter(
    (submission: Submission) => submission.raceId === race.id,
  );

  return (
    <section className="grid-two">
      <div className="panel">
        <SectionTitle
          eyebrow="Data Boundary"
          title="ARY 持有的公开投影"
          description="本 PoC 用 localStorage 保存赛事公开元数据、反馈、通知、榜单与最高分归档。"
        />
        <ul className="bullet-list">
          <li>题目描述：{race.taskDescription}</li>
          <li>训练数据说明：{race.trainingDataSummary}</li>
          <li>评价说明：{race.evaluationNotes}</li>
          <li>关键词配置：{race.keywords.join(" / ")}</li>
        </ul>
      </div>

      <div className="panel">
        <SectionTitle
          eyebrow="Temporary Queue"
          title="提交队列状态"
          description="模拟 Rider 提交先进入 ARY 临时队列，由 Runner 拉取后回传结果。"
        />
        {submissions.length === 0 ? (
          <p className="muted">当前没有提交。</p>
        ) : (
          <ul className="timeline-list">
            {submissions.map((submission) => (
              <li key={submission.id}>
                <strong>{submission.teamName}</strong>
                <span>{submission.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <SectionTitle
          eyebrow="Best Archives"
          title="最高分归档"
          description="用于赛后展示与下载，模拟 Organizer 最终保留的公开投影。"
        />
        {archives.length === 0 ? (
          <p className="muted">暂无归档。</p>
        ) : (
          <ul className="timeline-list">
            {archives.map((archive) => (
              <li key={archive.id}>
                <strong>{archive.teamName}</strong>
                <span>{archive.totalScore} 分</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <SectionTitle
          eyebrow="Post Race"
          title="赛后展示"
          description="比赛结束后公开完整排名、Harness 榜单、亮点与 Organizer 评论。"
        />
        <ShowcaseList
          highlights={race.publishedHighlights}
          teamComments={race.teamComments}
        />
      </div>
    </section>
  );
}

function OrganizerSection(props: {
  currentUserRole: UserRole | null;
  state: AryState;
  race: Race;
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string, displayName: string) => void;
  onLogout: () => void;
  onCreateRace: (input: Parameters<typeof createRace>[2]) => void;
  onUpdateRace: (input: { taskDescription: string; trainingDataSummary: string }) => void;
  onPublishComment: (comment: string) => void;
  onUpdateTeamComment: (teamId: string, content: string) => void;
  onReplyFeedback: (threadId: string, content: string, markResolved: boolean) => void;
  onPublishLeaderboard: () => void;
  onPublishShowcase: () => void;
  onDownloadArchives: () => void;
  onDownloadScores: () => void;
  onClearRace: () => void;
}) {
  const isOrganizer = props.currentUserRole === "organizer";
  const organizerThreads = getFeedbackThreadsForViewer(
    props.state,
    props.race.id,
    props.state.users.find((user) => user.role === "organizer") ?? null,
  );

  return (
    <section className="grid-two">
      <AuthPanel
        description="Organizer 端支持创建赛事、修改题目、回复反馈、同步榜单与赛后展示。"
        loggedIn={isOrganizer}
        onLogin={props.onLogin}
        onLogout={props.onLogout}
        onRegister={props.onRegister}
        roleLabel="Organizer"
      />
      <CreateRacePanel onCreateRace={props.onCreateRace} />
      <UpdateRacePanel onSubmit={props.onUpdateRace} race={props.race} />
      <OrganizerControlPanel
        onClearRace={props.onClearRace}
        onDownloadArchives={props.onDownloadArchives}
        onDownloadScores={props.onDownloadScores}
        onPublishComment={props.onPublishComment}
        onPublishLeaderboard={props.onPublishLeaderboard}
        onPublishShowcase={props.onPublishShowcase}
        onUpdateTeamComment={props.onUpdateTeamComment}
        race={props.race}
        state={props.state}
      />
      <div className="panel panel--span">
        <SectionTitle
          eyebrow="Feedback Center"
          title="Rider 反馈中心"
          description="Organizer 可查看所有反馈，回复并标记 resolved。"
        />
        <FeedbackPanel
          canResolve
          onResolve={props.onReplyFeedback}
          onSend={() => undefined}
          threads={organizerThreads}
        />
      </div>
    </section>
  );
}

function RiderSection(props: {
  currentUserRole: UserRole | null;
  race: Race;
  state: AryState;
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string, displayName: string) => void;
  onLogout: () => void;
  onRegisterTeam: (input: { teamName: string; membersText: string }) => void;
  onSubmit: (input: {
    code: string;
    ridingRecord: string;
    codeLabel: string;
    recordLabel: string;
    tokenUsed: number;
    agentType: AgentType;
  }) => void;
  onSendFeedback: (content: string) => void;
}) {
  const isRider = props.currentUserRole === "rider";
  const riderUser =
    props.state.users.find((user) => user.id === props.state.session.userId) ?? null;
  const team = riderUser ? getTeamForCaptain(props.state, props.race.id, riderUser.id) : null;
  const threads = getFeedbackThreadsForViewer(props.state, props.race.id, riderUser);
  const notifications = getNotificationsForTeam(
    props.state,
    props.race.id,
    team?.id ?? null,
  );

  return (
    <section className="grid-two">
      <AuthPanel
        description="Rider 端支持报名、提交代码、查看公开榜单、发送反馈与接收通知。"
        loggedIn={isRider}
        onLogin={props.onLogin}
        onLogout={props.onLogout}
        onRegister={props.onRegister}
        roleLabel="Rider"
      />
      <RiderRegistrationPanel onRegisterTeam={props.onRegisterTeam} race={props.race} team={team} />
      <SubmissionPanel onSubmit={props.onSubmit} race={props.race} team={team} />
      <div className="panel">
        <SectionTitle
          eyebrow="Notifications"
          title="Organizer 通知"
          description="题目或训练数据更新后，所有参赛队伍都能收到广播。"
        />
        {notifications.length === 0 ? (
          <p className="muted">暂无通知。</p>
        ) : (
          <ul className="timeline-list">
            {notifications.map((notification: Notification) => (
              <li key={notification.id}>
                <strong>{notification.title}</strong>
                <span>{notification.content}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="panel panel--span">
        <SectionTitle
          eyebrow="Feedback"
          title="向 Organizer 反馈问题"
          description="反馈仅对 Organizer 和当前队伍可见。"
        />
        <FeedbackComposer onSend={props.onSendFeedback} />
        <FeedbackPanel onSend={props.onSendFeedback} threads={threads} />
      </div>
    </section>
  );
}

function RunnerSection(props: {
  race: Race;
  state: AryState;
  onPullTask: () => void;
  onScoreTask: (
    submissionId: string,
    input: {
      passRate: number;
      codeReviewScore: number;
      reasoningScore: number;
      runnerComment: string;
      status: "success" | "failed";
    },
  ) => void;
}) {
  const tasks = props.state.submissions.filter(
    (submission) => submission.raceId === props.race.id,
  );

  return (
    <section className="grid-two">
      <div className="panel">
        <SectionTitle
          eyebrow="Runner Pull"
          title="模拟 GET /api/runner/tasks/pull"
          description="当前 PoC 用页面动作代替真实 API，但完整保留任务状态流转。"
        />
        <button onClick={props.onPullTask} type="button">
          拉取一个待评测任务
        </button>
      </div>

      <div className="panel panel--span">
        <SectionTitle
          eyebrow="Runner Result"
          title="模拟 POST /api/runner/tasks/result"
          description="对已拉取任务填写评分投影，ARY 只保留公开结果与最高分归档。"
        />
        {tasks.length === 0 ? (
          <p className="muted">当前没有任何提交。</p>
        ) : (
          <div className="runner-list">
            {tasks.map((task: Submission) => (
              <RunnerTaskCard key={task.id} onScoreTask={props.onScoreTask} submission={task} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AudienceSection({ race }: { race: Race }) {
  return (
    <section className="grid-two">
      <div className="panel panel--span">
        <SectionTitle
          eyebrow="Public Audience View"
          title="无需登录即可浏览公开内容"
          description="Audience 只能看到 Organizer 主动披露的信息，不接触私有提交物。"
        />
        <p>{race.summary}</p>
        <LeaderboardTable
          hidden={shouldHidePublicLeaderboard(race)}
          mode="public"
          rows={race.publicLeaderboard}
        />
      </div>
      <div className="panel panel--span">
        <LeaderboardTable mode="harness" rows={race.harnessLeaderboard} />
      </div>
      <div className="panel panel--span">
        <ShowcaseList
          highlights={race.publishedHighlights}
          teamComments={race.teamComments}
        />
      </div>
    </section>
  );
}

function AuthPanel({
  roleLabel,
  description,
  loggedIn,
  onLogin,
  onRegister,
  onLogout,
}: {
  roleLabel: string;
  description: string;
  loggedIn: boolean;
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string, displayName: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="panel">
      <SectionTitle
        eyebrow={`${roleLabel} Auth`}
        title={loggedIn ? `${roleLabel} 已登录` : `${roleLabel} 登录 / 注册`}
        description={description}
      />
      {loggedIn ? (
        <button onClick={onLogout} type="button">
          退出登录
        </button>
      ) : (
        <div className="stack">
          <AuthForm
            legend="登录已有账号"
            submitLabel="登录"
            withDisplayName={false}
            onSubmit={({ username, password }) => onLogin(username, password)}
          />
          <AuthForm
            legend="创建演示账号"
            submitLabel="注册"
            withDisplayName
            onSubmit={({ username, password, displayName }) =>
              onRegister(username, password, displayName)
            }
          />
        </div>
      )}
    </div>
  );
}

function AuthForm({
  legend,
  submitLabel,
  withDisplayName,
  onSubmit,
}: {
  legend: string;
  submitLabel: string;
  withDisplayName: boolean;
  onSubmit: (payload: {
    username: string;
    password: string;
    displayName: string;
  }) => void;
}) {
  return (
    <form
      className="form-card"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const username = readInput(form, "username");
        const password = readInput(form, "password");
        const displayName = withDisplayName ? readInput(form, "displayName") : "";
        onSubmit({ username, password, displayName });
        form.reset();
      }}
    >
      <h3>{legend}</h3>
      {withDisplayName ? <input name="displayName" placeholder="显示名" /> : null}
      <input name="username" placeholder="用户名" />
      <input name="password" placeholder="密码" type="password" />
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

function CreateRacePanel({
  onCreateRace,
}: {
  onCreateRace: (input: Parameters<typeof createRace>[2]) => void;
}) {
  return (
    <div className="panel">
      <SectionTitle
        eyebrow="Create Race"
        title="创建赛事"
        description="完整覆盖基础信息、时间线、权重、赛后展示选项与其他设置。"
      />
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          onCreateRace({
            title: readInput(form, "title"),
            summary: readInput(form, "summary"),
            taskPackageLabel: readInput(form, "taskPackageLabel"),
            taskDescription: readInput(form, "taskDescription"),
            trainingDataSummary: readInput(form, "trainingDataSummary"),
            hasTrainingData: readCheckbox(form, "hasTrainingData"),
            evaluationNotes: readInput(form, "evaluationNotes"),
            keywordsText: readInput(form, "keywordsText"),
            tokenLimit: readNumber(form, "tokenLimit"),
            signupStart: readInput(form, "signupStart"),
            signupEnd: readInput(form, "signupEnd"),
            raceStart: readInput(form, "raceStart"),
            raceEnd: readInput(form, "raceEnd"),
            enableFreeze: readCheckbox(form, "enableFreeze"),
            freezeMinutesBeforeEnd: readNumber(form, "freezeMinutesBeforeEnd"),
            updateGranularityMinutes: readNumber(form, "updateGranularityMinutes"),
            maxTeamSize: readNumber(form, "maxTeamSize"),
            submissionIntervalHours: readNumber(form, "submissionIntervalHours"),
            cloudStudioUrl: readInput(form, "cloudStudioUrl"),
            display: {
              showTrainingData: readCheckbox(form, "showTrainingData"),
              showOrganizerComment: readCheckbox(form, "showOrganizerComment"),
              showTopRidingHighlights: readCheckbox(form, "showTopRidingHighlights"),
              highlightCount: readNumber(form, "highlightCount"),
              showRiderCode: readCheckbox(form, "showRiderCode"),
            },
            weights: {
              taskPassRate: readNumber(form, "taskPassRate"),
              codeReview: readNumber(form, "codeReview"),
              reasoning: readNumber(form, "reasoning"),
              keywords: readNumber(form, "keywords"),
              totalTask: readNumber(form, "totalTask"),
              totalToken: readNumber(form, "totalToken"),
              totalDialogue: readNumber(form, "totalDialogue"),
            },
          });
          form.reset();
        }}
      >
        <input name="title" placeholder="赛事名称" />
        <input name="summary" placeholder="赛事简介" />
        <input name="taskPackageLabel" placeholder="题目压缩包标识" />
        <input name="cloudStudioUrl" placeholder="CloudStudio URL" defaultValue="https://cloudstudio.net/" />
        <textarea name="taskDescription" placeholder="题目描述" rows={4} />
        <textarea name="trainingDataSummary" placeholder="训练数据说明" rows={3} />
        <textarea name="evaluationNotes" placeholder="评价标准说明" rows={3} />
        <textarea
          name="keywordsText"
          defaultValue="需求分析, 时间复杂度, 边界条件"
          placeholder="关键词配置，逗号或换行分隔"
          rows={3}
        />
        <label>
          报名开始
          <input name="signupStart" type="datetime-local" />
        </label>
        <label>
          报名结束
          <input name="signupEnd" type="datetime-local" />
        </label>
        <label>
          比赛开始
          <input name="raceStart" type="datetime-local" />
        </label>
        <label>
          比赛结束
          <input name="raceEnd" type="datetime-local" />
        </label>
        <label>
          Token 上限
          <input defaultValue={4000} name="tokenLimit" type="number" />
        </label>
        <label>
          榜单颗粒度（分钟）
          <input defaultValue={30} name="updateGranularityMinutes" type="number" />
        </label>
        <label>
          每组人数上限
          <input defaultValue={5} name="maxTeamSize" type="number" />
        </label>
        <label>
          提交频率限制（小时）
          <input defaultValue={24} name="submissionIntervalHours" type="number" />
        </label>
        <label>
          封榜提前量（分钟）
          <input defaultValue={30} name="freezeMinutesBeforeEnd" type="number" />
        </label>
        <div className="check-grid">
          <label><input defaultChecked name="hasTrainingData" type="checkbox" />有训练数据</label>
          <label><input defaultChecked name="enableFreeze" type="checkbox" />启用封榜</label>
          <label><input defaultChecked name="showTrainingData" type="checkbox" />赛后公开训练数据</label>
          <label><input defaultChecked name="showOrganizerComment" type="checkbox" />赛后公开 Organizer 评论</label>
          <label><input defaultChecked name="showTopRidingHighlights" type="checkbox" />公开 Riding Highlights</label>
          <label><input defaultChecked name="showRiderCode" type="checkbox" />公开 Rider 代码</label>
        </div>
        <label>
          Highlight Top N
          <input defaultValue={3} name="highlightCount" type="number" />
        </label>
        <div className="weights-grid">
          <label><span>任务通过率权重</span><input defaultValue={defaultWeights.taskPassRate} name="taskPassRate" step="0.1" type="number" /></label>
          <label><span>代码评审权重</span><input defaultValue={defaultWeights.codeReview} name="codeReview" step="0.1" type="number" /></label>
          <label><span>推理评分权重</span><input defaultValue={defaultWeights.reasoning} name="reasoning" step="0.1" type="number" /></label>
          <label><span>关键词权重</span><input defaultValue={defaultWeights.keywords} name="keywords" step="0.1" type="number" /></label>
          <label><span>总分任务权重</span><input defaultValue={defaultWeights.totalTask} name="totalTask" step="0.1" type="number" /></label>
          <label><span>总分 Token 权重</span><input defaultValue={defaultWeights.totalToken} name="totalToken" step="0.1" type="number" /></label>
          <label><span>总分对话权重</span><input defaultValue={defaultWeights.totalDialogue} name="totalDialogue" step="0.1" type="number" /></label>
        </div>
        <button type="submit">创建赛事</button>
      </form>
    </div>
  );
}

function UpdateRacePanel({
  race,
  onSubmit,
}: {
  race: Race;
  onSubmit: (input: { taskDescription: string; trainingDataSummary: string }) => void;
}) {
  return (
    <div className="panel">
      <SectionTitle
        eyebrow="Race Updates"
        title="比赛期间修改题目 / 训练数据"
        description="不会修改测试代码与关键词配置，提交后自动广播通知。"
      />
      <form
        className="form-card"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          onSubmit({
            taskDescription: readInput(form, "taskDescription"),
            trainingDataSummary: readInput(form, "trainingDataSummary"),
          });
        }}
      >
        <textarea defaultValue={race.taskDescription} name="taskDescription" rows={4} />
        <textarea
          defaultValue={race.trainingDataSummary}
          name="trainingDataSummary"
          rows={3}
        />
        <button type="submit">保存并通知 Rider</button>
      </form>
    </div>
  );
}

function OrganizerControlPanel({
  state,
  race,
  onPublishLeaderboard,
  onPublishShowcase,
  onDownloadArchives,
  onDownloadScores,
  onPublishComment,
  onUpdateTeamComment,
  onClearRace,
}: {
  state: AryState;
  race: Race;
  onPublishLeaderboard: () => void;
  onPublishShowcase: () => void;
  onDownloadArchives: () => void;
  onDownloadScores: () => void;
  onPublishComment: (comment: string) => void;
  onUpdateTeamComment: (teamId: string, content: string) => void;
  onClearRace: () => void;
}) {
  const teams = state.teams.filter((team: Team) => team.raceId === race.id);

  return (
    <div className="panel">
      <SectionTitle
        eyebrow="Organizer Controls"
        title="同步榜单 / 赛后展示 / 导出"
        description="用按钮模拟 Runner 回传公开榜单投影与赛后公开内容。"
      />
      <div className="button-row">
        <button onClick={onPublishLeaderboard} type="button">同步公开榜单</button>
        <button onClick={onPublishShowcase} type="button">生成赛后展示</button>
        <button className="button-ghost" onClick={onDownloadArchives} type="button">
          下载最高分提交归档
        </button>
        <button className="button-ghost" onClick={onDownloadScores} type="button">
          下载评分结果 JSON
        </button>
      </div>
      <form
        className="form-card"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          onPublishComment(readInput(form, "comment"));
        }}
      >
        <h3>Organizer 赛后总评</h3>
        <textarea defaultValue={race.organizerComment} name="comment" rows={4} />
        <button type="submit">保存总评</button>
      </form>
      {teams.map((team) => (
        <form
          className="form-card"
          key={team.id}
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            onUpdateTeamComment(team.id, readInput(form, "content"));
          }}
        >
          <h3>{team.name} 的赛后评论</h3>
          <textarea
            defaultValue={race.teamComments.find((item) => item.teamId === team.id)?.content ?? ""}
            name="content"
            rows={3}
          />
          <button type="submit">保存队伍评论</button>
        </form>
      ))}
      <button className="button-danger" onClick={onClearRace} type="button">
        一键清除比赛
      </button>
    </div>
  );
}

function RiderRegistrationPanel({
  race,
  team,
  onRegisterTeam,
}: {
  race: Race;
  team: Team | null;
  onRegisterTeam: (input: { teamName: string; membersText: string }) => void;
}) {
  return (
    <div className="panel">
      <SectionTitle
        eyebrow="Team Signup"
        title={team ? "当前队伍信息" : "报名参赛"}
        description={`报名阶段可创建队伍，单队最多 ${race.maxTeamSize} 人。`}
      />
      {team ? (
        <div className="detail-block">
          <strong>{team.name}</strong>
          <p>{team.members.join(" / ")}</p>
        </div>
      ) : (
        <form
          className="form-card"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            onRegisterTeam({
              teamName: readInput(form, "teamName"),
              membersText: readInput(form, "membersText"),
            });
            form.reset();
          }}
        >
          <input name="teamName" placeholder="队伍名称" />
          <textarea name="membersText" placeholder="组员，逗号或换行分隔" rows={4} />
          <button type="submit">提交报名</button>
        </form>
      )}
    </div>
  );
}

function SubmissionPanel({
  race,
  team,
  onSubmit,
}: {
  race: Race;
  team: Team | null;
  onSubmit: (input: {
    code: string;
    ridingRecord: string;
    codeLabel: string;
    recordLabel: string;
    tokenUsed: number;
    agentType: AgentType;
  }) => void;
}) {
  return (
    <div className="panel">
      <SectionTitle
        eyebrow="Submission"
        title="提交代码与 Riding Record"
        description={`比赛阶段可提交，频率限制为每 ${race.submissionIntervalHours} 小时一次。`}
      />
      {!team ? (
        <p className="muted">请先报名参赛后再提交。</p>
      ) : (
        <form
          className="form-card"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            onSubmit({
              code: readInput(form, "code"),
              ridingRecord: readInput(form, "ridingRecord"),
              codeLabel: readInput(form, "codeLabel"),
              recordLabel: readInput(form, "recordLabel"),
              tokenUsed: readNumber(form, "tokenUsed"),
              agentType: readInput(form, "agentType") as AgentType,
            });
          }}
        >
          <input defaultValue="solution.ts" name="codeLabel" placeholder="代码文件名" />
          <input defaultValue="riding-record.txt" name="recordLabel" placeholder="记录文件名" />
          <label>
            Agent 类型
            <select defaultValue="openai" name="agentType">
              {AGENTS.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </label>
          <label>
            Token 消耗
            <input defaultValue={1200} name="tokenUsed" type="number" />
          </label>
          <textarea
            defaultValue={"export function solve(input: number[]) {\n  return [...input].sort((a, b) => a - b)\n}"}
            name="code"
            rows={8}
          />
          <textarea
            defaultValue={"先解析需求，再确定边界条件，最后用小样例和逆序样例验证。"}
            name="ridingRecord"
            rows={6}
          />
          <button type="submit">提交到待评测队列</button>
        </form>
      )}
    </div>
  );
}

function FeedbackComposer({ onSend }: { onSend: (content: string) => void }) {
  return (
    <form
      className="form-card"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        onSend(readInput(form, "content"));
        form.reset();
      }}
    >
      <textarea
        defaultValue="题目描述第 2 段对输入规模的说明仍有歧义，请补充边界条件。"
        name="content"
        rows={3}
      />
      <button type="submit">发送反馈</button>
    </form>
  );
}

function RunnerTaskCard({
  submission,
  onScoreTask,
}: {
  submission: Submission;
  onScoreTask: (
    submissionId: string,
    input: {
      passRate: number;
      codeReviewScore: number;
      reasoningScore: number;
      runnerComment: string;
      status: "success" | "failed";
    },
  ) => void;
}) {
  return (
    <form
      className="form-card"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        onScoreTask(submission.id, {
          passRate: readNumber(form, "passRate"),
          codeReviewScore: readNumber(form, "codeReviewScore"),
          reasoningScore: readNumber(form, "reasoningScore"),
          runnerComment: readInput(form, "runnerComment"),
          status: readInput(form, "status") as "success" | "failed",
        });
      }}
    >
      <h3>
        {submission.teamName} · {submission.status}
      </h3>
      <p>任务 ID: {submission.taskId}</p>
      <label>
        状态
        <select defaultValue="success" name="status">
          <option value="success">success</option>
          <option value="failed">failed</option>
        </select>
      </label>
      <label>
        测试通过率
        <input defaultValue={86} name="passRate" type="number" />
      </label>
      <label>
        代码评审分
        <input defaultValue={82} name="codeReviewScore" type="number" />
      </label>
      <label>
        推理评分
        <input defaultValue={90} name="reasoningScore" type="number" />
      </label>
      <textarea
        defaultValue="实现较稳健，建议优化极端输入下的解释性。"
        name="runnerComment"
        rows={3}
      />
      <button disabled={submission.status !== "pulled"} type="submit">
        回传结果
      </button>
    </form>
  );
}

function readInput(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name);
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) {
    return "";
  }
  return field.value.trim();
}

function readNumber(form: HTMLFormElement, name: string): number {
  return Number(readInput(form, name));
}

function readCheckbox(form: HTMLFormElement, name: string): boolean {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement ? field.checked : false;
}

export default App;
