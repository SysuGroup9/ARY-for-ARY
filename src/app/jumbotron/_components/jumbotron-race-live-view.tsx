"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "@/app/jumbotron/jumbotron.module.css";
import type {
  AttentionItem,
  HorsePose,
  JumbotronSnapshot,
  MessageBubbleCandidate,
  RacingEntrySnapshot,
} from "@/lib/jumbotron/contracts";
import {
  buildTrackRuntime,
  calculateHorsePoses,
  interpolateProgressOnSAxis,
  sampleLanePath,
  selectMessageBubbles,
} from "@/lib/jumbotron/track-runtime";

interface RaceOption {
  id: string;
  title: string;
}

export function JumbotronRaceLiveView({
  debug,
  races,
  snapshot,
}: {
  debug: boolean;
  races: RaceOption[];
  snapshot: JumbotronSnapshot;
}) {
  const runtime = useMemo(() => buildTrackRuntime(snapshot.track), [snapshot.track]);
  const [entries, setEntries] = useState(snapshot.entries);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setEntries((current) =>
        current.map((entry, index) => {
          if (entry.status !== "running") {
            return entry;
          }

          const target = (entry.roundProgress + 0.012 + index * 0.002) % 1;
          return {
            ...entry,
            overallProgress: Math.max(entry.overallProgress, target),
            roundProgress: interpolateProgressOnSAxis({
              closed: snapshot.track.centerline.closed,
              from: entry.roundProgress,
              t: 0.28,
              to: target,
            }),
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    }, 220);

    return () => window.clearInterval(intervalId);
  }, [snapshot.track.centerline.closed]);

  const liveSnapshot = {
    ...snapshot,
    entries,
  };
  const poses = calculateHorsePoses(runtime, entries);
  const bubbles = selectMessageBubbles(snapshot.track, poses, entries);
  const topEntries = [...entries]
    .sort((left, right) => (left.rank ?? 999) - (right.rank ?? 999))
    .slice(0, 3);
  const leadEntry = topEntries[0];

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ARY GRS 001 / Race Live</p>
          <h1>{snapshot.competition.title}</h1>
          <p>{snapshot.competition.subtitle}</p>
        </div>
        <div className={styles.headerStats}>
          <span className={styles.liveBadge}>LIVE</span>
          <span>{snapshot.competition.currentRound}</span>
          <span>{snapshot.competition.currentPhase}</span>
          <span>{snapshot.competition.elapsedTime}</span>
        </div>
      </header>

      <section className={styles.topGrid}>
        <div className={styles.topThree}>
          <p className={styles.sectionLabel}>Real-time TOP3</p>
          <div className={styles.rankList}>
            {topEntries.map((entry) => (
              <TopEntryCard entry={entry} key={entry.entryId} />
            ))}
          </div>
        </div>
        <KpiStrip snapshot={liveSnapshot} />
      </section>

      <section className={styles.stageLayout}>
        <aside className={styles.leftRail}>
          <p className={styles.sectionLabel}>Track Mini Map</p>
          <MiniMap poses={poses} snapshot={liveSnapshot} />
          <CheckpointList snapshot={liveSnapshot} />
          {leadEntry ? <RaceStoryPanel leadEntry={leadEntry} snapshot={liveSnapshot} /> : null}
        </aside>

        <section className={styles.trackStage}>
          <TrackSvg
            bubbles={bubbles}
            debug={debug}
            poses={poses}
            snapshot={liveSnapshot}
          />
        </section>
      </section>

      <Ticker items={snapshot.attentionItems} snapshot={liveSnapshot} />

      <footer className={styles.footer}>
        <span>{snapshot.competition.theme}</span>
        <span>{snapshot.competition.organizer}</span>
        <span>Next: {snapshot.competition.nextPhase}</span>
        <span>{snapshot.competition.systemTime}</span>
        <Link href="/jumbotron/calibrator">Track Calibrator</Link>
        {races.length > 0 ? <span>{races.length} races available</span> : null}
      </footer>
    </main>
  );
}

function KpiStrip({ snapshot }: { snapshot: JumbotronSnapshot }) {
  const kpis = [
    ["Completion", formatPercent(snapshot.kpis.completionRate)],
    ["Active Riders", `${snapshot.kpis.activeRiders}/${snapshot.kpis.onlineRiders}`],
    ["Total Tokens", formatNumber(snapshot.kpis.totalTokens)],
    ["Codex", formatPercent(snapshot.kpis.codexShare)],
    ["Claude", formatPercent(snapshot.kpis.claudeShare)],
    ["Risk / Obs / Vio", `${snapshot.kpis.riskCount}/${snapshot.kpis.obstacleCount}/${snapshot.kpis.violationCount}`],
  ];

  return (
    <div className={styles.kpiGrid}>
      {kpis.map(([label, value]) => (
        <div className={styles.kpiCard} key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function TopEntryCard({ entry }: { entry: RacingEntrySnapshot }) {
  return (
    <article className={styles.rankCard}>
      <span className={styles.rankBadge}>#{entry.rank ?? "-"}</span>
      <div>
        <strong>{entry.projectName}</strong>
        <p>{entry.riderName}</p>
      </div>
      <span className={styles.motionPill}>{entry.status}</span>
      <a className={styles.drilldownLink} href={entry.cockpitId ?? "#"}>
        Open cockpit
      </a>
    </article>
  );
}

function RaceStoryPanel({
  leadEntry,
  snapshot,
}: {
  leadEntry: RacingEntrySnapshot;
  snapshot: JumbotronSnapshot;
}) {
  const activeRisk = snapshot.attentionItems[0];

  return (
    <div className={styles.storyPanel}>
      <p className={styles.sectionLabel}>Live Story</p>
      <strong>{leadEntry.projectName} 正在领跑</strong>
      <p>
        当前领先位置来自 <code>{leadEntry.positionSource}</code>，
        roundProgress = {Math.round(leadEntry.roundProgress * 100)}%。
      </p>
      {activeRisk ? (
        <p>
          组织者关注：{activeRisk.summary}
        </p>
      ) : null}
    </div>
  );
}

function MiniMap({
  poses,
  snapshot,
}: {
  poses: HorsePose[];
  snapshot: JumbotronSnapshot;
}) {
  const runtime = buildTrackRuntime(snapshot.track);
  const centerPoints = runtime.sampledPoints
    .map((point) => `${point.x / 8},${point.y / 8}`)
    .join(" ");

  return (
    <svg className={styles.miniMap} viewBox="0 0 160 90">
      <polyline fill="none" points={centerPoints} stroke="currentColor" strokeWidth="2" />
      {poses.map((pose) => (
        <circle
          cx={pose.x / 8}
          cy={pose.y / 8}
          fill={stateColor(pose.state)}
          key={pose.entryId}
          r="3.4"
        />
      ))}
    </svg>
  );
}

function CheckpointList({ snapshot }: { snapshot: JumbotronSnapshot }) {
  return (
    <div className={styles.checkpointList}>
      <p className={styles.sectionLabel}>Checkpoints</p>
      {snapshot.track.checkpoints.map((checkpoint) => (
        <div className={styles.checkpointItem} key={checkpoint.checkpointId}>
          <span>{checkpoint.label}</span>
          <strong>{formatPercent(checkpoint.s)}</strong>
        </div>
      ))}
    </div>
  );
}

function TrackSvg({
  bubbles,
  debug,
  poses,
  snapshot,
}: {
  bubbles: MessageBubbleCandidate[];
  debug: boolean;
  poses: HorsePose[];
  snapshot: JumbotronSnapshot;
}) {
  const runtime = buildTrackRuntime(snapshot.track);
  const viewBox = `0 0 ${snapshot.track.viewBox.width} ${snapshot.track.viewBox.height}`;

  return (
    <div className={styles.trackFrame}>
      <svg className={styles.trackSvg} viewBox={viewBox}>
        <image
          height={snapshot.track.viewBox.height}
          href={snapshot.track.background.href}
          opacity={snapshot.track.background.opacity}
          width={snapshot.track.viewBox.width}
          x="0"
          y="0"
        />
        {debug ? <DebugLayers poses={poses} runtime={runtime} snapshot={snapshot} /> : null}
        {snapshot.track.checkpoints.map((checkpoint) => {
          const point = runtime.sampledPoints[Math.round(checkpoint.s * (runtime.sampledPoints.length - 1))];
          return point ? (
            <g className={styles.checkpointMarker} key={checkpoint.checkpointId}>
              <circle cx={point.x} cy={point.y} r="13" />
              <text x={point.x + 18} y={point.y + 5}>{checkpoint.label}</text>
            </g>
          ) : null;
        })}
        {poses.map((pose) => {
          const entry = snapshot.entries.find((item) => item.entryId === pose.entryId);
          return entry ? <HorseMarker entry={entry} key={pose.entryId} pose={pose} /> : null;
        })}
      </svg>

      {bubbles.map((bubble) => (
        <div
          className={styles.messageBubble}
          key={bubble.message.messageId}
          style={{
            left: `${(bubble.x / snapshot.track.viewBox.width) * 100}%`,
            top: `${(bubble.y / snapshot.track.viewBox.height) * 100}%`,
          }}
        >
          {bubble.message.summary}
        </div>
      ))}
    </div>
  );
}

function DebugLayers({
  poses,
  runtime,
  snapshot,
}: {
  poses: HorsePose[];
  runtime: ReturnType<typeof buildTrackRuntime>;
  snapshot: JumbotronSnapshot;
}) {
  const centerline = runtime.sampledPoints.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <g className={styles.debugLayer}>
      <polyline fill="none" points={centerline} strokeWidth="3" />
      {snapshot.track.lanes.map((lane) => (
        <polyline
          fill="none"
          key={lane.laneId}
          points={sampleLanePath(runtime, lane.laneId).map((point) => `${point.x},${point.y}`).join(" ")}
          strokeDasharray="10 10"
          strokeWidth="2"
        />
      ))}
      {runtime.sampledPoints.filter((_, index) => index % 8 === 0).map((point) => (
        <circle cx={point.x} cy={point.y} key={`${point.s}-${point.x}`} r="4" />
      ))}
      {snapshot.track.riskZones.map((zone) => {
        const start = runtime.sampledPoints[Math.round(zone.sStart * (runtime.sampledPoints.length - 1))];
        const end = runtime.sampledPoints[Math.round(zone.sEnd * (runtime.sampledPoints.length - 1))];
        return start && end ? (
          <line
            className={styles.riskZoneLine}
            key={zone.zoneId}
            strokeWidth="18"
            x1={start.x}
            x2={end.x}
            y1={start.y}
            y2={end.y}
          />
        ) : null;
      })}
      {poses.map((pose) => (
        <rect
          className={styles.collisionBox}
          height={pose.collisionBox.height}
          key={`${pose.entryId}-collision`}
          width={pose.collisionBox.width}
          x={pose.collisionBox.x}
          y={pose.collisionBox.y}
        />
      ))}
    </g>
  );
}

function HorseMarker({
  entry,
  pose,
}: {
  entry: RacingEntrySnapshot;
  pose: HorsePose;
}) {
  const markerClass = `${styles.horseMarker} ${styles[`state_${pose.state}`] ?? ""}`;

  return (
    <g className={markerClass} transform={`translate(${pose.x} ${pose.y}) rotate(${pose.rotation})`}>
      <path d="M28 0 L-22 -18 L-10 0 L-22 18 Z" fill={stateColor(pose.state)} />
      <circle cx="-26" cy="0" r="21" />
      <text transform={`rotate(${-pose.rotation})`} x="-34" y="7">
        {entry.rank ?? "-"}
      </text>
      <text className={styles.horseLabel} transform={`rotate(${-pose.rotation})`} x="20" y="-24">
        {entry.projectName}
      </text>
      <text className={styles.debugText} transform={`rotate(${-pose.rotation})`} x="20" y="26">
        {pose.laneResolvedByFallback ? "lane fallback" : `s=${Math.round(pose.s * 100)}%`}
      </text>
    </g>
  );
}

function Ticker({
  items,
  snapshot,
}: {
  items: AttentionItem[];
  snapshot: JumbotronSnapshot;
}) {
  const tickerItems = [
    ...items.map((item) => ({
      category: item.category,
      id: item.itemId,
      severity: item.severity,
      summary: item.summary,
    })),
    ...snapshot.messages
      .filter((message) => message.displayMode === "ticker")
      .map((message) => ({
        category: message.type,
        id: message.messageId,
        severity: message.severity,
        summary: message.summary,
      })),
  ];

  return (
    <section className={styles.ticker}>
      <span className={styles.liveDot} />
      <div className={styles.tickerTrack}>
        {tickerItems.length === 0 ? (
          <span>No active risks or messages.</span>
        ) : (
          tickerItems.map((item) => (
            <span className={styles.tickerItem} key={item.id}>
              <strong>{item.category}</strong>
              <em>{item.severity}</em>
              {item.summary}
            </span>
          ))
        )}
      </div>
    </section>
  );
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function stateColor(state: HorsePose["state"]): string {
  const colors: Record<HorsePose["state"], string> = {
    blocked: "#e45757",
    finished: "#f5c542",
    idle: "#8aa0a6",
    pit_stop: "#f08a4b",
    running: "#48c78e",
    slowed: "#d6a84f",
    sprinting: "#5ed1ff",
    stale: "#70808a",
    takeover: "#b88cff",
  };

  return colors[state];
}
