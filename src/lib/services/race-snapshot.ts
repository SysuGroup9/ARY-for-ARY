// RaceSnapshot 生成服务
// 从 ARY 数据库读取赛事数据 → 通过 Adapter 映射 → 写入 JSON 快照文件

import { prisma } from "@/lib/prisma";
import {
  AryDerivedDataProvider,
  mapToCompetition,
  type AryRaceData,
} from "@/lib/jumbotron/adapter";
import { normalizeTrackId, parseRaceTrackConfigJson } from "@/lib/jumbotron/track-config";
import type { RaceSnapshot } from "@/lib/jumbotron/track-runtime/types";
import fs from "node:fs";
import path from "node:path";

const SNAPSHOT_DIR = path.join(process.cwd(), "public", "assets", "snapshots");

/**
 * 生成赛事快照 JSON
 *
 * 数据流：
 *   1. 从 Prisma 查询赛事全量数据
 *   2. 通过 AryDerivedDataProvider 映射为 Jumbotron 格式
 *   3. 写入 public/assets/snapshots/<raceId>.json
 *   4. 返回生成的快照对象
 */
export async function generateRaceSnapshot(raceId: string): Promise<RaceSnapshot> {
  // 1. 查询赛事全量数据
  const race = await prisma.race.findUnique({
    where: { id: raceId },
    include: {
      organizer: { select: { id: true, username: true } },
      teams: {
        include: {
          captain: { select: { id: true, username: true } },
        },
      },
      leaderboardEntries: {
        orderBy: [{ totalScore: "desc" }, { createdAt: "asc" }],
      },
      submissions: {
        orderBy: { createdAt: "desc" },
      },
      teamArchives: {
        orderBy: { totalScore: "desc" },
      },
      feedbackThreads: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!race) {
    throw new Error(`赛事 ${raceId} 不存在`);
  }

  // 2. 构造 AryRaceData
  const raceData: AryRaceData = {
    id: race.id,
    title: race.title,
    summary: race.summary,
    signupStart: race.signupStart,
    signupEnd: race.signupEnd,
    raceStart: race.raceStart,
    raceEnd: race.raceEnd,
    organizer: race.organizer,
    teams: race.teams.map((t) => ({
      id: t.id,
      name: t.name,
      captain: t.captain,
    })),
    leaderboardEntries: race.leaderboardEntries.map((e) => ({
      id: e.id,
      teamId: e.teamId,
      totalScore: e.totalScore,
      progress: e.progress,
      taskScore: e.taskScore,
      tokenScore: e.tokenScore,
      dialogueScore: e.dialogueScore,
      agentType: e.agentType,
      createdAt: e.createdAt,
    })),
    submissions: race.submissions.map((s) => ({
      id: s.id,
      teamId: s.teamId,
      createdAt: s.createdAt,
    })),
    teamArchives: race.teamArchives.map((a) => ({
      teamId: a.teamId,
      agentType: a.agentType,
      tokenUsed: a.tokenUsed,
      totalScore: a.totalScore,
      antiCheatPenalty: a.antiCheatPenalty,
    })),
    feedbackThreads: race.feedbackThreads.map((f) => ({
      teamId: f.teamId,
      messages: f.messages.map((m) => ({
        content: m.content,
        createdAt: m.createdAt,
      })),
    })),
  };

  // 3. 通过 Adapter 映射
  const provider = new AryDerivedDataProvider(raceData);
  const now = new Date();

  const [entries, messages, attentionItems, kpis] = await Promise.all([
    provider.getRaceEntries(raceId),
    provider.getRidingMessages(raceId),
    provider.getAttentionItems(raceId),
    provider.getCompetitionKPI(raceId),
  ]);

  const competition = mapToCompetition(raceData, now);

  // 4. 修正 KPIs：在线数 = 总数 - stale 数
  const staleCount = entries.filter((e) => e.status === "stale").length;
  kpis.onlineRiders = entries.length - staleCount;
  kpis.activeRiders = entries.filter((e) => e.status !== "stale" && e.status !== "idle").length;

  // 5. 组装快照
  const trackConfig = parseRaceTrackConfigJson(race.trackConfigJson);

  const snapshot: RaceSnapshot = {
    generatedAt: now.toISOString(),
    raceId,
    trackId: normalizeTrackId(race.trackId),
    trackConfig: trackConfig ?? undefined,
    competition,
    entries,
    kpis,
    messages,
    attentionItems,
  };

  // 5. 写入文件
  ensureSnapshotDir();
  const filePath = path.join(SNAPSHOT_DIR, `${raceId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf-8");

  return snapshot;
}

/**
 * 读取已生成的快照（供 Jumbotron 页面静态消费）
 */
export function loadRaceSnapshot(raceId: string): RaceSnapshot | null {
  const filePath = path.join(SNAPSHOT_DIR, `${raceId}.json`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as RaceSnapshot;
}

/**
 * 列出所有已生成的快照 ID
 */
export function listSnapshotIds(): string[] {
  ensureSnapshotDir();
  return fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

export function deleteRaceSnapshot(raceId: string): void {
  const filePath = path.join(SNAPSHOT_DIR, `${raceId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function ensureSnapshotDir(): void {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}
