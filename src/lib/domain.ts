import type {
  AgentType,
  AryState,
  FeedbackThread,
  LeaderboardEntry,
  Race,
  RacePhase,
  RaceWeights,
  RidingHighlight,
  Submission,
  SubmissionArtifact,
  SubmissionResult,
  Team,
  TeamArchive,
  User,
} from "../types";

export interface RegisterUserInput {
  username: string;
  password: string;
  displayName: string;
  role: "organizer" | "rider";
}

export interface CreateRaceInput {
  title: string;
  summary: string;
  taskPackageLabel: string;
  taskDescription: string;
  trainingDataSummary: string;
  hasTrainingData: boolean;
  evaluationNotes: string;
  keywordsText: string;
  tokenLimit: number;
  signupStart: string;
  signupEnd: string;
  raceStart: string;
  raceEnd: string;
  enableFreeze: boolean;
  freezeMinutesBeforeEnd: number;
  updateGranularityMinutes: number;
  maxTeamSize: number;
  submissionIntervalHours: number;
  cloudStudioUrl: string;
  display: Race["display"];
  weights: RaceWeights;
}

export interface TeamRegistrationInput {
  teamName: string;
  membersText: string;
}

export interface SubmissionInput {
  code: string;
  ridingRecord: string;
  codeLabel: string;
  recordLabel: string;
  tokenUsed: number;
  agentType: AgentType;
}

export interface RunnerScoreInput {
  passRate: number;
  codeReviewScore: number;
  reasoningScore: number;
  runnerComment: string;
  status: "success" | "failed";
}

export interface RaceUpdateInput {
  taskDescription: string;
  trainingDataSummary: string;
}

const INDUCEMENT_TERMS = [
  "满分",
  "给高分",
  "拜托了",
  "请给满分",
  "give me full score",
];

const TEMP_TTL_MS = 24 * 60 * 60 * 1000;

export function getRacePhase(
  race: Race,
  now: Date = new Date(),
): RacePhase {
  const signupStart = new Date(race.signupStart);
  const signupEnd = new Date(race.signupEnd);
  const raceStart = new Date(race.raceStart);
  const raceEnd = new Date(race.raceEnd);

  if (now >= raceEnd) {
    return "finished";
  }
  if (now >= raceStart) {
    if (!race.enableFreeze) {
      return "active";
    }
    const freezeTime = new Date(
      raceEnd.getTime() - race.freezeMinutesBeforeEnd * 60 * 1000,
    );
    return now >= freezeTime ? "frozen" : "active";
  }
  if (now > signupEnd || now < signupStart) {
    return "preparation";
  }
  return "registration";
}

export function getRacePhaseLabel(phase: RacePhase): string {
  switch (phase) {
    case "registration":
      return "报名中";
    case "preparation":
      return "报名结束";
    case "active":
      return "比赛中";
    case "frozen":
      return "封榜中";
    case "finished":
      return "比赛结束";
  }
}

export function shouldHidePublicLeaderboard(race: Race): boolean {
  return getRacePhase(race) === "frozen";
}

export function getCurrentUser(state: AryState): User | null {
  return state.users.find((user) => user.id === state.session.userId) ?? null;
}

export function cleanupState(state: AryState): AryState {
  const next = structuredClone(state) as AryState;
  const now = Date.now();

  next.submissions = next.submissions.map((submission) => {
    if (!submission.artifact || !submission.scoredAt) {
      return submission;
    }
    const age = now - new Date(submission.scoredAt).getTime();
    if (age <= TEMP_TTL_MS) {
      return submission;
    }
    return {
      ...submission,
      artifact: null,
    };
  });

  next.lastCleanupAt = new Date().toISOString();
  return next;
}

export function registerUser(
  state: AryState,
  input: RegisterUserInput,
): AryState {
  const next = structuredClone(state) as AryState;
  validateCredential(input.username, input.password, input.displayName);

  if (next.users.some((user) => user.username === input.username.trim())) {
    throw new Error("用户名已存在，请换一个。");
  }

  const id = makeId("user");
  next.users.push({
    id,
    username: input.username.trim(),
    password: input.password.trim(),
    displayName: input.displayName.trim(),
    role: input.role,
    createdAt: nowIso(),
  });
  next.session.userId = id;
  return next;
}

export function loginUser(
  state: AryState,
  username: string,
  password: string,
): AryState {
  const next = structuredClone(state) as AryState;
  const user = next.users.find(
    (candidate) =>
      candidate.username === username.trim() &&
      candidate.password === password.trim(),
  );

  if (!user) {
    throw new Error("用户名或密码不正确。");
  }

  next.session.userId = user.id;
  return next;
}

export function logoutUser(state: AryState): AryState {
  const next = structuredClone(state) as AryState;
  next.session.userId = null;
  return next;
}

export function createRace(
  state: AryState,
  organizerId: string,
  input: CreateRaceInput,
): AryState {
  const next = structuredClone(state) as AryState;
  requireOrganizer(next, organizerId);
  validateRaceInput(input);

  next.races.unshift({
    id: makeId("race"),
    organizerId,
    title: input.title.trim(),
    summary: input.summary.trim(),
    taskPackageLabel: input.taskPackageLabel.trim(),
    taskDescription: input.taskDescription.trim(),
    trainingDataSummary: input.trainingDataSummary.trim(),
    hasTrainingData: input.hasTrainingData,
    evaluationNotes: input.evaluationNotes.trim(),
    keywords: parseKeywords(input.keywordsText),
    tokenLimit: input.tokenLimit,
    signupStart: toIso(input.signupStart),
    signupEnd: toIso(input.signupEnd),
    raceStart: toIso(input.raceStart),
    raceEnd: toIso(input.raceEnd),
    enableFreeze: input.enableFreeze,
    freezeMinutesBeforeEnd: input.enableFreeze
      ? input.freezeMinutesBeforeEnd
      : 0,
    updateGranularityMinutes: input.updateGranularityMinutes,
    maxTeamSize: input.maxTeamSize,
    submissionIntervalHours: input.submissionIntervalHours,
    cloudStudioUrl: input.cloudStudioUrl.trim(),
    display: input.display,
    weights: normalizeWeights(input.weights),
    organizerComment: "",
    teamComments: [],
    publicLeaderboard: [],
    harnessLeaderboard: [],
    publishedHighlights: [],
    lastLeaderboardSyncAt: null,
    lastShowcaseSyncAt: null,
    lastUpdatedAt: nowIso(),
  });

  return next;
}

export function updateRaceContent(
  state: AryState,
  organizerId: string,
  raceId: string,
  input: RaceUpdateInput,
): AryState {
  const next = structuredClone(state) as AryState;
  const race = requireOwnedRace(next, organizerId, raceId);
  const phase = getRacePhase(race);

  if (phase === "finished") {
    throw new Error("比赛结束后不能再修改题目与训练数据。");
  }

  race.taskDescription = input.taskDescription.trim();
  race.trainingDataSummary = input.trainingDataSummary.trim();
  race.lastUpdatedAt = nowIso();

  pushNotification(
    next,
    race.id,
    "题目已更新",
    `Organizer 更新了 ${race.title} 的题目描述或训练数据说明。`,
  );

  return next;
}

export function publishOrganizerComment(
  state: AryState,
  organizerId: string,
  raceId: string,
  comment: string,
): AryState {
  const next = structuredClone(state) as AryState;
  const race = requireOwnedRace(next, organizerId, raceId);
  race.organizerComment = comment.trim();
  race.lastUpdatedAt = nowIso();
  return next;
}

export function updateTeamComment(
  state: AryState,
  organizerId: string,
  raceId: string,
  teamId: string,
  content: string,
): AryState {
  const next = structuredClone(state) as AryState;
  const race = requireOwnedRace(next, organizerId, raceId);
  const existing = race.teamComments.find((item) => item.teamId === teamId);

  if (existing) {
    existing.content = content.trim();
  } else {
    race.teamComments.push({
      teamId,
      content: content.trim(),
    });
  }

  race.lastUpdatedAt = nowIso();
  return next;
}

export function registerTeam(
  state: AryState,
  riderId: string,
  raceId: string,
  input: TeamRegistrationInput,
): AryState {
  const next = structuredClone(state) as AryState;
  requireRider(next, riderId);
  const race = requireRace(next, raceId);

  if (getRacePhase(race) !== "registration") {
    throw new Error("当前不在报名阶段。");
  }

  if (findTeamForCaptain(next, raceId, riderId)) {
    throw new Error("你已经报名过这场比赛。");
  }

  const members = parseMembers(input.membersText);
  if (members.length === 0) {
    throw new Error("请至少填写 1 名组员。");
  }
  if (members.length > race.maxTeamSize) {
    throw new Error(`本场比赛每组最多 ${race.maxTeamSize} 人。`);
  }

  next.teams.push({
    id: makeId("team"),
    raceId,
    captainId: riderId,
    name: input.teamName.trim(),
    members,
    createdAt: nowIso(),
  });
  return next;
}

export function submitEntry(
  state: AryState,
  riderId: string,
  raceId: string,
  input: SubmissionInput,
): AryState {
  const next = structuredClone(state) as AryState;
  requireRider(next, riderId);
  const race = requireRace(next, raceId);
  const team = requireTeamForCaptain(next, raceId, riderId);
  ensureSubmissionAllowed(next, race, team);
  validateSubmissionInput(input);

  next.submissions.unshift({
    id: makeId("submission"),
    taskId: makeId("task"),
    raceId,
    teamId: team.id,
    teamName: team.name,
    status: "queued",
    artifact: {
      code: input.code.trim(),
      ridingRecord: input.ridingRecord.trim(),
      codeLabel: input.codeLabel.trim(),
      recordLabel: input.recordLabel.trim(),
      tokenUsed: input.tokenUsed,
      agentType: input.agentType,
    },
    createdAt: nowIso(),
    pulledAt: null,
    scoredAt: null,
    result: null,
  });

  return next;
}

export function pullRunnerTask(
  state: AryState,
  organizerId: string,
  raceId: string,
): { nextState: AryState; task: Submission } {
  const next = structuredClone(state) as AryState;
  requireOwnedRace(next, organizerId, raceId);

  const task = next.submissions.find(
    (submission) =>
      submission.raceId === raceId && submission.status === "queued",
  );

  if (!task) {
    throw new Error("当前没有待拉取任务。");
  }

  task.status = "pulled";
  task.pulledAt = nowIso();
  return {
    nextState: next,
    task,
  };
}

export function scoreRunnerTask(
  state: AryState,
  organizerId: string,
  raceId: string,
  submissionId: string,
  input: RunnerScoreInput,
): AryState {
  const next = structuredClone(state) as AryState;
  const race = requireOwnedRace(next, organizerId, raceId);
  const submission = next.submissions.find(
    (candidate) => candidate.id === submissionId && candidate.raceId === raceId,
  );

  if (!submission || !submission.artifact) {
    throw new Error("未找到可评分的提交。");
  }
  if (submission.status !== "pulled") {
    throw new Error("Runner 只能对已拉取任务回传结果。");
  }

  const result = buildResult(race, submission.artifact, input);
  submission.status = "scored";
  submission.result = result;
  submission.scoredAt = nowIso();

  updateTeamArchive(next, race, submission, result);
  submission.artifact = null;
  return next;
}

export function publishLeaderboard(
  state: AryState,
  organizerId: string,
  raceId: string,
): AryState {
  const next = structuredClone(state) as AryState;
  const race = requireOwnedRace(next, organizerId, raceId);
  race.publicLeaderboard = buildLeaderboard(next, raceId);
  race.lastLeaderboardSyncAt = nowIso();
  race.lastUpdatedAt = nowIso();
  return next;
}

export function publishShowcase(
  state: AryState,
  organizerId: string,
  raceId: string,
): AryState {
  const next = structuredClone(state) as AryState;
  const race = requireOwnedRace(next, organizerId, raceId);

  if (getRacePhase(race) !== "finished") {
    throw new Error("只有比赛结束后才能生成赛后展示。");
  }

  race.harnessLeaderboard = buildHarnessLeaderboard(next, raceId);
  race.publishedHighlights = buildHighlights(next, race);
  race.lastShowcaseSyncAt = nowIso();
  race.lastUpdatedAt = nowIso();
  return next;
}

export function sendFeedback(
  state: AryState,
  riderId: string,
  raceId: string,
  content: string,
): AryState {
  const next = structuredClone(state) as AryState;
  requireRider(next, riderId);
  const team = requireTeamForCaptain(next, raceId, riderId);
  const thread = findOrCreateThread(next, raceId, team.id);

  thread.messages.push({
    id: makeId("message"),
    authorId: riderId,
    authorRole: "rider",
    content: content.trim(),
    createdAt: nowIso(),
  });
  thread.status = "pending";
  thread.updatedAt = nowIso();
  return next;
}

export function replyFeedback(
  state: AryState,
  organizerId: string,
  threadId: string,
  content: string,
  markResolved: boolean,
): AryState {
  const next = structuredClone(state) as AryState;
  requireOrganizer(next, organizerId);
  const thread = next.feedbackThreads.find((candidate) => candidate.id === threadId);

  if (!thread) {
    throw new Error("未找到反馈线程。");
  }

  const race = requireRace(next, thread.raceId);
  if (race.organizerId !== organizerId) {
    throw new Error("你无权回复这条反馈。");
  }

  thread.messages.push({
    id: makeId("message"),
    authorId: organizerId,
    authorRole: "organizer",
    content: content.trim(),
    createdAt: nowIso(),
  });
  thread.status = markResolved ? "resolved" : "pending";
  thread.updatedAt = nowIso();
  return next;
}

export function clearRaceData(
  state: AryState,
  organizerId: string,
  raceId: string,
): AryState {
  const next = structuredClone(state) as AryState;
  requireOwnedRace(next, organizerId, raceId);

  next.races = next.races.filter((race) => race.id !== raceId);
  next.teams = next.teams.filter((team) => team.raceId !== raceId);
  next.submissions = next.submissions.filter(
    (submission) => submission.raceId !== raceId,
  );
  next.teamArchives = next.teamArchives.filter(
    (archive) => archive.raceId !== raceId,
  );
  next.feedbackThreads = next.feedbackThreads.filter(
    (thread) => thread.raceId !== raceId,
  );
  next.notifications = next.notifications.filter(
    (notification) => notification.raceId !== raceId,
  );

  return next;
}

export function getRaceGroups(state: AryState): Record<RacePhase, Race[]> {
  const base: Record<RacePhase, Race[]> = {
    registration: [],
    preparation: [],
    active: [],
    frozen: [],
    finished: [],
  };

  state.races.forEach((race) => {
    base[getRacePhase(race)].push(race);
  });

  return base;
}

export function getTeamForCaptain(
  state: AryState,
  raceId: string,
  riderId: string,
): Team | null {
  return findTeamForCaptain(state, raceId, riderId);
}

export function getNotificationsForTeam(
  state: AryState,
  raceId: string,
  teamId: string | null,
): AryState["notifications"] {
  return state.notifications.filter((notification) => {
    if (notification.raceId !== raceId) {
      return false;
    }
    if (notification.target === "all") {
      return true;
    }
    return notification.teamId === teamId;
  });
}

export function getFeedbackThreadsForViewer(
  state: AryState,
  raceId: string,
  viewer: User | null,
): FeedbackThread[] {
  if (!viewer) {
    return [];
  }

  if (viewer.role === "organizer") {
    return state.feedbackThreads.filter((thread) => thread.raceId === raceId);
  }

  const team = getTeamForCaptain(state, raceId, viewer.id);
  if (!team) {
    return [];
  }

  return state.feedbackThreads.filter((thread) => thread.teamId === team.id);
}

export function buildLeaderboard(
  state: AryState,
  raceId: string,
): LeaderboardEntry[] {
  return state.teamArchives
    .filter((archive) => archive.raceId === raceId)
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }
      return left.createdAt.localeCompare(right.createdAt);
    })
    .map((archive) => ({
      teamId: archive.teamId,
      teamName: archive.teamName,
      submissionId: archive.submissionId,
      totalScore: roundScore(archive.totalScore),
      taskScore: roundScore(archive.taskScore),
      tokenScore: roundScore(archive.tokenScore),
      dialogueScore: roundScore(archive.dialogueScore),
      agentType: archive.agentType,
      updatedAt: archive.createdAt,
    }));
}

export function buildHarnessLeaderboard(
  state: AryState,
  raceId: string,
) {
  return state.teamArchives
    .filter((archive) => archive.raceId === raceId)
    .map((archive) => ({
      teamId: archive.teamId,
      teamName: archive.teamName,
      harnessScore: roundScore(
        archive.reasoningScore * 0.6 + archive.keywordScore * 0.4,
      ),
      reasoningScore: roundScore(archive.reasoningScore),
      keywordScore: roundScore(archive.keywordScore),
      updatedAt: archive.createdAt,
    }))
    .sort((left, right) => right.harnessScore - left.harnessScore);
}

function buildHighlights(state: AryState, race: Race): RidingHighlight[] {
  if (!race.display.showTopRidingHighlights) {
    return [];
  }

  return state.teamArchives
    .filter((archive) => archive.raceId === race.id)
    .sort((left, right) => right.totalScore - left.totalScore)
    .slice(0, race.display.highlightCount)
    .map((archive) => ({
      teamId: archive.teamId,
      teamName: archive.teamName,
      score: roundScore(archive.totalScore),
      agentType: archive.agentType,
      excerpt: extractHighlight(archive.ridingRecord),
      codeSnippet: race.display.showRiderCode
        ? extractCodeSnippet(archive.code)
        : "Organizer 未公开代码。",
    }));
}

function updateTeamArchive(
  state: AryState,
  race: Race,
  submission: Submission,
  result: SubmissionResult,
): void {
  const artifact = submission.artifact;
  if (!artifact) {
    return;
  }

  const current = state.teamArchives.find(
    (archive) => archive.raceId === race.id && archive.teamId === submission.teamId,
  );

  if (current && current.totalScore >= result.totalScore) {
    return;
  }

  const nextArchive: TeamArchive = {
    id: current?.id ?? makeId("archive"),
    raceId: race.id,
    teamId: submission.teamId,
    teamName: submission.teamName,
    submissionId: submission.id,
    code: artifact.code,
    ridingRecord: artifact.ridingRecord,
    codeLabel: artifact.codeLabel,
    recordLabel: artifact.recordLabel,
    tokenUsed: artifact.tokenUsed,
    agentType: artifact.agentType,
    totalScore: result.totalScore,
    taskScore: result.taskScore,
    dialogueScore: result.dialogueScore,
    tokenScore: result.tokenScore,
    reasoningScore: result.reasoningScore,
    keywordScore: result.keywordScore,
    antiCheatPenalty: result.antiCheatPenalty,
    createdAt: nowIso(),
  };

  if (current) {
    Object.assign(current, nextArchive);
    return;
  }

  state.teamArchives.push(nextArchive);
}

function buildResult(
  race: Race,
  artifact: SubmissionArtifact,
  input: RunnerScoreInput,
): SubmissionResult {
  const keywordScore = getKeywordScore(artifact.ridingRecord, race.keywords);
  const tokenScore = getTokenScore(artifact.tokenUsed, race.tokenLimit);
  const taskScore =
    input.passRate * race.weights.taskPassRate +
    input.codeReviewScore * race.weights.codeReview;
  const dialogueScore =
    input.reasoningScore * race.weights.reasoning +
    keywordScore * race.weights.keywords;
  const antiCheatPenalty = getAntiCheatPenalty(artifact);
  const totalScore =
    taskScore * race.weights.totalTask +
    tokenScore * race.weights.totalToken +
    dialogueScore * race.weights.totalDialogue -
    antiCheatPenalty;

  return {
    passRate: roundScore(input.passRate),
    codeReviewScore: roundScore(input.codeReviewScore),
    reasoningScore: roundScore(input.reasoningScore),
    keywordScore: roundScore(keywordScore),
    tokenScore: roundScore(tokenScore),
    taskScore: roundScore(taskScore),
    dialogueScore: roundScore(dialogueScore),
    totalScore: roundScore(Math.max(0, totalScore)),
    antiCheatPenalty,
    status: input.status,
    runnerComment: input.runnerComment.trim(),
  };
}

function ensureSubmissionAllowed(
  state: AryState,
  race: Race,
  team: Team,
): void {
  const phase = getRacePhase(race);
  if (phase !== "active" && phase !== "frozen") {
    throw new Error("只有比赛进行中或封榜期才能提交。");
  }

  const lastSubmission = state.submissions.find(
    (submission) => submission.teamId === team.id,
  );
  if (!lastSubmission) {
    return;
  }

  const cooldownMs = race.submissionIntervalHours * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(lastSubmission.createdAt).getTime();
  if (elapsed < cooldownMs) {
    const minutes = Math.ceil((cooldownMs - elapsed) / 60000);
    throw new Error(`提交过于频繁，请 ${minutes} 分钟后再试。`);
  }
}

function getKeywordScore(text: string, keywords: string[]): number {
  if (keywords.length === 0) {
    return 100;
  }

  const matched = keywords.filter((keyword) => text.includes(keyword)).length;
  return (matched / keywords.length) * 100;
}

function getTokenScore(tokenUsed: number, tokenLimit: number): number {
  if (tokenLimit <= 0) {
    return 100;
  }
  return Math.max(0, 100 * (1 - tokenUsed / tokenLimit));
}

function getAntiCheatPenalty(artifact: SubmissionArtifact): number {
  const combined = `${artifact.code}\n${artifact.ridingRecord}`.toLowerCase();
  return INDUCEMENT_TERMS.some((term) => combined.includes(term.toLowerCase()))
    ? 20
    : 0;
}

function extractHighlight(record: string): string {
  const lines = record
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const source = lines[0] ?? record.trim();
  return source.slice(0, 140);
}

function extractCodeSnippet(code: string): string {
  return code.split(/\r?\n/).slice(0, 8).join("\n");
}

function findOrCreateThread(
  state: AryState,
  raceId: string,
  teamId: string,
): FeedbackThread {
  const existing = state.feedbackThreads.find(
    (thread) => thread.raceId === raceId && thread.teamId === teamId,
  );

  if (existing) {
    return existing;
  }

  const created: FeedbackThread = {
    id: makeId("thread"),
    raceId,
    teamId,
    status: "pending",
    messages: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.feedbackThreads.unshift(created);
  return created;
}

function pushNotification(
  state: AryState,
  raceId: string,
  title: string,
  content: string,
): void {
  state.notifications.unshift({
    id: makeId("notification"),
    raceId,
    title,
    content,
    target: "all",
    teamId: null,
    createdAt: nowIso(),
  });
}

function validateCredential(
  username: string,
  password: string,
  displayName: string,
): void {
  if (username.trim().length < 3) {
    throw new Error("用户名至少 3 个字符。");
  }
  if (password.trim().length < 6) {
    throw new Error("密码至少 6 个字符。");
  }
  if (displayName.trim().length < 2) {
    throw new Error("显示名至少 2 个字符。");
  }
}

function validateRaceInput(input: CreateRaceInput): void {
  if (!input.title.trim() || !input.summary.trim()) {
    throw new Error("赛事名称和简介不能为空。");
  }
  if (!input.taskPackageLabel.trim() || !input.taskDescription.trim()) {
    throw new Error("题目压缩包标识和题目描述不能为空。");
  }
  if (parseKeywords(input.keywordsText).length === 0) {
    throw new Error("关键词配置为必填。");
  }
  if (input.maxTeamSize <= 0) {
    throw new Error("每组人数上限必须大于 0。");
  }
  if (input.submissionIntervalHours <= 0) {
    throw new Error("提交频率限制必须大于 0。");
  }
  if (input.updateGranularityMinutes <= 0) {
    throw new Error("榜单颗粒度必须大于 0。");
  }

  const timeline = [
    new Date(input.signupStart).getTime(),
    new Date(input.signupEnd).getTime(),
    new Date(input.raceStart).getTime(),
    new Date(input.raceEnd).getTime(),
  ];

  if (timeline.some((value) => Number.isNaN(value))) {
    throw new Error("请填写完整的时间线。");
  }

  if (!(timeline[0] <= timeline[1] && timeline[1] <= timeline[2] && timeline[2] <= timeline[3])) {
    throw new Error("时间线必须满足报名开始 ≤ 报名结束 ≤ 比赛开始 ≤ 比赛结束。");
  }
}

function validateSubmissionInput(input: SubmissionInput): void {
  if (!input.code.trim()) {
    throw new Error("代码内容不能为空。");
  }
  if (!input.ridingRecord.trim()) {
    throw new Error("Riding Record 不能为空。");
  }
  if (input.tokenUsed < 0) {
    throw new Error("Token 消耗不能为负数。");
  }
}

function normalizeWeights(weights: RaceWeights): RaceWeights {
  const task = normalizePair(weights.taskPassRate, weights.codeReview);
  const dialogue = normalizePair(weights.reasoning, weights.keywords);
  const total = normalizeTriple(
    weights.totalTask,
    weights.totalToken,
    weights.totalDialogue,
  );

  return {
    taskPassRate: task[0],
    codeReview: task[1],
    reasoning: dialogue[0],
    keywords: dialogue[1],
    totalTask: total[0],
    totalToken: total[1],
    totalDialogue: total[2],
  };
}

function normalizePair(left: number, right: number): [number, number] {
  const safeLeft = left > 0 ? left : 1;
  const safeRight = right > 0 ? right : 1;
  const sum = safeLeft + safeRight;
  return [safeLeft / sum, safeRight / sum];
}

function normalizeTriple(
  first: number,
  second: number,
  third: number,
): [number, number, number] {
  const safe = [first, second, third].map((value) => (value > 0 ? value : 1));
  const sum = safe.reduce((acc, value) => acc + value, 0);
  return [safe[0] / sum, safe[1] / sum, safe[2] / sum];
}

function parseKeywords(text: string): string[] {
  return text
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMembers(text: string): string[] {
  return text
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function findTeamForCaptain(
  state: AryState,
  raceId: string,
  riderId: string,
): Team | null {
  return (
    state.teams.find(
      (team) => team.raceId === raceId && team.captainId === riderId,
    ) ?? null
  );
}

function requireOwnedRace(
  state: AryState,
  organizerId: string,
  raceId: string,
): Race {
  const race = requireRace(state, raceId);
  if (race.organizerId !== organizerId) {
    throw new Error("你无权操作这场比赛。");
  }
  return race;
}

function requireRace(state: AryState, raceId: string): Race {
  const race = state.races.find((candidate) => candidate.id === raceId);
  if (!race) {
    throw new Error("未找到对应赛事。");
  }
  return race;
}

function requireOrganizer(state: AryState, organizerId: string): User {
  const user = state.users.find((candidate) => candidate.id === organizerId);
  if (!user || user.role !== "organizer") {
    throw new Error("当前账号不是 Organizer。");
  }
  return user;
}

function requireRider(state: AryState, riderId: string): User {
  const user = state.users.find((candidate) => candidate.id === riderId);
  if (!user || user.role !== "rider") {
    throw new Error("当前账号不是 Rider。");
  }
  return user;
}

function requireTeamForCaptain(
  state: AryState,
  raceId: string,
  riderId: string,
): Team {
  const team = findTeamForCaptain(state, raceId, riderId);
  if (!team) {
    throw new Error("你还没有报名这场比赛。");
  }
  return team;
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toIso(raw: string): string {
  return new Date(raw).toISOString();
}
