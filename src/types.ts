export type UserRole = "organizer" | "rider";

export type RacePhase =
  | "registration"
  | "preparation"
  | "active"
  | "frozen"
  | "finished";

export type SubmissionStatus = "queued" | "pulled" | "scored";

export type FeedbackStatus = "pending" | "resolved";

export type NotificationTarget = "all" | "team";

export type AgentType =
  | "claude"
  | "copilot"
  | "deepseek"
  | "zhipu"
  | "openai"
  | "custom";

export interface SessionState {
  userId: string | null;
}

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface RaceDisplayOptions {
  showTrainingData: boolean;
  showOrganizerComment: boolean;
  showTopRidingHighlights: boolean;
  highlightCount: number;
  showRiderCode: boolean;
}

export interface RaceWeights {
  taskPassRate: number;
  codeReview: number;
  reasoning: number;
  keywords: number;
  totalTask: number;
  totalToken: number;
  totalDialogue: number;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  submissionId: string;
  totalScore: number;
  taskScore: number;
  tokenScore: number;
  dialogueScore: number;
  agentType: AgentType;
  updatedAt: string;
}

export interface HarnessEntry {
  teamId: string;
  teamName: string;
  harnessScore: number;
  reasoningScore: number;
  keywordScore: number;
  updatedAt: string;
}

export interface RidingHighlight {
  teamId: string;
  teamName: string;
  score: number;
  agentType: AgentType;
  excerpt: string;
  codeSnippet: string;
}

export interface TeamComment {
  teamId: string;
  content: string;
}

export interface Race {
  id: string;
  organizerId: string;
  title: string;
  summary: string;
  taskPackageLabel: string;
  taskDescription: string;
  trainingDataSummary: string;
  hasTrainingData: boolean;
  evaluationNotes: string;
  keywords: string[];
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
  display: RaceDisplayOptions;
  weights: RaceWeights;
  organizerComment: string;
  teamComments: TeamComment[];
  publicLeaderboard: LeaderboardEntry[];
  harnessLeaderboard: HarnessEntry[];
  publishedHighlights: RidingHighlight[];
  lastLeaderboardSyncAt: string | null;
  lastShowcaseSyncAt: string | null;
  lastUpdatedAt: string;
}

export interface Team {
  id: string;
  raceId: string;
  captainId: string;
  name: string;
  members: string[];
  createdAt: string;
}

export interface SubmissionArtifact {
  code: string;
  ridingRecord: string;
  codeLabel: string;
  recordLabel: string;
  tokenUsed: number;
  agentType: AgentType;
}

export interface SubmissionResult {
  passRate: number;
  codeReviewScore: number;
  reasoningScore: number;
  keywordScore: number;
  tokenScore: number;
  taskScore: number;
  dialogueScore: number;
  totalScore: number;
  antiCheatPenalty: number;
  status: "success" | "failed";
  runnerComment: string;
}

export interface Submission {
  id: string;
  taskId: string;
  raceId: string;
  teamId: string;
  teamName: string;
  status: SubmissionStatus;
  artifact: SubmissionArtifact | null;
  createdAt: string;
  pulledAt: string | null;
  scoredAt: string | null;
  result: SubmissionResult | null;
}

export interface TeamArchive {
  id: string;
  raceId: string;
  teamId: string;
  teamName: string;
  submissionId: string;
  code: string;
  ridingRecord: string;
  codeLabel: string;
  recordLabel: string;
  tokenUsed: number;
  agentType: AgentType;
  totalScore: number;
  taskScore: number;
  dialogueScore: number;
  tokenScore: number;
  reasoningScore: number;
  keywordScore: number;
  antiCheatPenalty: number;
  createdAt: string;
}

export interface FeedbackMessage {
  id: string;
  authorId: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface FeedbackThread {
  id: string;
  raceId: string;
  teamId: string;
  status: FeedbackStatus;
  messages: FeedbackMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  raceId: string;
  title: string;
  content: string;
  target: NotificationTarget;
  teamId: string | null;
  createdAt: string;
}

export interface AryState {
  version: number;
  users: User[];
  session: SessionState;
  races: Race[];
  teams: Team[];
  submissions: Submission[];
  teamArchives: TeamArchive[];
  feedbackThreads: FeedbackThread[];
  notifications: Notification[];
  lastCleanupAt: string | null;
}
