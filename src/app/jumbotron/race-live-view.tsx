"use client";

import { useMemo, useState, useEffect, useId, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { RaceSnapshot, RacingEntrySnapshot, HorsePose } from "../../../Jumbotron/types";
import { TrackRuntime } from "../../../Jumbotron/track-runtime";
import type { TrackProfile } from "../../../Jumbotron/types";
import trackRaw from "../../../Jumbotron/tracks/track.profile.json";
import rectTrackRaw from "../../../Jumbotron/tracks/rect.profile.json";
import styles from "./jumbotron.module.css";

const OVAL_PROFILE = trackRaw as unknown as TrackProfile;
const RECT_PROFILE = rectTrackRaw as unknown as TrackProfile;

const TEAM_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#eab308",
  "#a855f7", "#f97316", "#06b6d4", "#ec4899",
];

const RISK_COLORS: Record<string, string> = {
  none: "transparent",
  low: "#eab308",
  medium: "#f97316",
  high: "#ef4444",
};

/* ── Riding Message Phrase Pool ── */
const PHRASES = {
  milestone_25: ["冲啊！", "加油！", "继续前进！", "势如破竹！"],
  milestone_50: ["过半啦！", "继续加速！", "保持节奏！", "半程完成！"],
  milestone_75: ["快到了！", "最后冲刺！", "坚持住！", "加油冲！"],
  finish:       ["冲线啦！", "完成！", "漂亮收尾！", "太棒了！"],
  overtake:     ["超车了！", "追上来了！", "漂亮！", "好样的！"],
  drop:         ["守住位置！", "稳住！", "追回来！", "别放弃！"],
} as const;

type PhraseKey = keyof typeof PHRASES;

function randomFrom(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

const MILESTONES: Array<[number, PhraseKey]> = [
  [1.0,  "finish"],
  [0.75, "milestone_75"],
  [0.50, "milestone_50"],
  [0.25, "milestone_25"],
];

function buildProfile(
  trackId?: string | null,
  centerlineJson?: string | null,
  direction?: string | null,
  startFinishS?: number | null,
): TrackProfile {
  const base = trackId === "rect-standard" ? RECT_PROFILE : OVAL_PROFILE;
  let profile = base;
  if (centerlineJson) {
    try {
      const points = JSON.parse(centerlineJson) as [number, number][];
      if (Array.isArray(points) && points.length >= 4) {
        profile = { ...profile, centerline: { ...profile.centerline, points } };
      }
    } catch { /* fall through */ }
  }
  if (direction === "clockwise" || direction === "counterclockwise") {
    profile = { ...profile, direction };
  }
  if (typeof startFinishS === "number" && startFinishS >= 0 && startFinishS <= 1) {
    profile = { ...profile, startFinish: { s: startFinishS } };
  }
  return profile;
}

const LANE_COUNT = 8;
const LANE_HALF_WIDTH = 75;
const LANE_STEP = (LANE_HALF_WIDTH * 2) / (LANE_COUNT + 1);
const LANE_GROUP_S_OFFSET = 0.008;

function computeHorseDisplayParams(
  idx: number,
  roundProgress: number
): { laneOffset: number; displayS: number } {
  const laneIdx = idx % LANE_COUNT;
  const laneGroup = Math.floor(idx / LANE_COUNT);
  const laneOffset = -LANE_HALF_WIDTH + LANE_STEP * (laneIdx + 1);
  const displayS = Math.max(0, Math.min(1, roundProgress + laneGroup * LANE_GROUP_S_OFFSET));
  return { laneOffset, displayS };
}

function formatTokens(n: number): string {
  if (n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

/* ─────────────────────────────────────────────
   GallopingHorse — SVG racehorse silhouette
   Centered at (0,0), horse faces RIGHT at rotation=0.
   Total extent: approx x[-44..+42], y[-42..+35]
───────────────────────────────────────────── */
function GallopingHorse({ color }: { color: string }) {
  return (
    <g>
      {/* Tail */}
      <path d="M -27,5 C -37,-1 -45,3 -43,13 C -41,19 -33,17 -29,9"
        fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
      <path d="M -29,7 C -39,5 -43,15 -39,19"
        fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.7} />

      {/* Body */}
      <ellipse cx={0} cy={0} rx={28} ry={13} fill={color} />
      <ellipse cx={-2} cy={-5} rx={20} ry={7} fill="rgba(255,255,255,0.18)" />

      {/* Back legs — rendered behind front legs */}
      <rect x={-16} y={11} width={6} height={24} rx={3}
        fill={color} transform="rotate(22,-13,11)" />
      <rect x={-24} y={11} width={6} height={24} rx={3}
        fill={color} transform="rotate(-6,-21,11)" />

      {/* Neck */}
      <path d="M 14,-11 C 19,-20 24,-24 29,-22 L 31,-9 C 26,-6 21,-5 17,-7 Z"
        fill={color} />

      {/* Head */}
      <ellipse cx={30} cy={-17} rx={12} ry={9}
        transform="rotate(-15,30,-17)" fill={color} />
      <ellipse cx={29} cy={-18} rx={9} ry={6}
        transform="rotate(-15,29,-18)" fill="rgba(255,255,255,0.1)" />

      {/* Ear */}
      <polygon points="28,-23 33,-31 37,-24" fill={color} />
      <polygon points="29,-24 33,-30 36,-25" fill="rgba(255,255,255,0.28)" />

      {/* Eye */}
      <circle cx={33} cy={-17} r={3} fill="white" />
      <circle cx={34} cy={-17} r={1.5} fill="#111" />
      <circle cx={34.5} cy={-18} r={0.7} fill="white" />

      {/* Nostril */}
      <ellipse cx={40} cy={-10} rx={2.2} ry={1.6}
        transform="rotate(-5,40,-10)" fill="rgba(0,0,0,0.5)" />

      {/* Mane */}
      <path d="M 22,-22 C 18,-29 12,-27 10,-19"
        fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={3} strokeLinecap="round" />
      <path d="M 18,-20 C 14,-25 10,-23 8,-16"
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeLinecap="round" />

      {/* Front legs — rendered in front of body */}
      <rect x={12} y={11} width={6} height={24} rx={3}
        fill={color} transform="rotate(-22,15,11)" />
      <rect x={4} y={11} width={6} height={24} rx={3}
        fill={color} transform="rotate(14,7,11)" />

      {/* Jockey torso */}
      <rect x={-6} y={-30} width={12} height={18} rx={6}
        fill={color} stroke="rgba(255,255,255,0.8)" strokeWidth={1.5} />
      <line x1={-6} y1={-24} x2={6} y2={-24}
        stroke="rgba(255,255,255,0.5)" strokeWidth={2} />

      {/* Jockey helmet */}
      <ellipse cx={0} cy={-35} rx={9} ry={8} fill="#e8e8e8" />
      <path d="M -9,-33 C -8,-30 -4,-28 0,-28 C 4,-28 8,-30 9,-33"
        fill="#d0d0d0" />
      <rect x={-8} y={-37} width={16} height={4} rx={2} fill="#1e40af" opacity={0.9} />

      {/* Jockey arms */}
      <path d="M -6,-22 C -14,-20 -16,-14 -12,-12"
        fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      <path d="M 6,-22 C 12,-18 10,-12 6,-10"
        fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />

      {/* Riding crop */}
      <line x1={6} y1={-10} x2={17} y2={5}
        stroke="#5d3a1a" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

/* ── Live elapsed-time hook ── */
function useElapsedTime(raceStartMs?: number, fallback?: string): string {
  // Initial value must not call Date.now() — SSR and client compute different
  // timestamps, causing a hydration mismatch. The effect sets the real value
  // immediately after mount.
  const [elapsed, setElapsed] = useState<string>(fallback ?? "00:00:00");

  useEffect(() => {
    if (!raceStartMs) return;
    const tick = () => setElapsed(formatElapsedMs(Date.now() - raceStartMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [raceStartMs]);

  return elapsed;
}

function formatElapsedMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/* ─────────────────────────────────────────────
   RaceLiveView — main Client Component
───────────────────────────────────────────── */
export function RaceLiveView({
  snapshot,
  trackId,
  trackCenterlineJson,
  trackDirection,
  trackStartFinishS,
  checkpointCount,
  debug = false,
  embedded = false,
  raceStartMs,
}: {
  snapshot: RaceSnapshot;
  trackId?: string | null;
  trackCenterlineJson?: string | null;
  trackDirection?: string | null;
  trackStartFinishS?: number | null;
  checkpointCount: number;
  debug?: boolean;
  embedded?: boolean;
  raceStartMs?: number;
}) {
  const profile = useMemo(
    () => buildProfile(trackId, trackCenterlineJson, trackDirection, trackStartFinishS),
    [trackId, trackCenterlineJson, trackDirection, trackStartFinishS],
  );
  const runtime = useMemo(() => new TrackRuntime(profile), [profile]);

  const elapsedTime = useElapsedTime(raceStartMs, snapshot.elapsedTime);

  /* ── Auto-refresh: re-fetch server data every 30 s so horse positions stay live ── */
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  useEffect(() => {
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const horsePoses = useMemo<HorsePose[]>(
    () =>
      snapshot.entries.map((entry, idx) => {
        const { laneOffset, displayS } = computeHorseDisplayParams(idx, entry.roundProgress);
        return runtime.computeHorsePose(
          entry.entryId,
          displayS,
          laneOffset,
          snapshot.entries.length - (entry.rank ?? idx)
        );
      }),
    [snapshot.entries, runtime]
  );

  const top3 = useMemo(
    () =>
      [...snapshot.entries]
        .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
        .slice(0, 3),
    [snapshot.entries]
  );

  const activeTop3 = useMemo(
    () =>
      [...snapshot.entries]
        .filter((e) => e.submissionCount > 0)
        .sort((a, b) => b.submissionCount - a.submissionCount)
        .slice(0, 3),
    [snapshot.entries]
  );

  const dynamicCheckpoints = useMemo(() => {
    const n = Math.max(1, checkpointCount);
    return Array.from({ length: n }, (_, i) => ({
      id: `cp-${i + 1}`,
      s: (i + 1) / (n + 1),
      label: `CP ${i + 1}`,
    }));
  }, [checkpointCount]);

  /* ── Riding Message Bubbles + Rank Deltas ── */
  const [bubbles, setBubbles] = useState<Map<string, string>>(new Map());
  const [rankDeltas, setRankDeltas] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const key = `ary_jt_prev_${snapshot.competitionId}`;
    let prev: { entries: { entryId: string; roundProgress: number; rank: number }[] } | null = null;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) prev = JSON.parse(raw);
    } catch { /* ignore parse errors */ }

    // Rank deltas: prevRank - currRank → positive = improved (↑), negative = worsened (↓)
    const newRankDeltas = new Map<string, number>();
    for (const entry of snapshot.entries) {
      const prevE = prev?.entries.find((e) => e.entryId === entry.entryId);
      if (prevE != null && prevE.rank != null) {
        const delta = prevE.rank - (entry.rank ?? 99);
        if (delta !== 0) newRankDeltas.set(entry.entryId, delta);
      }
    }
    setRankDeltas(newRankDeltas);

    const milestoneMap = new Map<string, string>();
    const rankMap = new Map<string, string>();

    for (const entry of snapshot.entries) {
      const prevE = prev?.entries.find((e) => e.entryId === entry.entryId);
      const prevProg = prevE?.roundProgress ?? 0;
      const curr = entry.roundProgress;

      const inNoZone = (profile.noBubbleZones ?? []).some(
        (z) => curr >= z.sStart && curr <= z.sEnd
      );
      if (inNoZone) continue;

      for (const [threshold, phraseKey] of MILESTONES) {
        if (prevProg < threshold && curr >= threshold) {
          milestoneMap.set(entry.entryId, randomFrom(PHRASES[phraseKey]));
          break;
        }
      }

      if (!milestoneMap.has(entry.entryId) && prevE) {
        const currRank = entry.rank ?? 99;
        if (currRank < (prevE.rank ?? 99)) {
          rankMap.set(entry.entryId, randomFrom(PHRASES.overtake));
        } else if (currRank > (prevE.rank ?? 99)) {
          rankMap.set(entry.entryId, randomFrom(PHRASES.drop));
        }
      }
    }

    const next = new Map<string, string>();
    for (const [id, msg] of milestoneMap) {
      if (next.size >= 3) break;
      next.set(id, msg);
    }
    for (const [id, msg] of rankMap) {
      if (next.size >= 3) break;
      next.set(id, msg);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBubbles(next);

    try {
      sessionStorage.setItem(key, JSON.stringify({
        entries: snapshot.entries.map((e) => ({
          entryId: e.entryId,
          roundProgress: e.roundProgress,
          rank: e.rank ?? 99,
        })),
      }));
    } catch { /* quota exceeded, ignore */ }

    if (next.size > 0) {
      const t = setTimeout(() => setBubbles(new Map()), 4000);
      return () => clearTimeout(t);
    }
  }, [snapshot]);

  const violations = snapshot.entries.filter((e) => e.violationPenalty > 0);
  const risks = snapshot.entries.filter(
    (e) => e.riskLevel === "high" || e.riskLevel === "medium"
  );

  const tickerContent = (
    <div className={styles.tickerItems}>
      {violations.map((e) => (
        <span key={`v-${e.entryId}`} className={styles.tickerItem} data-cat="violation">
          【违规】{e.displayName} — 抄袭/恶意提交（-{e.violationPenalty}分）
        </span>
      ))}
      {risks.map((e) => (
        <span key={`r-${e.entryId}`} className={styles.tickerItem} data-cat="risk">
          【{e.riskLevel === "high" ? "高风险" : "中风险"}】{e.displayName} — 进度 {e.progressScore.toFixed(0)} 分 · 质量 {e.qualityScore.toFixed(0)} 分
        </span>
      ))}
      {violations.length === 0 && risks.length === 0 && (
        <span className={styles.tickerItem} data-cat="ok">
          当前无风险或违规记录
        </span>
      )}
    </div>
  );

  const trackSvg = (
    <TrackSVG
      runtime={runtime}
      entries={snapshot.entries}
      poses={horsePoses}
      teamColors={TEAM_COLORS}
      checkpoints={dynamicCheckpoints}
      bubbles={bubbles}
      rankDeltas={rankDeltas}
      debug={debug}
    />
  );

  /* ── Embedded layout ── */
  if (embedded) {
    return (
      <div className={styles.jumbotronEmbedded}>
        {/* Thin header bar */}
        <div className={styles.embeddedHeader}>
          <span className={styles.embeddedBrand}>🏇 {snapshot.title}</span>
          <span className={styles.liveBadge}>● LIVE</span>
          <span className={styles.embeddedPhaseChip}>{snapshot.currentPhase}</span>
          <span className={styles.embeddedElapsed} suppressHydrationWarning>⏱ {elapsedTime}</span>
        </div>

        {/* Track SVG */}
        <div className={styles.embeddedTrackWrap}>
          {snapshot.entries.length === 0 ? (
            <div className={styles.emptyTrack}>
              暂无进度数据。Organizer 发起进度评测后马匹将出现在赛道上。
            </div>
          ) : (
            trackSvg
          )}
        </div>

        {/* Compact stats row */}
        <div className={styles.embeddedStats}>
          {/* TOP 3 */}
          <div className={styles.embeddedTop3}>
            <span className={styles.embeddedSectionLabel}>实时领跑</span>
            <div className={styles.embeddedTop3List}>
              {top3.map((e, i) => {
                const idx = snapshot.entries.indexOf(e);
                const delta = rankDeltas.get(e.entryId);
                return (
                  <span key={e.entryId} className={styles.embeddedTop3Item}>
                    <span>{["🥇", "🥈", "🥉"][i]}</span>
                    <span
                      className={styles.embeddedDot}
                      style={{ background: TEAM_COLORS[idx % TEAM_COLORS.length] }}
                    />
                    <span className={styles.embeddedTeamName}>{e.displayName}</span>
                    {delta != null && delta !== 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: delta > 0 ? "#4ade80" : "#f87171" }}>
                        {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                      </span>
                    )}
                    <span className={styles.embeddedScore}>{e.progressScore.toFixed(0)}</span>
                  </span>
                );
              })}
              {top3.length === 0 && <span className={styles.embeddedEmpty}>暂无数据</span>}
            </div>
          </div>

          {/* Mini-map */}
          <div className={styles.embeddedMiniMapCol}>
            <span className={styles.embeddedSectionLabel}>赛道概览</span>
            <MiniMap
              runtime={runtime}
              entries={snapshot.entries}
              poses={horsePoses}
              teamColors={TEAM_COLORS}
            />
          </div>

          {/* KPI cards */}
          <div className={styles.embeddedKpi}>
            <div className={styles.embeddedKpiItem}>
              <span className={styles.embeddedKpiVal}>{snapshot.kpi.completionRate}%</span>
              <span className={styles.embeddedKpiLbl}>平均进度</span>
            </div>
            <div className={styles.embeddedKpiItem}>
              <span className={styles.embeddedKpiVal}>{snapshot.kpi.activeRiders}</span>
              <span className={styles.embeddedKpiLbl}>活跃骑手</span>
            </div>
            <div className={styles.embeddedKpiItem}>
              <span
                className={styles.embeddedKpiVal}
                style={snapshot.kpi.riskCount > 0 ? { color: "#f97316" } : undefined}
              >
                {snapshot.kpi.riskCount}
              </span>
              <span className={styles.embeddedKpiLbl}>风险队伍</span>
            </div>
            <div className={styles.embeddedKpiItem}>
              <span
                className={styles.embeddedKpiVal}
                style={snapshot.kpi.violationCount > 0 ? { color: "#ef4444" } : undefined}
              >
                {snapshot.kpi.violationCount}
              </span>
              <span className={styles.embeddedKpiLbl}>违规标记</span>
            </div>
            <div className={styles.embeddedKpiItem}>
              <span className={styles.embeddedKpiVal}>{formatTokens(snapshot.kpi.totalTokens)}</span>
              <span className={styles.embeddedKpiLbl}>总 Token</span>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className={styles.ticker}>
          <span className={styles.tickerLabel}>⚠ 注意事项</span>
          <div className={styles.tickerScroll}>{tickerContent}</div>
        </div>
      </div>
    );
  }

  /* ── Full-screen layout (original) ── */
  return (
    <div className={styles.jumbotron}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.brand}>{snapshot.title}</span>
          <span className={styles.subtitle}>Agent Racing Yard · GRS 001</span>
        </div>
        <div className={styles.headerCenter}>
          <span className={styles.liveBadge}>● LIVE</span>
          <span className={styles.pill}>ROUND {snapshot.currentRound}</span>
          <span className={styles.pill}>{snapshot.currentPhase}</span>
          <span className={styles.elapsed} suppressHydrationWarning>⏱ {elapsedTime}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.riders}>
            👥 {snapshot.kpi.activeRiders} / {snapshot.kpi.onlineRiders}
          </span>
        </div>
      </header>

      {/* ── KPI Strip ── */}
      <div className={styles.kpiStrip}>
        <KPICard label="平均进度" value={`${snapshot.kpi.completionRate}%`} />
        <KPICard label="活跃骑手" value={`${snapshot.kpi.activeRiders} 位`} />
        <KPICard label="风险队伍" value={String(snapshot.kpi.riskCount)} accent="orange" />
        <KPICard label="违规标记" value={String(snapshot.kpi.violationCount)} accent="red" />
        <KPICard label="总 Token" value={formatTokens(snapshot.kpi.totalTokens)} />
      </div>

      {/* ── Main ── */}
      <div className={styles.mainContent}>
        {/* Left rail */}
        <aside className={styles.leftRail}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>实时 TOP 3</div>
            {top3.length === 0 && <p className={styles.empty}>暂无数据</p>}
            {top3.map((entry) => {
              const idx = snapshot.entries.indexOf(entry);
              return (
                <Top3Item
                  key={entry.entryId}
                  entry={entry}
                  color={TEAM_COLORS[idx % TEAM_COLORS.length]}
                  rankDelta={rankDeltas.get(entry.entryId)}
                />
              );
            })}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>活跃骑手 TOP 3</div>
            {activeTop3.length === 0 && <p className={styles.empty}>暂无提交记录</p>}
            {activeTop3.map((entry, i) => {
              const idx = snapshot.entries.indexOf(entry);
              return (
                <div key={entry.entryId} className={styles.top3Item}>
                  <span className={styles.top3Medal}>{["🥇", "🥈", "🥉"][i]}</span>
                  <span
                    className={styles.top3Dot}
                    style={{ background: TEAM_COLORS[idx % TEAM_COLORS.length] }}
                  />
                  <span className={styles.top3Name}>{entry.displayName}</span>
                  <span className={styles.top3Score}>{entry.submissionCount} 次</span>
                </div>
              );
            })}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>赛道小地图</div>
            <div className={styles.miniMapWrap}>
              <MiniMap
                runtime={runtime}
                entries={snapshot.entries}
                poses={horsePoses}
                teamColors={TEAM_COLORS}
              />
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>参赛队伍</div>
            {snapshot.entries.map((entry, idx) => (
              <div key={entry.entryId} className={styles.legendRow}>
                <span
                  className={styles.legendDot}
                  style={{ background: TEAM_COLORS[idx % TEAM_COLORS.length] }}
                />
                <span className={styles.legendName}>{entry.displayName}</span>
                {entry.violationPenalty > 0 && (
                  <span className={styles.violationBadge} title="抄袭/恶意提交">⚠</span>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Track Stage */}
        <div className={styles.trackStage}>
          {snapshot.entries.length === 0 ? (
            <div className={styles.emptyTrack}>
              暂无进度数据。Organizer 发起进度评测后马匹将出现在赛道上。
            </div>
          ) : (
            trackSvg
          )}
        </div>
      </div>

      {/* ── Bottom Ticker ── */}
      <div className={styles.ticker}>
        <span className={styles.tickerLabel}>⚠ 注意事项</span>
        <div className={styles.tickerScroll}>{tickerContent}</div>
      </div>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span>{snapshot.title}</span>
        <span>Agent Racing Yard · ARY GRS 001</span>
        <span>当前阶段：{snapshot.currentPhase}</span>
        <span>● LIVE</span>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function KPICard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "orange" | "red";
}) {
  return (
    <div className={styles.kpiCard}>
      <span
        className={styles.kpiValue}
        style={
          accent === "red"
            ? { color: "#ef4444" }
            : accent === "orange"
            ? { color: "#f97316" }
            : undefined
        }
      >
        {value}
      </span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  );
}

function Top3Item({
  entry,
  color,
  rankDelta,
}: {
  entry: RacingEntrySnapshot;
  color: string;
  rankDelta?: number;
}) {
  const medal = ["🥇", "🥈", "🥉"][((entry.rank ?? 1) - 1) % 3] ?? "🏅";
  return (
    <div className={styles.top3Item}>
      <span className={styles.top3Medal}>{medal}</span>
      <span className={styles.top3Dot} style={{ background: color }} />
      <span className={styles.top3Name}>{entry.displayName}</span>
      {rankDelta != null && rankDelta !== 0 && (
        <span style={{ fontSize: 11, fontWeight: 700, color: rankDelta > 0 ? "#4ade80" : "#f87171" }}>
          {rankDelta > 0 ? `↑${rankDelta}` : `↓${Math.abs(rankDelta)}`}
        </span>
      )}
      <span className={styles.top3Score}>{entry.progressScore.toFixed(1)}</span>
    </div>
  );
}

/* ── Mini-map ── */
function MiniMap({
  runtime,
  entries,
  poses,
  teamColors,
}: {
  runtime: TrackRuntime;
  entries: RacingEntrySnapshot[];
  poses: HorsePose[];
  teamColors: string[];
}) {
  const { width, height } = runtime.profile.viewBox;
  const outerD = useMemo(() => runtime.getPathD(90), [runtime]);
  const innerD = useMemo(() => runtime.getPathD(-90), [runtime]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={width} height={height} fill="#0a0e1a" />
      <path d={outerD} fill="#1a2a1a" />
      <path d={innerD} fill="#0f1f0f" />
      <path d={outerD} fill="none" stroke="#00d4ff" strokeWidth={12} opacity={0.2} />
      <path d={outerD} fill="none" stroke="#00d4ff" strokeWidth={4} opacity={0.85} />
      <path d={innerD} fill="none" stroke="#00d4ff" strokeWidth={4} opacity={0.85} />
      {poses.map((pose) => {
        const idx = entries.findIndex((e) => e.entryId === pose.entryId);
        if (idx === -1) return null;
        const entry = entries[idx];
        const color = teamColors[idx % teamColors.length];
        return (
          <g key={pose.entryId}>
            <circle cx={pose.x} cy={pose.y} r={50} fill={color} opacity={0.3} />
            <circle cx={pose.x} cy={pose.y} r={32} fill={color} stroke="white" strokeWidth={6} />
            <text x={pose.x} y={pose.y + 11} textAnchor="middle" fill="white" fontSize={26} fontWeight="bold">
              {entry.rank}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Advertising board positions ── */
const AD_CONFIGS = [
  { s: 0.07, text: "DevCompass", color: "#e74c3c" },
  { s: 0.32, text: "ARY 2026",   color: "#2980b9" },
  { s: 0.57, text: "AI Racing",  color: "#27ae60" },
  { s: 0.82, text: "GRS 001",    color: "#f39c12" },
] as const;

/* ── TrackSVG: race track with stadium background ── */
function TrackSVG({
  runtime,
  entries,
  poses,
  teamColors,
  checkpoints,
  bubbles,
  rankDeltas,
  debug = false,
}: {
  runtime: TrackRuntime;
  entries: RacingEntrySnapshot[];
  poses: HorsePose[];
  teamColors: string[];
  checkpoints: Array<{ id: string; s: number; label: string }>;
  bubbles: Map<string, string>;
  rankDeltas: Map<string, number>;
  debug?: boolean;
}) {
  const uid = useId().replace(/:/g, "_");
  const { width, height } = runtime.profile.viewBox;

  const outerD = useMemo(() => runtime.getPathD(90), [runtime]);
  const innerD = useMemo(() => runtime.getPathD(-90), [runtime]);

  const sfGeo = useMemo(
    () => runtime.checkpointGeometry(runtime.profile.startFinish.s),
    [runtime]
  );

  const cpGeos = useMemo(
    () =>
      checkpoints.map((cp) => ({
        ...cp,
        geo: runtime.checkpointGeometry(cp.s),
      })),
    [runtime, checkpoints]
  );

  /* Advertising board positions on inner fence */
  const adBoards = useMemo(
    () =>
      AD_CONFIGS.map(({ s, text, color }) => {
        const { pos, normal, tangent } = runtime.sampleAt(s);
        return {
          x: pos.x - normal.x * 104,
          y: pos.y - normal.y * 104,
          angle: Math.atan2(tangent.y, tangent.x) * (180 / Math.PI),
          text,
          color,
        };
      }),
    [runtime]
  );

  /* Lane guide paths — subtle cyan separators */
  const laneGuidePaths = useMemo(
    () =>
      Array.from({ length: LANE_COUNT - 1 }, (_, i) => {
        const offset = -LANE_HALF_WIDTH + LANE_STEP * (i + 1.5);
        return runtime.getPathD(offset, 120);
      }),
    [runtime]
  );

  /* Debug geometry */
  const debugCenterlineDots = useMemo(() => {
    if (!debug) return [];
    return Array.from({ length: 51 }, (_, i) => runtime.sampleAt(i / 50).pos);
  }, [runtime, debug]);

  const debugLaneEdgeOuterD = useMemo(() => debug ? runtime.getPathD(LANE_HALF_WIDTH, 120) : "", [runtime, debug]);
  const debugLaneEdgeInnerD = useMemo(() => debug ? runtime.getPathD(-LANE_HALF_WIDTH, 120) : "", [runtime, debug]);
  const debugCenterD = useMemo(() => debug ? runtime.getPathD(0, 120) : "", [runtime, debug]);
  const debugLaneDs = useMemo(() => {
    if (!debug) return [];
    return Array.from({ length: LANE_COUNT }, (_, i) => {
      const offset = -LANE_HALF_WIDTH + LANE_STEP * (i + 1);
      return runtime.getPathD(offset, 120);
    });
  }, [runtime, debug]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={styles.trackSvg}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Track ring mask — true donut shape, eliminates crack rendering artifacts */}
        <mask id={`${uid}mask`}>
          <path d={outerD} fill="white" />
          <path d={innerD} fill="black" />
        </mask>
        {/* Clip inner field */}
        <clipPath id={`${uid}innerClip`}>
          <path d={innerD} />
        </clipPath>
        {/* Edge vignette */}
        <radialGradient id={`${uid}vign`} cx="50%" cy="55%" r="62%">
          <stop offset="55%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
        </radialGradient>
      </defs>

      {/* ── BACKGROUND: stadium photo ── */}
      <image
        href="/jumbotron底图.jpg"
        x={0} y={0}
        width={width} height={height}
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Edge vignette — darkens corners/edges, makes track pop */}
      <rect x={0} y={0} width={width} height={height} fill={`url(#${uid}vign)`} />

      {/* ── TRACK SURFACE: sandy/dirt ring via mask (crack-free donut) ── */}
      <rect x={0} y={0} width={width} height={height}
        fill="#c4924a"
        mask={`url(#${uid}mask)`}
        opacity={0.85}
      />

      {/* Inner field — subtle green overlay to deepen the grass */}
      <rect x={0} y={0} width={width} height={height}
        fill="rgba(10,55,10,0.28)"
        clipPath={`url(#${uid}innerClip)`}
      />

      {/* Inner field ARY watermark */}
      <text
        x={width / 2}
        y={height / 2 + 60}
        textAnchor="middle"
        fill="rgba(255,255,255,0.04)"
        fontSize={220}
        fontWeight="900"
        style={{ userSelect: "none", fontFamily: "sans-serif" }}
      >
        ARY
      </text>

      {/* ── LANE GUIDE LINES ── */}
      {laneGuidePaths.map((d, i) => (
        <path key={`lg-${i}`} d={d} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1.5} />
      ))}

      {/* ── TRACK BOUNDARY RAILS ── */}
      <path d={outerD} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={6} />
      <path d={outerD} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={2.5} />
      <path d={innerD} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={6} />
      <path d={innerD} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={2.5} />

      {/* ── ADVERTISING BOARDS on inner rail ── */}
      {adBoards.map((b, i) => (
        <g key={`ad-${i}`} transform={`rotate(${b.angle.toFixed(1)},${b.x.toFixed(1)},${b.y.toFixed(1)})`}>
          <rect x={b.x - 52} y={b.y - 11} width={104} height={22} rx={3}
            fill="rgba(10,20,40,0.88)" stroke={b.color} strokeWidth={1.5} />
          <text
            x={b.x} y={b.y + 5}
            textAnchor="middle"
            fill={b.color}
            fontSize={13}
            fontWeight="700"
            style={{ userSelect: "none" }}
          >
            {b.text}
          </text>
        </g>
      ))}

      {/* ── CHECKPOINTS ── */}
      {cpGeos.map((cp) => {
        const { pos, normal } = cp.geo;
        const x1 = pos.x - normal.x * 90;
        const y1 = pos.y - normal.y * 90;
        const x2 = pos.x + normal.x * 90;
        const y2 = pos.y + normal.y * 90;
        return (
          <g key={cp.id}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth={10} opacity={0.15} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth={2.5} opacity={0.9} strokeDasharray="10 5" />
            <circle cx={x1} cy={y1} r={8} fill="#f59e0b" opacity={0.9} />
            <circle cx={x2} cy={y2} r={8} fill="#f59e0b" opacity={0.9} />
            <text
              x={pos.x - normal.y * 112}
              y={pos.y + normal.x * 112}
              textAnchor="middle"
              fill="#fbbf24"
              fontSize={18}
              fontWeight="700"
            >
              {cp.label}
            </text>
          </g>
        );
      })}

      {/* ── START / FINISH LINE ── */}
      {(() => {
        const { pos, normal } = sfGeo;
        const x1 = pos.x - normal.x * 90;
        const y1 = pos.y - normal.y * 90;
        const x2 = pos.x + normal.x * 90;
        const y2 = pos.y + normal.y * 90;
        return (
          <g>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={14} opacity={0.2} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={4} opacity={0.95} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth={4} opacity={0.5} strokeDasharray="12 12" />
            <text
              x={pos.x - normal.y * 115}
              y={pos.y + normal.x * 115}
              textAnchor="middle"
              fill="white"
              fontSize={16}
              fontWeight="700"
            >
              S/F
            </text>
          </g>
        );
      })()}

      {/* ── DEBUG OVERLAY ── */}
      {debug && (
        <g>
          <path d={debugCenterD} fill="none" stroke="cyan" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7} />
          <path d={debugLaneEdgeOuterD} fill="none" stroke="#00ff88" strokeWidth={1} strokeDasharray="8 4" opacity={0.55} />
          <path d={debugLaneEdgeInnerD} fill="none" stroke="#00ff88" strokeWidth={1} strokeDasharray="8 4" opacity={0.55} />
          {debugLaneDs.map((d, i) => (
            <path key={`lane-${i}`} d={d} fill="none" stroke="white" strokeWidth={0.5} strokeDasharray="3 8" opacity={0.22} />
          ))}
          {debugCenterlineDots.map((pos, i) => (
            <circle key={`cdot-${i}`} cx={pos.x} cy={pos.y} r={3.5} fill="cyan" opacity={0.65} />
          ))}
        </g>
      )}

      {/* ── HORSE MARKERS ── */}
      {[...poses]
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((pose) => {
          const entry = entries.find((e) => e.entryId === pose.entryId);
          if (!entry) return null;
          const idx = entries.indexOf(entry);
          const color = teamColors[idx % teamColors.length];
          const isStale = entry.status === "stale";
          const isFinished = entry.status === "finished";
          const isPitStop = entry.status === "pit_stop";
          const riskColor = RISK_COLORS[entry.riskLevel];
          const hasViolation = entry.violationPenalty > 0;
          const bubble = bubbles.get(entry.entryId);
          const horseColor = isStale ? "#555566" : color;

          return (
            <g key={pose.entryId} opacity={isStale ? 0.4 : 1}>

              {/* Risk ring — upright, behind horse */}
              {entry.riskLevel !== "none" && (
                <>
                  <circle cx={pose.x} cy={pose.y} r={62} fill="none"
                    stroke={riskColor} strokeWidth={8} opacity={0.12} />
                  <circle cx={pose.x} cy={pose.y} r={58} fill="none"
                    stroke={riskColor} strokeWidth={2.5} opacity={0.8} strokeDasharray="8 4" />
                </>
              )}

              {/* Pit stop ring */}
              {isPitStop && (
                <circle cx={pose.x} cy={pose.y} r={66} fill="none"
                  stroke="#f97316" strokeWidth={3} strokeDasharray="8 4" opacity={0.9} />
              )}

              {/* HORSE SILHOUETTE — rotates with direction of travel */}
              <g
                transform={`translate(${pose.x.toFixed(1)},${pose.y.toFixed(1)}) rotate(${pose.rotation.toFixed(1)})`}
                style={{
                  filter: isFinished
                    ? "drop-shadow(0 0 14px #facc15) drop-shadow(0 0 6px #fbbf24)"
                    : `drop-shadow(0 0 8px ${horseColor}cc) drop-shadow(0 0 3px ${horseColor})`,
                }}
              >
                <GallopingHorse color={horseColor} />
              </g>

              {/* Rank badge — upright, centered on horse body */}
              <circle cx={pose.x} cy={pose.y} r={15} fill={color} stroke="white" strokeWidth={2.5} opacity={0.92} />
              <text x={pose.x} y={pose.y + 5} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">
                {entry.rank}
              </text>

              {/* Rank delta indicator (↑/↓) */}
              {(() => {
                const delta = rankDeltas.get(entry.entryId);
                if (!delta) return null;
                const up = delta > 0;
                return (
                  <text
                    x={pose.x + 22}
                    y={pose.y + 5}
                    textAnchor="middle"
                    fill={up ? "#4ade80" : "#f87171"}
                    fontSize={15}
                    fontWeight="bold"
                    style={{ filter: `drop-shadow(0 0 5px ${up ? "#4ade80" : "#f87171"})` }}
                  >
                    {up ? `↑${delta}` : `↓${Math.abs(delta)}`}
                  </text>
                );
              })()}

              {/* Violation badge */}
              {hasViolation && (
                <>
                  <circle cx={pose.x + 34} cy={pose.y - 34} r={13} fill="#ef4444" stroke="white" strokeWidth={2} />
                  <text x={pose.x + 34} y={pose.y - 29} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">!</text>
                </>
              )}

              {/* Pit stop indicator badge */}
              {isPitStop && (
                <>
                  <circle cx={pose.x - 34} cy={pose.y - 34} r={13} fill="#f97316" stroke="white" strokeWidth={2} />
                  <text x={pose.x - 34} y={pose.y - 29} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">⚙</text>
                </>
              )}

              {/* Team name label */}
              <rect x={pose.x - 54} y={pose.y + 36} width={108} height={22} rx={5} fill="rgba(0,0,0,0.82)" />
              <text x={pose.x} y={pose.y + 51} textAnchor="middle" fill="white" fontSize={13}>
                {entry.displayName.length > 9
                  ? entry.displayName.slice(0, 8) + "…"
                  : entry.displayName}
              </text>

              {/* Progress % */}
              <text x={pose.x} y={pose.y + 73} textAnchor="middle" fill="#7dd3fc" fontSize={11}>
                {(entry.roundProgress * 100).toFixed(0)}%
              </text>

              {/* Debug info */}
              {debug && (
                <>
                  <text x={pose.x} y={pose.y + 88} textAnchor="middle" fill="cyan" fontSize={10}>
                    s={pose.s.toFixed(3)}
                  </text>
                  <circle
                    cx={pose.x} cy={pose.y} r={28}
                    fill="none" stroke="cyan" strokeWidth={1} strokeDasharray="4 3" opacity={0.75}
                  />
                  {entry.status === "stale" && (
                    <text x={pose.x} y={pose.y - 92} textAnchor="middle" fill="#f97316" fontSize={13} fontWeight="bold">
                      STALE
                    </text>
                  )}
                </>
              )}

              {/* Riding Message Bubble */}
              {bubble && (
                <g className={styles.bubble}>
                  <rect
                    x={pose.x - 46}
                    y={pose.y - 88}
                    width={92}
                    height={32}
                    rx={8}
                    fill="white"
                    opacity={0.96}
                  />
                  <polygon
                    points={`${pose.x - 8},${pose.y - 56} ${pose.x + 8},${pose.y - 56} ${pose.x},${pose.y - 42}`}
                    fill="white"
                    opacity={0.96}
                  />
                  <text
                    x={pose.x}
                    y={pose.y - 66}
                    textAnchor="middle"
                    fill="#111827"
                    fontSize={16}
                    fontWeight="bold"
                  >
                    {bubble}
                  </text>
                </g>
              )}
            </g>
          );
        })}
    </svg>
  );
}
