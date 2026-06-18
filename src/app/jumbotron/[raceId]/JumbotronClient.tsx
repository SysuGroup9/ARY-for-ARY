"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { RaceSnapshot, TrackProfile } from "@/lib/jumbotron/track-runtime/types";
import { samplePath, sampleAt, tangentAngle, normal } from "@/lib/jumbotron/track-runtime/path-sampler";
import { assignLane } from "@/lib/jumbotron/track-runtime/lane-manager";
import { resolveMotionState } from "@/lib/jumbotron/track-runtime/animation-state";

interface Props {
  snapshot: RaceSnapshot;
  trackProfile: TrackProfile;
}

const BASE_LERP = 0.03; // 基础插值速度

export default function JumbotronClient({ snapshot, trackProfile }: Props) {
  const [debug, setDebug] = useState(false);
  const [elapsed, setElapsed] = useState(snapshot.competition.elapsedTime);
  const [kpiDetail, setKpiDetail] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<string | null>(null); // drill-down 面板
  const [systemTime, setSystemTime] = useState(snapshot.competition.systemTime);

  // -- s-axis 动画状态 --
  const [displayS, setDisplayS] = useState<Record<string, number>>({});
  const rafRef = useRef<number>(0);

  const sorted = useMemo(
    () => [...snapshot.entries].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)),
    [snapshot.entries],
  );

  // 目标 s 值
  const targetS = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of sorted) map[e.entryId] = Math.max(0, Math.min(1, e.roundProgress));
    return map;
  }, [sorted]);

  // 初始化 displayS
  useEffect(() => {
    setDisplayS((prev) => {
      const next: Record<string, number> = {};
      for (const e of sorted) {
        const previous = prev[e.entryId];
        next[e.entryId] = previous ?? (targetS[e.entryId] ?? 0.5);
      }
      return next;
    });
  }, [sorted, targetS]);

  // s-axis 补间动画循环 —— 每匹马速度略有差异
  const animateRef = useRef<() => void>(() => {});
  animateRef.current = useCallback(() => {
    setDisplayS((prev) => {
      let changed = false;
      const next: Record<string, number> = { ...prev };
      for (const id of Object.keys(targetS)) {
        const cur = prev[id] ?? 0;
        const tgt = targetS[id] ?? 0.5;
        const diff = tgt - cur;
        if (Math.abs(diff) < 0.0005) { next[id] = tgt; continue; }
        changed = true;
        // 每匹马速度在 0.02~0.05 之间随机，模拟不同的追赶节奏
        const seed = id.charCodeAt(id.length - 1) || 0;
        const speed = BASE_LERP * (0.7 + (seed % 10) / 10);
        next[id] = cur + diff * speed;
      }
      return changed ? next : prev;
    });
    rafRef.current = requestAnimationFrame(animateRef.current);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetS]);

  // 每 15 秒微扰所有马位置，制造"实时竞速"感
  useEffect(() => {
    const jitter = setInterval(() => {
      setDisplayS((prev) => {
        if (Object.keys(prev).length === 0) return prev;
        const next: Record<string, number> = {};
        for (const id of Object.keys(prev)) {
          next[id] = Math.max(0, Math.min(1, prev[id] + (Math.random() - 0.5) * 0.006));
        }
        return next;
      });
    }, 15000);
    return () => clearInterval(jitter);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animateRef.current);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // key bindings
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "d" || e.key === "D") setDebug((v) => !v); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // timer
  useEffect(() => {
    if (snapshot.competition.liveStatus !== "live") return;
    const i = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [snapshot.competition.liveStatus]);

  useEffect(() => {
    if (snapshot.competition.liveStatus !== "live") return;
    const i = setInterval(() => setSystemTime(new Date().toISOString()), 1000);
    return () => clearInterval(i);
  }, [snapshot.competition.liveStatus]);

  const { competition, entries, kpis, messages, attentionItems } = snapshot;
  const path = useMemo(
    () => samplePath(trackProfile.centerline.points, trackProfile.centerline.closed, 20),
    [trackProfile],
  );

  // 用 displayS（插值后的 s）计算姿势
  const poses = useMemo(() => {
    return sorted.map((entry) => {
      const rank = entry.rank ?? sorted.indexOf(entry) + 1;
      const lane = assignLane(rank, trackProfile.lanes.length);
      const s = displayS[entry.entryId] ?? entry.roundProgress;
      const sampled = sampleAt(path, Math.max(0, Math.min(1, s)));
      if (!sampled) return null;
      const n = normal(sampled.tangent);
      const offset = trackProfile.lanes[lane.index]?.offset ?? 0;
      const state = resolveMotionState(entry.status, entry.updatedAt);
      return {
        entryId: entry.entryId,
        x: sampled.point.x + n.x * offset,
        y: sampled.point.y + n.y * offset,
        rotation: (tangentAngle(sampled.tangent) * 180) / Math.PI,
        s, laneId: lane.id, state,
        entry, rank,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [sorted, trackProfile, path, displayS]);

  const top3 = entries.filter((e) => e.rank && e.rank <= 3).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const activeRiders = [...entries]
    .sort((a, b) => (b.submissionCount ?? 0) - (a.submissionCount ?? 0) || (a.rank ?? 999) - (b.rank ?? 999))
    .slice(0, 3);

  return (
    <div className={debug ? "jt jt-debug" : "jt"}>
      {/* ====== Header ====== */}
      <header className="jt-hdr">
        <div className="jt-hdr__left">
          <span className="jt-hdr__brand">ARY Racing</span>
          <span className="jt-hdr__phase">{competition.currentPhase}</span>
        </div>
        <div className="jt-hdr__center">
          <span className="jt-hdr__live">{competition.liveStatus === "live" ? "● LIVE" : competition.liveStatus === "finished" ? "FINISHED" : "即将开始"}</span>
        </div>
        <div className="jt-hdr__right">
          <span>⏱ {formatTime(elapsed)}</span>
          <span className="jt-hdr__online">在线 {kpis.onlineRiders}/{entries.length}</span>
        </div>
      </header>

      {/* ====== KPI ====== */}
      <div className="jt-kpis">
        <div className="jt-kpi jt-kpi--click" onClick={() => setKpiDetail(kpiDetail === "progress" ? null : "progress")}><b>{kpis.completionRate}%</b><small>完成度</small></div>
        <div className="jt-kpi jt-kpi--click" onClick={() => setKpiDetail(kpiDetail === "tokens" ? null : "tokens")}><b>{fmtNum(kpis.totalTokens)}</b><small>Tokens</small></div>
        <div className="jt-kpi jt-kpi--click" onClick={() => setKpiDetail(kpiDetail === "ca" ? null : "ca")}><b>{kpis.codexShare}%</b><small>Codex</small></div>
        <div className="jt-kpi jt-kpi--click" onClick={() => setKpiDetail(kpiDetail === "ca" ? null : "ca")}><b>{kpis.claudeShare}%</b><small>Claude</small></div>
        {kpis.riskCount > 0 && <div className="jt-kpi jt-kpi--warn jt-kpi--click" onClick={() => setKpiDetail(kpiDetail === "risk" ? null : "risk")}><b>{kpis.riskCount}</b><small>风险</small></div>}
      </div>

      {/* ====== KPI Detail Panel ====== */}
      {kpiDetail && (
        <div className="jt-kpi-detail">
          {kpiDetail === "progress" && (
            <table><thead><tr><th>队伍</th><th>总分</th><th>进度</th><th>任务分</th><th>Token分</th><th>对话分</th></tr></thead><tbody>
              {sorted.map((e) => (
                <tr key={e.entryId}><td>{e.projectName}</td><td>{entries.find(x => x.entryId === e.entryId)?.costTokens ?? "-"}</td><td>{Math.round(e.roundProgress*100)}%</td><td>-</td><td>-</td><td>-</td></tr>
              ))}
            </tbody></table>
          )}
          {kpiDetail === "tokens" && (
            <table><thead><tr><th>队伍</th><th>Tokens</th><th>估算费用</th><th>CA</th></tr></thead><tbody>
              {sorted.map((e) => (
                <tr key={e.entryId}><td>{e.projectName}</td><td>{e.costTokens ?? 0}</td><td>${((e.costTokens ?? 0) * 0.0001).toFixed(2)}</td><td>{e.caProvider.toUpperCase()}</td></tr>
              ))}
            </tbody></table>
          )}
          {kpiDetail === "ca" && (
            <table><thead><tr><th>队伍</th><th>CA 类型</th><th>Tokens</th></tr></thead><tbody>
              {sorted.map((e) => (
                <tr key={e.entryId}><td>{e.projectName}</td><td>{e.caProvider.toUpperCase()}</td><td>{e.costTokens ?? 0}</td></tr>
              ))}
            </tbody></table>
          )}
          {kpiDetail === "risk" && (
            <table><thead><tr><th>队伍</th><th>风险等级</th><th>违规数</th><th>说明</th></tr></thead><tbody>
              {sorted.map((e) => (
                <tr key={e.entryId}><td>{e.projectName}</td><td>{e.riskLevel}</td><td>{e.violationCount}</td><td>{e.violationCount > 0 ? "检测到诱导词" : "-"}</td></tr>
              ))}
            </tbody></table>
          )}
        </div>
      )}

      {/* ====== Main ====== */}
      <div className="jt-main">
        {/* TOP3 */}
        <div className="jt-top3">
          {top3.map((e) => {
            const delta = e.rankDelta ?? 0;
            return (
              <div key={e.entryId} className={`jt-top3__card ${e.rank === 1 ? "jt-top3--gold" : e.rank === 2 ? "jt-top3--silver" : ""}`} onClick={() => setDetailEntry(detailEntry === e.entryId ? null : e.entryId)} style={{cursor:"pointer"}}>
                <span className="jt-top3__rank">#{e.rank} {delta > 0 ? <span style={{color:"#50b86c",fontSize:14}}>↑</span> : delta < 0 ? <span style={{color:"#c34e36",fontSize:14}}>↓</span> : ""}</span>
                <span className="jt-top3__name">{e.projectName}</span>
                <span className="jt-top3__rider">{e.riderName} · {e.score?.toFixed(1) ?? "-"}分</span>
                <span className="jt-top3__ca">{e.caProvider.toUpperCase()}</span>
              </div>
            );
          })}
          {/* Entry Legend */}
          <div className="jt-active">
            <div className="jt-active__title">活跃骑手 TOP3</div>
            {activeRiders.map((e, index) => (
              <div key={e.entryId} className="jt-active__item">
                <span>#{index + 1} {e.projectName.slice(0, 6)}</span>
                <b>{e.submissionCount ?? 0} 次</b>
              </div>
            ))}
          </div>
          <div className="jt-legend">
            {sorted.slice(0, 8).map((e) => {
              const clr = teamColors[(e.rank ?? sorted.indexOf(e)+1) % teamColors.length];
              const emj = teamEmoji[(e.rank ?? sorted.indexOf(e)+1) % teamEmoji.length];
              return <span key={e.entryId} className="jt-legend__item"><span style={{color:clr}}>{emj}</span> {e.projectName.slice(0,6)}</span>;
            })}
          </div>
        </div>

        {/* Track */}
        <div className="jt-track">
          {trackProfile.background?.src && (
            <img src={trackProfile.background.src} alt="" className="jt-track__bg" />
          )}
          <svg viewBox={`0 0 ${trackProfile.viewBox.w} ${trackProfile.viewBox.h}`} className="jt-track__svg">
            {/* Debug */}
            {debug && (
              <>
                <polyline points={path.points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="rgba(195,78,54,0.5)" strokeWidth={3}/>
                {path.points.filter((_, i) => i % 8 === 0).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill="#c34e36"/>)}
              </>
            )}

            {/* Horses */}
            {poses.map((p) => {
              const sprint = p.state === "sprinting";
              const stale = p.state === "stale";
              const clr = teamColors[p.rank % teamColors.length];
              const emj = teamEmoji[p.rank % teamEmoji.length];
              const msg = p.entry.lastMessage?.summary?.slice(0, 14) ?? "";
              const msgW = msg ? Math.max(80, msg.length * 12 + 28) : 0;
              return (
                <g key={p.entryId} transform={`translate(${p.x}, ${p.y})`} style={{cursor:"pointer"}} onClick={() => setDetailEntry(detailEntry === p.entryId ? null : p.entryId)}>
                  {/* Emoji */}
                  <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={sprint ? 62 : 54} opacity={stale ? 0.25 : 1}>
                    {stale ? "💤" : emj}
                  </text>
                  {/* Color ring */}
                  <circle cx={0} cy={0} r={56} fill="none" stroke={stale ? "#999" : clr} strokeWidth={stale ? 2 : 5} opacity={stale ? 0.3 : 1}/>
                  {sprint && !stale && <circle cx={0} cy={0} r={66} fill="none" stroke={clr} strokeWidth={7}><animate attributeName="opacity" values="0.4;1;0.4" dur="0.4s" repeatCount="indefinite"/></circle>}
                  {/* Rank */}
                  <circle cx={44} cy={-40} r={18} fill={p.rank <= 3 ? clr : "#555"} stroke="#fff" strokeWidth={3}/>
                  <text x={44} y={-36} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={15} fontWeight="bold">#{p.rank}</text>
                  {/* Name */}
                  <rect x={-64} y={44} width={128} height={28} rx={14} fill={stale ? "#999" : "#1e1a16"} opacity={stale ? 0.5 : 1}/>
                  <text x={0} y={63} textAnchor="middle" fill="#fff" fontSize={15} fontWeight="bold" opacity={stale ? 0.5 : 1}>{p.entry.projectName.slice(0, 7)}</text>
                  {/* Comment bubble */}
                  {msg && (
                    <>
                      <rect x={-msgW / 2} y={-78} width={msgW} height={24} rx={12} fill="#fff" stroke={clr} strokeWidth={2}/>
                      <text x={0} y={-61} textAnchor="middle" fill="#1e1a16" fontSize={12} fontWeight="600">{msg}</text>
                    </>
                  )}
                  {stale && <text x={0} y={-62} textAnchor="middle" fontSize={12} fill="#999" fontWeight="bold">OFFLINE</text>}
                </g>
              );
            })}
          </svg>

          <div className="jt-minimap">
            <div className="jt-minimap__title">Mini Map</div>
            <svg viewBox={`0 0 ${trackProfile.viewBox.w} ${trackProfile.viewBox.h}`} className="jt-minimap__svg">
              <polyline
                points={path.points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="rgba(68,55,37,0.35)"
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {poses.map((p) => {
                const clr = teamColors[p.rank % teamColors.length];
                return <circle key={p.entryId} cx={p.x} cy={p.y} r={18} fill={clr} opacity={0.95} />;
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* ====== Drill-down Panel ====== */}
      {detailEntry && (() => {
        const e = sorted.find(x => x.entryId === detailEntry);
        if (!e) return null;
        return (
          <div className="jt-drill" onClick={() => setDetailEntry(null)}>
            <div className="jt-drill__card" onClick={e => e.stopPropagation()}>
              <button className="jt-drill__close" onClick={() => setDetailEntry(null)}>✕</button>
              <h3>{teamEmoji[(e.rank ?? 1) % teamEmoji.length]} {e.projectName}</h3>
              <div className="jt-drill__grid">
                <div><label>骑手</label><b>{e.riderName}</b></div>
                <div><label>排名</label><b>#{e.rank} {(e.rankDelta??0) > 0 ? "↑" : (e.rankDelta??0) < 0 ? "↓" : "—"}</b></div>
                <div><label>总分</label><b>{e.score?.toFixed(1) ?? "-"}</b></div>
                <div><label>赛道进度</label><b>{Math.round(e.roundProgress*100)}%</b></div>
                <div><label>整体进度</label><b>{Math.round(e.overallProgress*100)}%</b></div>
                <div><label>CA 类型</label><b>{e.caProvider.toUpperCase()}</b></div>
                <div><label>Token 消耗</label><b>{e.costTokens ?? 0}</b></div>
                <div><label>主动提交次数</label><b>{e.submissionCount ?? 0}</b></div>
                <div><label>估算费用</label><b>${((e.costTokens ?? 0) * 0.0001).toFixed(2)}</b></div>
                <div><label>风险等级</label><b style={{color:e.riskLevel==="high"?"#c34e36":e.riskLevel==="medium"?"#e67e22":"#50b86c"}}>{e.riskLevel}</b></div>
                <div><label>违规数</label><b>{e.violationCount}</b></div>
                <div><label>状态</label><b>{e.status}</b></div>
                <div><label>阶段</label><b>{e.currentPhase ?? "-"}</b></div>
              </div>
              {e.lastMessage && <p className="jt-drill__msg">💬 {e.lastMessage.summary}</p>}
            </div>
          </div>
        );
      })()}

      {/* ====== Ticker ====== */}
      <div className="jt-ticker">
        <div className="jt-ticker__inner">
          {attentionItems.map((a) => (
            <span key={a.itemId} className="jt-tkr-it jt-tkr--attn">{a.category==="violation"?"🚫":a.category==="risk"?"⚠":"🚧"} {a.summary}</span>
          ))}
          {messages.filter((m) => m.displayMode !== "bubble").map((m) => (
            <span key={m.messageId} className="jt-tkr-it jt-tkr--msg">💬 {m.summary}</span>
          ))}
        </div>
      </div>

      {/* ====== Footer ====== */}
      <footer className="jt-ft">
        <span>{competition.theme}</span><span>|</span><span>{competition.organizer}</span><span>|</span>
        <span>{competition.nextPhase}</span><span>|</span><span>{new Date(systemTime).toLocaleTimeString()}</span>
        {debug && <span style={{color:"#c34e36",marginLeft:12}}>DEBUG</span>}
      </footer>

      <style>{styles}</style>
    </div>
  );
}

const teamColors = ["#c34e36","#4a90d9","#e6a817","#50b86c","#9b59b6","#e67e22","#1abc9c","#e74c3c","#3498db","#f39c12","#2ecc71","#8e44ad"];
const teamEmoji = ["🐎","🦄","🏇","🐴","🦬","🐂","🐃","🦓","🫏","🐎","🏇","🐴"];

function formatTime(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
function fmtNum(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n); }
function rankColor(r: number) { return r === 1 ? "#c34e36" : r === 2 ? "#8b6e5a" : r === 3 ? "#687357" : "#999"; }

const styles = `
.jt {
  width: 100%; height: 100%;
  background: #f2eadf;
  font-family: "Noto Sans SC", sans-serif;
  color: #1e1a16;
  display: flex; flex-direction: column; overflow: hidden;
}
.jt-debug { outline: 2px dashed #c34e36; }

/* Header */
.jt-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 24px;
  background: rgba(255,252,247,0.9); border-bottom: 1px solid rgba(68,55,37,0.1);
  flex-shrink: 0;
}
.jt-hdr__brand { font-size: 20px; font-weight: 700; color: #c34e36; letter-spacing: 0.04em; }
.jt-hdr__phase { font-size: 13px; color: #65584b; margin-left: 12px; }
.jt-hdr__live { font-size: 13px; font-weight: 700; color: #c34e36; padding: 3px 10px; background: rgba(195,78,54,0.08); border-radius: 99px; }
.jt-hdr__right { display: flex; gap: 16px; font-size: 14px; font-weight: 600; }
.jt-hdr__online { color: #65584b; font-weight: 400; }
@keyframes jt-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.jt-hdr__live { animation: jt-pulse 2s ease-in-out infinite; }

/* KPI */
.jt-kpis {
  display: flex; gap: 2px; padding: 6px 24px;
  background: rgba(255,252,247,0.6); border-bottom: 1px solid rgba(68,55,37,0.06);
  flex-shrink: 0;
}
.jt-kpi {
  flex: 1; text-align: center; padding: 6px 4px;
  background: rgba(255,252,247,0.5); border-radius: 6px;
}
.jt-kpi b { display: block; font-size: 18px; font-weight: 700; color: #1e1a16; }
.jt-kpi small { display: block; font-size: 9px; color: #8b7b6e; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
.jt-kpi--warn b { color: #c34e36; }
.jt-kpi--click { cursor: pointer; transition: background 0.15s; }
.jt-kpi--click:hover { background: rgba(195,78,54,0.06); }
.jt-kpi-detail {
  padding: 8px 24px; background: rgba(255,252,247,0.95); border-bottom: 1px solid rgba(68,55,37,0.08);
  max-height: 200px; overflow-y: auto; flex-shrink: 0;
}
.jt-kpi-detail table { width: 100%; border-collapse: collapse; font-size: 12px; }
.jt-kpi-detail th { text-align: left; padding: 4px 8px; color: #8b7b6e; font-size: 11px; border-bottom: 1px solid rgba(68,55,37,0.1); }
.jt-kpi-detail td { padding: 3px 8px; border-bottom: 1px solid rgba(68,55,37,0.04); }

/* Main */
.jt-main { display: flex; flex: 1; min-height: 0; gap: 6px; padding: 6px; }

/* TOP3 */
.jt-top3 { width: 150px; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.jt-top3__card {
  padding: 8px 10px; border-radius: 8px;
  background: rgba(255,252,247,0.8); border: 1px solid rgba(68,55,37,0.1);
  display: flex; flex-direction: column; gap: 1px;
}
.jt-top3--gold { border-color: #c34e36; background: rgba(195,78,54,0.04); }
.jt-top3--silver { border-color: #8b7b6e; }
.jt-top3__rank { font-size: 22px; font-weight: 700; color: #c34e36; }
.jt-top3__name { font-size: 12px; font-weight: 600; }
.jt-top3__rider { font-size: 10px; color: #8b7b6e; }
.jt-top3__ca { font-size: 9px; color: #aaa; font-weight: 500; }

/* Active riders + Entry Legend */
.jt-active { margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(68,55,37,0.08); display: grid; gap: 4px; }
.jt-active__title { font-size: 10px; color: #8b7b6e; text-transform: uppercase; letter-spacing: 0.06em; }
.jt-active__item { display: flex; justify-content: space-between; gap: 8px; font-size: 10px; color: #65584b; }
.jt-active__item b { color: #1e1a16; }
.jt-legend { padding-top: 8px; border-top: 1px solid rgba(68,55,37,0.08); display: flex; flex-wrap: wrap; gap: 3px; }
.jt-legend__item { font-size: 10px; color: #65584b; white-space: nowrap; }

/* Drill-down */
.jt-drill { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; }
.jt-drill__card { background: #fffdf8; border-radius: 12px; padding: 24px 28px; min-width: 360px; max-width: 480px; box-shadow: 0 12px 40px rgba(0,0,0,0.2); position: relative; }
.jt-drill__close { position: absolute; top: 10px; right: 14px; border: none; background: none; font-size: 18px; cursor: pointer; color: #8b7b6e; }
.jt-drill__card h3 { margin: 0 0 16px; font-size: 18px; color: #1e1a16; }
.jt-drill__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
.jt-drill__grid label { font-size: 10px; color: #8b7b6e; display: block; text-transform: uppercase; letter-spacing: 0.04em; }
.jt-drill__grid b { font-size: 14px; color: #1e1a16; }
.jt-drill__msg { margin-top: 14px; padding: 10px 14px; background: rgba(195,78,54,0.04); border-radius: 8px; font-size: 12px; color: #65584b; }

/* Track */
.jt-track { flex: 1; position: relative; border-radius: 8px; overflow: hidden; background: #f5efe6; border: 1px solid rgba(68,55,37,0.08); }
.jt-track__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.jt-track__svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.jt-minimap {
  position: absolute; right: 14px; bottom: 14px; z-index: 5;
  width: 210px; height: 150px; padding: 8px;
  border-radius: 12px; background: rgba(255, 252, 247, 0.92);
  border: 1px solid rgba(68,55,37,0.12); box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.jt-minimap__title {
  font-size: 10px; color: #8b7b6e; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;
}
.jt-minimap__svg { width: 100%; height: calc(100% - 16px); }

/* Ticker */
.jt-ticker {
  height: 28px; background: rgba(255,252,247,0.7); border-top: 1px solid rgba(68,55,37,0.08);
  overflow: hidden; flex-shrink: 0; position: relative;
}
.jt-ticker__inner { display: flex; gap: 24px; white-space: nowrap; padding: 5px 0; animation: jt-scroll 30s linear infinite; }
@keyframes jt-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
.jt-tkr-it { font-size: 11px; padding: 2px 8px; border-radius: 99px; background: rgba(68,55,37,0.04); }
.jt-tkr--attn { color: #c34e36; }
.jt-tkr--msg { color: #687357; }

/* Footer */
.jt-ft {
  display: flex; gap: 10px; padding: 5px 24px; font-size: 10px; color: #aaa;
  background: rgba(255,252,247,0.6); border-top: 1px solid rgba(68,55,37,0.06); flex-shrink: 0;
}
`;
