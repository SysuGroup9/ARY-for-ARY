import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import {
  AryDerivedDataProvider,
  mapToCompetition,
  type AryRaceData,
} from "@/lib/jumbotron/adapter";
import {
  normalizeTrackId,
  parseRaceTrackConfigJson,
} from "@/lib/jumbotron/track-config";
import type { RaceSnapshot } from "@/lib/jumbotron/track-runtime/types";

const SNAPSHOT_DIR = path.join(process.cwd(), "public", "assets", "snapshots");

export async function buildRaceSnapshot(raceId: string): Promise<RaceSnapshot> {
  const race = await prisma.race.findUnique({
    where: { id: raceId },
    include: {
      feedbackThreads: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      leaderboardEntries: {
        orderBy: [{ totalScore: "desc" }, { createdAt: "asc" }],
      },
      organizer: { select: { id: true, username: true } },
      projections: {
        orderBy: { updatedAt: "desc" },
      },
      registrations: {
        include: {
          raceProject: {
            include: {
              caConnections: {
                select: {
                  caType: true,
                  id: true,
                  sessions: {
                    select: {
                      id: true,
                      lastActiveAt: true,
                      latestActivity: true,
                      progressPercent: true,
                      tokenCost: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          },
          user: { select: { id: true, username: true } },
          work: { select: { id: true, summary: true, title: true } },
        },
      },
      submissions: {
        orderBy: { createdAt: "desc" },
      },
      teamArchives: {
        orderBy: { totalScore: "desc" },
      },
      teams: {
        include: {
          captain: { select: { id: true, username: true } },
        },
      },
    },
  });

  if (!race) {
    throw new Error(`Race ${raceId} not found`);
  }

  const raceData: AryRaceData = {
    feedbackThreads: race.feedbackThreads.map((thread) => ({
      teamId: thread.registrationId ?? thread.teamId,
      messages: thread.messages.map((message) => ({
        content: message.content,
        createdAt: message.createdAt,
      })),
    })),
    id: race.id,
    leaderboardEntries: race.leaderboardEntries.map((entry) => ({
      agentType: entry.agentType,
      createdAt: entry.createdAt,
      dialogueScore: entry.dialogueScore,
      id: entry.id,
      progress: entry.progress,
      taskScore: entry.taskScore,
      teamId: entry.registrationId ?? entry.teamId,
      tokenScore: entry.tokenScore,
      totalScore: entry.totalScore,
    })),
    organizer: race.organizer,
    projections: race.projections.map((projection) => ({
      id: projection.id,
      payloadJson: projection.payloadJson,
      type: projection.type,
    })),
    raceEnd: race.raceEnd,
    raceStart: race.raceStart,
    registrations: race.registrations.map((registration) => ({
      id: registration.id,
      raceProject: registration.raceProject
        ? {
            aggregateIngestionStatus:
              registration.raceProject.aggregateIngestionStatus,
            caConnections: registration.raceProject.caConnections.map(
              (connection) => ({
                caType: connection.caType,
                sessions: connection.sessions.map((session) => ({
                  id: session.id,
                  lastActiveAt: session.lastActiveAt ?? undefined,
                  latestActivity: session.latestActivity ?? undefined,
                  progressPercent: session.progressPercent ?? undefined,
                  tokenCost: session.tokenCost,
                  updatedAt: session.updatedAt,
                })),
              }),
            ),
            id: registration.raceProject.id,
          }
        : null,
      user: registration.user,
      userId: registration.userId,
      work: registration.work
        ? {
            id: registration.work.id,
            summary: registration.work.summary,
            title: registration.work.title,
          }
        : null,
    })),
    signupEnd: race.signupEnd,
    signupStart: race.signupStart,
    submissions: race.submissions.map((submission) => ({
      createdAt: submission.createdAt,
      id: submission.id,
      teamId: submission.registrationId ?? submission.teamId,
    })),
    summary: race.summary,
    teamArchives: race.teamArchives.map((archive) => ({
      agentType: archive.agentType,
      antiCheatPenalty: archive.antiCheatPenalty,
      teamId: archive.registrationId ?? archive.teamId,
      tokenUsed: archive.tokenUsed,
      totalScore: archive.totalScore,
    })),
    teams: race.teams.map((team) => ({
      captain: team.captain,
      id: team.id,
      name: team.name,
    })),
    title: race.title,
  };

  const provider = new AryDerivedDataProvider(raceData);
  const now = new Date();

  const [entries, messages, attentionItems, kpis] = await Promise.all([
    provider.getRaceEntries(raceId),
    provider.getRidingMessages(raceId),
    provider.getAttentionItems(raceId),
    provider.getCompetitionKPI(raceId),
  ]);

  const competition = mapToCompetition(raceData, now);
  const staleCount = entries.filter((entry) => entry.status === "stale").length;
  kpis.onlineRiders = entries.length - staleCount;
  kpis.activeRiders = entries.filter(
    (entry) => entry.status !== "stale" && entry.status !== "idle",
  ).length;

  const trackConfig = parseRaceTrackConfigJson(race.trackConfigJson);

  return {
    attentionItems,
    competition,
    entries,
    generatedAt: now.toISOString(),
    kpis,
    messages,
    raceId,
    trackConfig: trackConfig ?? undefined,
    trackId: normalizeTrackId(race.trackId),
  };
}

export async function generateRaceSnapshot(
  raceId: string,
): Promise<RaceSnapshot> {
  const snapshot = await buildRaceSnapshot(raceId);

  ensureSnapshotDir();
  const filePath = path.join(SNAPSHOT_DIR, `${raceId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf-8");

  return snapshot;
}

export function loadRaceSnapshot(raceId: string): RaceSnapshot | null {
  const filePath = path.join(SNAPSHOT_DIR, `${raceId}.json`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as RaceSnapshot;
}

export function listSnapshotIds(): string[] {
  ensureSnapshotDir();
  return fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => fileName.replace(".json", ""));
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
