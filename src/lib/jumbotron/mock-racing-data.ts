import type {
  AttentionItem,
  CompetitionKpiSnapshot,
  CompetitionSnapshot,
  JumbotronSnapshot,
  RacingEntrySnapshot,
  RidingMessageSnapshot,
} from "@/lib/jumbotron/contracts";
import type { TrackProfile } from "@/lib/jumbotron/track-profile";

const nowIso = "2026-06-09T12:00:00.000Z";

export const devcompassOvalTrack: TrackProfile = {
  background: {
    href: "/jumbotron/tracks/devcompass-oval/background.svg",
    opacity: 1,
    type: "image",
  },
  centerline: {
    closed: true,
    points: [
      { x: 184, y: 414 },
      { x: 252, y: 258 },
      { x: 436, y: 168 },
      { x: 778, y: 150 },
      { x: 1020, y: 240 },
      { x: 1108, y: 420 },
      { x: 1002, y: 596 },
      { x: 724, y: 660 },
      { x: 386, y: 620 },
      { x: 214, y: 524 },
    ],
    smoothing: 0.35,
    type: "polyline",
  },
  checkpoints: [
    { checkpointId: "prd-gate", label: "PRD Gate", s: 0.16 },
    { checkpointId: "dev-split", label: "DEV Split", s: 0.39 },
    { checkpointId: "release-line", label: "REL Line", s: 0.68 },
    { checkpointId: "ops-watch", label: "OPS Watch", s: 0.86 },
  ],
  direction: "clockwise",
  lanes: [
    { label: "Lane 1", laneId: "lane-1", offset: -42 },
    { label: "Lane 2", laneId: "lane-2", offset: -14 },
    { label: "Lane 3", laneId: "lane-3", offset: 14 },
    { label: "Lane 4", laneId: "lane-4", offset: 42 },
  ],
  messageZones: [
    { dx: 24, dy: -82, priority: 2, sEnd: 0.32, sStart: 0.08, zoneId: "north-stand" },
    { dx: -244, dy: -48, priority: 3, sEnd: 0.62, sStart: 0.42, zoneId: "right-turn" },
    { dx: 30, dy: -86, priority: 1, sEnd: 0.92, sStart: 0.7, zoneId: "home-stretch" },
  ],
  name: "DevCompass Oval",
  noBubbleZones: [
    { sEnd: 0.04, sStart: 0, zoneId: "title-safe-zone" },
    { sEnd: 1, sStart: 0.96, zoneId: "finish-safe-zone" },
  ],
  riskZones: [
    { label: "Token Burn Watch", sEnd: 0.66, sStart: 0.52, severity: "high", zoneId: "token-burn-watch" },
    { label: "Final Review Gate", sEnd: 0.92, sStart: 0.82, severity: "medium", zoneId: "final-review-gate" },
  ],
  schemaVersion: "jumbotron.track-profile.v1",
  startFinish: {
    label: "START / FINISH",
    s: 0,
  },
  trackId: "devcompass-oval",
  viewBox: {
    height: 720,
    width: 1280,
  },
};

export const cityHairpinTrack: TrackProfile = {
  background: {
    href: "/jumbotron/tracks/city-hairpin/background.svg",
    opacity: 1,
    type: "image",
  },
  centerline: {
    closed: false,
    points: [
      { x: 106, y: 590 },
      { x: 220, y: 522 },
      { x: 384, y: 520 },
      { x: 468, y: 424 },
      { x: 390, y: 310 },
      { x: 502, y: 214 },
      { x: 726, y: 230 },
      { x: 830, y: 348 },
      { x: 746, y: 480 },
      { x: 890, y: 594 },
      { x: 1126, y: 512 },
    ],
    smoothing: 0.2,
    type: "polyline",
  },
  checkpoints: [
    { checkpointId: "entry", label: "Entry", s: 0.12 },
    { checkpointId: "hairpin", label: "Hairpin", s: 0.42 },
    { checkpointId: "recovery", label: "Recovery", s: 0.7 },
    { checkpointId: "finish", label: "Finish", s: 1 },
  ],
  direction: "counterclockwise",
  lanes: [
    { label: "Inside", laneId: "inside", offset: -30 },
    { label: "Middle", laneId: "middle", offset: 0 },
    { label: "Outside", laneId: "outside", offset: 30 },
  ],
  messageZones: [
    { dx: 22, dy: -74, priority: 2, sEnd: 0.3, sStart: 0.05, zoneId: "early-push" },
    { dx: -220, dy: -54, priority: 4, sEnd: 0.58, sStart: 0.36, zoneId: "hairpin-zone" },
    { dx: 28, dy: -78, priority: 2, sEnd: 0.94, sStart: 0.72, zoneId: "finish-push" },
  ],
  name: "City Hairpin",
  noBubbleZones: [
    { sEnd: 0.68, sStart: 0.6, zoneId: "kpi-safe-zone" },
  ],
  riskZones: [
    { label: "Hairpin Obstacle Zone", sEnd: 0.58, sStart: 0.38, severity: "high", zoneId: "hairpin-obstacle-zone" },
  ],
  schemaVersion: "jumbotron.track-profile.v1",
  startFinish: {
    label: "START",
    s: 0,
  },
  trackId: "city-hairpin",
  viewBox: {
    height: 720,
    width: 1280,
  },
};

export const exampleTracks = [devcompassOvalTrack, cityHairpinTrack] as const;

const messages: RidingMessageSnapshot[] = [
  {
    createdAt: nowIso,
    displayMode: "bubble",
    entryId: "team-vector",
    messageId: "msg-001",
    severity: "high",
    source: "runner",
    summary: "反超窗口打开，测试通过率升至 92%。",
    type: "milestone",
  },
  {
    createdAt: nowIso,
    displayMode: "bubble",
    entryId: "team-orbit",
    messageId: "msg-002",
    severity: "medium",
    source: "agent",
    summary: "正在处理边界输入，短暂停靠。",
    type: "pit_stop",
  },
  {
    createdAt: nowIso,
    displayMode: "ticker",
    entryId: "team-pulse",
    messageId: "msg-003",
    severity: "critical",
    source: "system",
    summary: "Token 消耗接近上限，需要 Organizer 关注。",
    type: "risk_alert",
  },
];

const entries: RacingEntrySnapshot[] = [
  {
    caProvider: "codex",
    costTokens: 18_420,
    currentPhase: "DEV",
    entryId: "team-vector",
    laneId: "lane-1",
    lastMessage: messages[0],
    obstacleCount: 0,
    overallProgress: 0.78,
    phaseProgress: 0.9,
    positionSource: "roundProgress",
    projectName: "Vector Stable Sort",
    rank: 1,
    riderName: "Team Vector",
    riskLevel: "low",
    roundProgress: 0.82,
    status: "running",
    updatedAt: nowIso,
    violationCount: 0,
  },
  {
    caProvider: "claude",
    costTokens: 15_860,
    currentPhase: "DEV",
    entryId: "team-orbit",
    laneId: "lane-2",
    lastMessage: messages[1],
    obstacleCount: 1,
    overallProgress: 0.72,
    phaseProgress: 0.7,
    positionSource: "roundProgress",
    projectName: "Orbit Merge Harness",
    rank: 2,
    riderName: "Team Orbit",
    riskLevel: "medium",
    roundProgress: 0.74,
    status: "pit_stop",
    updatedAt: nowIso,
    violationCount: 0,
  },
  {
    caProvider: "codex",
    costTokens: 21_200,
    currentPhase: "REL",
    entryId: "team-pulse",
    laneId: "lane-3",
    lastMessage: messages[2],
    obstacleCount: 0,
    overallProgress: 0.64,
    phaseProgress: 0.58,
    positionSource: "roundProgress",
    projectName: "Pulse Boundary Check",
    rank: 3,
    riderName: "Team Pulse",
    riskLevel: "high",
    roundProgress: 0.63,
    status: "blocked",
    updatedAt: nowIso,
    violationCount: 1,
  },
  {
    caProvider: "other",
    costTokens: 9_880,
    currentPhase: "PM",
    entryId: "team-cedar",
    laneId: "lane-4",
    obstacleCount: 0,
    overallProgress: 0.44,
    phaseProgress: 0.4,
    positionSource: "roundProgress",
    projectName: "Cedar Input Map",
    rank: 4,
    riderName: "Team Cedar",
    riskLevel: "none",
    roundProgress: 0.46,
    status: "running",
    updatedAt: nowIso,
    violationCount: 0,
  },
];

const competition: CompetitionSnapshot = {
  competitionId: "demo-jumbotron",
  currentPhase: "DEV",
  currentRound: "ROUND 3",
  elapsedTime: "02:18:42",
  liveStatus: "live",
  nextPhase: "Release Review",
  onlineRiders: 24,
  organizer: "SYSU Group 9",
  subtitle: "Workshop / Hackathon Live Screen",
  systemTime: "2026-06-09 20:00",
  theme: "Agent Racing PoC",
  title: "DevCompass Racing",
};

const kpis: CompetitionKpiSnapshot = {
  activeCockpits: 4,
  activeRiders: 4,
  claudeShare: 0.28,
  claudeTokens: 15_860,
  codexShare: 0.54,
  codexTokens: 39_620,
  completionRate: 0.65,
  obstacleCount: 1,
  onlineRiders: 24,
  riskCount: 1,
  totalTokens: 65_360,
  violationCount: 1,
};

const attentionItems: AttentionItem[] = [
  {
    category: "risk",
    createdAt: nowIso,
    entryId: "team-pulse",
    itemId: "att-001",
    severity: "critical",
    status: "active",
    summary: "Team Pulse Token 消耗接近上限。",
  },
  {
    category: "obstacle",
    createdAt: nowIso,
    entryId: "team-orbit",
    itemId: "att-002",
    severity: "medium",
    status: "active",
    summary: "Team Orbit 边界输入评测暂未通过。",
  },
];

export const mockJumbotronSnapshot: JumbotronSnapshot = {
  attentionItems,
  competition,
  entries,
  kpis,
  messages,
  track: devcompassOvalTrack,
};

export function buildMockJumbotronSnapshot(
  track: TrackProfile = devcompassOvalTrack,
  now = new Date(),
): JumbotronSnapshot {
  const liveIso = now.toISOString();
  const liveMessages = messages.map((message, index) => ({
    ...message,
    createdAt: new Date(now.getTime() - index * 35_000).toISOString(),
  }));
  const liveEntries = entries.map((entry, index) => ({
    ...entry,
    laneId: track.lanes[index % track.lanes.length]?.laneId ?? entry.laneId,
    lastMessage: liveMessages.find((message) => message.entryId === entry.entryId),
    updatedAt:
      entry.status === "blocked"
        ? new Date(now.getTime() - 25_000).toISOString()
        : liveIso,
  }));

  return {
    attentionItems: attentionItems.map((item, index) => ({
      ...item,
      createdAt: new Date(now.getTime() - index * 42_000).toISOString(),
    })),
    competition: {
      ...competition,
      currentRound: "ROUND 3",
      elapsedTime: "02:18:42",
      systemTime: new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        hour12: false,
        timeStyle: "short",
      }).format(now),
    },
    entries: liveEntries,
    kpis,
    messages: liveMessages,
    track,
  };
}
