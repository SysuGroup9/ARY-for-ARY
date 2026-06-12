"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { TrackRuntime } from "../../../../Jumbotron/track-runtime";
import type { TrackProfile } from "../../../../Jumbotron/types";
import css from "./calibrator.module.css";

const VB_W = 1920;
const VB_H = 1080;
const HIT_RADIUS = 22; // SVG units, ~1% of width

const TEAM_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

// Points match Jumbotron/tracks/track.profile.json exactly (0.80× from center 960,540)
const OVAL_POINTS: [number, number][] = [
  [1472, 540], [1403, 424], [1216, 339], [960, 308],
  [704,  339], [517,  424], [448,  540], [517,  656],
  [704,  741], [960,  772], [1216, 741], [1403, 656],
];

// Points match Jumbotron/tracks/rect.profile.json exactly (0.80× from center 960,540)
const RECT_POINTS: [number, number][] = [
  [1456, 540], [1456, 364], [1280, 316], [960, 308],
  [640,  316], [464,  364], [464,  540], [464,  716],
  [640,  764], [960,  772], [1280, 764], [1456, 716],
];

interface CalState {
  trackId: string;
  trackName: string;
  points: [number, number][];
  direction: "clockwise" | "counterclockwise";
  startFinishS: number;
  laneCount: number;
  laneHalfWidth: number;
}

const OVAL_STATE: CalState = {
  trackId: "oval-standard",
  trackName: "标准椭圆赛道",
  points: OVAL_POINTS,
  direction: "counterclockwise",
  startFinishS: 0,
  laneCount: 8,
  laneHalfWidth: 75,
};

function buildTempProfile(s: CalState): TrackProfile {
  const step = (s.laneHalfWidth * 2) / (s.laneCount + 1);
  return {
    schemaVersion: "1.0",
    trackId: s.trackId || "calibrating",
    name: s.trackName || "Calibrating",
    viewBox: { width: VB_W, height: VB_H },
    centerline: { type: "polyline", closed: true, smoothing: "catmull-rom", points: s.points },
    direction: s.direction,
    startFinish: { s: s.startFinishS },
    lanes: Array.from({ length: s.laneCount }, (_, i) => ({
      laneId: `lane-${i + 1}`,
      offset: -s.laneHalfWidth + step * (i + 1),
    })),
    checkpoints: [
      { id: "cp-1", s: 0.25, label: "CP 1" },
      { id: "cp-2", s: 0.5, label: "CP 2" },
      { id: "cp-3", s: 0.75, label: "CP 3" },
    ],
  };
}

function sampleClosed(rt: TrackRuntime, n = 300): string {
  const parts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const { pos } = rt.sampleAt(i / n);
    parts.push(`${i === 0 ? "M" : "L"}${pos.x.toFixed(1)},${pos.y.toFixed(1)}`);
  }
  return parts.join(" ") + " Z";
}

function sampleOffset(rt: TrackRuntime, offset: number, n = 300): string {
  const parts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const { pos, normal } = rt.sampleAt(i / n);
    const x = (pos.x + normal.x * offset).toFixed(1);
    const y = (pos.y + normal.y * offset).toFixed(1);
    parts.push(`${i === 0 ? "M" : "L"}${x},${y}`);
  }
  return parts.join(" ") + " Z";
}

interface Validation { ok: boolean; lines: string[] }

export function CalibratorUI() {
  const [state, setState] = useState<CalState>(OVAL_STATE);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(0.35);
  const [scrubS, setScrubS] = useState(0);
  const [previewHorses, setPreviewHorses] = useState(4);
  const [showIndexes, setShowIndexes] = useState(true);
  const [validation, setValidation] = useState<Validation | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const didDragRef = useRef(false);

  // ── Runtime ──────────────────────────────────────────────────────────
  const runtime = useMemo(() => {
    if (state.points.length < 4) return null;
    try { return new TrackRuntime(buildTempProfile(state)); }
    catch { return null; }
  }, [state]);

  // ── Path data (memoized) ─────────────────────────────────────────────
  const centerlinePath = useMemo(() => runtime ? sampleClosed(runtime) : null, [runtime]);
  const outerPath = useMemo(() => runtime ? sampleOffset(runtime, state.laneHalfWidth + 14) : null, [runtime, state.laneHalfWidth]);
  const innerPath = useMemo(() => runtime ? sampleOffset(runtime, -(state.laneHalfWidth + 14)) : null, [runtime, state.laneHalfWidth]);

  const lanePaths = useMemo(() => {
    if (!runtime || state.laneCount < 2) return [];
    const step = (state.laneHalfWidth * 2) / (state.laneCount + 1);
    return Array.from({ length: state.laneCount - 1 }, (_, i) => {
      const offset = -state.laneHalfWidth + step * (i + 1);
      return sampleOffset(runtime, offset);
    });
  }, [runtime, state.laneCount, state.laneHalfWidth]);

  const startFinishLine = useMemo(() => {
    if (!runtime) return null;
    const { pos, normal } = runtime.sampleAt(state.startFinishS);
    const hw = state.laneHalfWidth + 20;
    return {
      x1: pos.x - normal.x * hw, y1: pos.y - normal.y * hw,
      x2: pos.x + normal.x * hw, y2: pos.y + normal.y * hw,
    };
  }, [runtime, state.startFinishS, state.laneHalfWidth]);

  const checkpointLines = useMemo(() => {
    if (!runtime) return [];
    const s_vals = [0.25, 0.5, 0.75];
    return s_vals.map((s) => {
      const { pos, normal } = runtime.sampleAt(s);
      const hw = state.laneHalfWidth + 14;
      return { x1: pos.x - normal.x * hw, y1: pos.y - normal.y * hw, x2: pos.x + normal.x * hw, y2: pos.y + normal.y * hw };
    });
  }, [runtime, state.laneHalfWidth]);

  const horsePoses = useMemo(() => {
    if (!runtime || previewHorses === 0) return [];
    const step = (state.laneHalfWidth * 2) / (state.laneCount + 1);
    const count = Math.min(previewHorses, state.laneCount);
    return Array.from({ length: count }, (_, idx) => {
      const offset = -state.laneHalfWidth + step * (idx + 1);
      return runtime.computeHorsePose(`cal-${idx}`, scrubS, offset, idx);
    });
  }, [runtime, scrubS, previewHorses, state.laneHalfWidth, state.laneCount]);

  // ── SVG coordinate conversion ────────────────────────────────────────
  function toSVG(e: React.MouseEvent): [number, number] {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    return [
      Math.round(((e.clientX - r.left) / r.width) * VB_W),
      Math.round(((e.clientY - r.top) / r.height) * VB_H),
    ];
  }

  function nearestPoint(x: number, y: number): number {
    for (let i = 0; i < state.points.length; i++) {
      if (Math.hypot(state.points[i][0] - x, state.points[i][1] - y) < HIT_RADIUS) return i;
    }
    return -1;
  }

  // ── SVG event handlers ───────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const [x, y] = toSVG(e);
    const hit = nearestPoint(x, y);
    if (hit >= 0) {
      setDragIdx(hit);
      didDragRef.current = false;
      e.preventDefault();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.points]);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragIdx === null) return;
    didDragRef.current = true;
    const [x, y] = toSVG(e);
    setState(prev => {
      const pts = [...prev.points] as [number, number][];
      pts[dragIdx] = [Math.max(0, Math.min(VB_W, x)), Math.max(0, Math.min(VB_H, y))];
      return { ...prev, points: pts };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragIdx]);

  const onMouseUp = useCallback(() => setDragIdx(null), []);

  const onSVGClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (didDragRef.current) { didDragRef.current = false; return; }
    const [x, y] = toSVG(e);
    if (nearestPoint(x, y) < 0) {
      setState(prev => ({ ...prev, points: [...prev.points, [x, y]] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.points]);

  const onPointDblClick = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setState(prev => ({ ...prev, points: prev.points.filter((_, i) => i !== idx) }));
  }, []);

  // ── Background image upload ──────────────────────────────────────────
  function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setBgUrl(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  // ── Validate ─────────────────────────────────────────────────────────
  function validate(): Validation {
    const lines: string[] = [];
    let ok = true;
    if (!state.trackId.trim()) { lines.push("赛道 ID 不能为空"); ok = false; }
    else lines.push(`✓ 赛道 ID：${state.trackId}`);
    if (state.points.length < 4) { lines.push(`控制点不足：需 ≥ 4 个，当前 ${state.points.length} 个`); ok = false; }
    else lines.push(`✓ 控制点：${state.points.length} 个`);
    if (!runtime) { lines.push("路径引擎初始化失败"); ok = false; }
    else {
      const len = Math.round(runtime.totalLength);
      lines.push(`✓ 赛道弧长：${len} px`);
      if (len < 500) { lines.push("⚠ 赛道过短（建议 > 500px），请拉大控制点范围"); }
    }
    if (state.laneCount < 1 || state.laneCount > 12) { lines.push("车道数须在 1–12 之间"); ok = false; }
    else lines.push(`✓ ${state.laneCount} 条车道，半宽 ±${state.laneHalfWidth}`);
    lines.push(`✓ 方向：${state.direction === "clockwise" ? "顺时针" : "逆时针"}，起/终点 S=${state.startFinishS.toFixed(3)}`);
    return { ok, lines };
  }

  // ── Export JSON ──────────────────────────────────────────────────────
  function exportJSON() {
    const v = validate();
    setValidation(v);
    if (!v.ok) return;
    const step = (state.laneHalfWidth * 2) / (state.laneCount + 1);
    const profile = {
      schemaVersion: "1.0",
      trackId: state.trackId,
      name: state.trackName,
      viewBox: { width: VB_W, height: VB_H },
      centerline: {
        type: "polyline",
        closed: true,
        smoothing: "catmull-rom",
        points: state.points,
      },
      direction: state.direction,
      startFinish: { s: state.startFinishS },
      lanes: Array.from({ length: state.laneCount }, (_, i) => ({
        laneId: `lane-${i + 1}`,
        offset: Math.round(-state.laneHalfWidth + step * (i + 1)),
      })),
      checkpoints: [
        { id: "cp-1", s: 0.25, label: "CP 1" },
        { id: "cp-2", s: 0.5, label: "CP 2" },
        { id: "cp-3", s: 0.75, label: "CP 3" },
      ],
      noBubbleZones: [{ sStart: 0.0, sEnd: 0.05 }, { sStart: 0.95, sEnd: 1.0 }],
      messageZones: [],
    };
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.trackId}.profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Export points-only JSON (for race creation form) ─────────────────
  function copyPoints() {
    navigator.clipboard.writeText(JSON.stringify(state.points));
  }

  // ── Setters ──────────────────────────────────────────────────────────
  function set<K extends keyof CalState>(key: K, val: CalState[K]) {
    setState(prev => ({ ...prev, [key]: val }));
  }

  const totalLength = runtime ? Math.round(runtime.totalLength) : null;

  return (
    <div className={css.calibrator}>
      {/* ── Canvas ─────────────────────────────────────────────────── */}
      <div className={css.canvasCol}>
        <div className={css.canvasHeader}>
          <span className={css.canvasTitle}>Calibrator</span>
          <span>单击空白处添加控制点</span>
          <span style={{ margin: "0 4px", color: "#334155" }}>|</span>
          <span>拖拽控制点移动</span>
          <span style={{ margin: "0 4px", color: "#334155" }}>|</span>
          <span>双击控制点删除</span>
          {totalLength && (
            <>
              <span style={{ margin: "0 4px", color: "#334155" }}>|</span>
              <span style={{ color: "#22c55e" }}>弧长 {totalLength}px</span>
            </>
          )}
        </div>

        <div className={css.svgWrap}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={onSVGClick}
          >
            {/* ── Defs: mask + clipPath + vignette ── */}
            <defs>
              <mask id="calMask">
                {outerPath && <path d={outerPath} fill="white" />}
                {innerPath && <path d={innerPath} fill="black" />}
              </mask>
              <clipPath id="calInnerClip">
                {innerPath && <path d={innerPath} />}
              </clipPath>
              <radialGradient id="calVign" cx="50%" cy="55%" r="62%">
                <stop offset="55%" stopColor="rgba(0,0,0,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
              </radialGradient>
            </defs>

            {/* Stadium base — default when no user image */}
            {!bgUrl && (
              <image
                href="/jumbotron底图.jpg"
                x={0} y={0} width={VB_W} height={VB_H}
                preserveAspectRatio="xMidYMid slice"
                opacity={0.28}
              />
            )}
            {bgUrl && (
              <image href={bgUrl} x={0} y={0} width={VB_W} height={VB_H}
                preserveAspectRatio="xMidYMid slice" opacity={bgOpacity} />
            )}

            {/* Vignette */}
            <rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#calVign)" />

            {/* Track surface — sandy/dirt, mask (crack-free) */}
            {outerPath && innerPath && (
              <rect x={0} y={0} width={VB_W} height={VB_H}
                fill="#c4924a" mask="url(#calMask)" opacity={0.88} />
            )}

            {/* Inner field overlay */}
            {innerPath && (
              <rect x={0} y={0} width={VB_W} height={VB_H}
                fill="rgba(10,55,10,0.28)" clipPath="url(#calInnerClip)" />
            )}

            {/* Raw polyline before enough points */}
            {!centerlinePath && state.points.length >= 2 && (
              <polyline
                points={[...state.points, state.points[0]].map(([x, y]) => `${x},${y}`).join(" ")}
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1.5}
                strokeDasharray="20 10"
              />
            )}

            {/* Outer boundary rail */}
            {outerPath && (
              <>
                <path d={outerPath} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={6} />
                <path d={outerPath} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={2.5} />
              </>
            )}

            {/* Inner boundary rail */}
            {innerPath && (
              <>
                <path d={innerPath} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={6} />
                <path d={innerPath} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={2.5} />
              </>
            )}

            {/* Lane dividers */}
            {lanePaths.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="12 8" />
            ))}

            {/* Centerline */}
            {centerlinePath && (
              <path d={centerlinePath} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="20 10" />
            )}

            {/* Checkpoint lines — amber with pillar circles */}
            {checkpointLines.map((ln, i) => (
              <g key={i}>
                <line {...ln} stroke="#f59e0b" strokeWidth={3} strokeDasharray="10 6" strokeOpacity={0.85} />
                <circle cx={ln.x1} cy={ln.y1} r={8} fill="#f59e0b" opacity={0.9} />
                <circle cx={ln.x2} cy={ln.y2} r={8} fill="#f59e0b" opacity={0.9} />
                <text
                  x={(ln.x1 + ln.x2) / 2 + 10}
                  y={(ln.y1 + ln.y2) / 2 - 8}
                  fill="#fcd34d"
                  fontSize={22}
                  fontWeight="bold"
                  opacity={0.9}
                >
                  CP{i + 1}
                </text>
              </g>
            ))}

            {/* Start/finish line */}
            {startFinishLine && (
              <g>
                <line {...startFinishLine} stroke="white" strokeWidth={5} />
                <line {...startFinishLine} stroke="black" strokeWidth={5} strokeDasharray="12 12" />
              </g>
            )}

            {/* Preview horses */}
            {horsePoses.map((pose, idx) => (
              <g
                key={idx}
                transform={`translate(${pose.x.toFixed(1)},${pose.y.toFixed(1)}) rotate(${pose.rotation.toFixed(1)})`}
              >
                <circle r={22} fill={TEAM_COLORS[idx % TEAM_COLORS.length]} opacity={0.85} />
                <text
                  x={0} y={6}
                  textAnchor="middle"
                  fill="white"
                  fontSize={20}
                  fontWeight="bold"
                >
                  {idx + 1}
                </text>
              </g>
            ))}

            {/* Control points */}
            {state.points.map(([x, y], i) => (
              <g key={i}>
                <circle
                  cx={x} cy={y} r={dragIdx === i ? 18 : 13}
                  fill={dragIdx === i ? "#f97316" : "#38bdf8"}
                  fillOpacity={0.9}
                  stroke="white"
                  strokeWidth={2}
                  style={{ cursor: "grab" }}
                  onDoubleClick={(e) => onPointDblClick(i, e)}
                />
                {showIndexes && (
                  <text
                    x={x} y={y + 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize={14}
                    fontWeight="bold"
                    style={{ pointerEvents: "none" }}
                  >
                    {i}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        <div className={css.hintBar}>
          {state.points.length === 0
            ? "单击画布以放置第一个控制点"
            : state.points.length < 4
            ? `还需 ${4 - state.points.length} 个点才能渲染赛道曲线`
            : `${state.points.length} 个控制点 · 拖拽调整形状 · 双击删除`}
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────────────── */}
      <div className={css.controlsCol}>
        <div className={css.controlsHeader}>
          ⚙ 赛道参数
        </div>
        <div className={css.controlsScroll}>

          {/* Track Info */}
          <div className={css.section}>
            <div className={css.sectionLabel}>赛道信息</div>
            <div className={css.field}>
              <span className={css.label}>赛道 ID</span>
              <input
                className={css.input}
                value={state.trackId}
                onChange={e => set("trackId", e.target.value)}
                placeholder="oval-standard"
              />
            </div>
            <div className={css.field}>
              <span className={css.label}>赛道名称</span>
              <input
                className={css.input}
                value={state.trackName}
                onChange={e => set("trackName", e.target.value)}
                placeholder="标准椭圆赛道"
              />
            </div>
            <div className={css.btnRow}>
              <button
                className={css.btnSecondary + " " + css.btn}
                onClick={() => setState({ ...OVAL_STATE })}
              >
                预设：椭圆
              </button>
              <button
                className={css.btnSecondary + " " + css.btn}
                onClick={() => setState({ ...OVAL_STATE, trackId: "rect-standard", trackName: "标准方形赛道", points: RECT_POINTS })}
              >
                预设：方形
              </button>
              <button
                className={css.btnDanger + " " + css.btn}
                onClick={() => setState(prev => ({ ...prev, points: [] }))}
              >
                清空控制点
              </button>
            </div>
            <div className={css.stat}>
              {state.points.length} 个控制点
              {totalLength ? ` · 弧长 ${totalLength}px` : ""}
            </div>
          </div>

          {/* Direction & Start/Finish */}
          <div className={css.section}>
            <div className={css.sectionLabel}>起点 / 终点 / 方向</div>
            <div className={css.field}>
              <span className={css.label}>赛道方向</span>
              <select
                className={css.input}
                value={state.direction}
                onChange={e => set("direction", e.target.value as "clockwise" | "counterclockwise")}
              >
                <option value="counterclockwise">逆时针（CCW）</option>
                <option value="clockwise">顺时针（CW）</option>
              </select>
            </div>
            <div className={css.field}>
              <span className={css.label}>起/终点 S（弧长比例 0–1）</span>
              <input
                className={css.input}
                type="number"
                min={0} max={1} step={0.01}
                value={state.startFinishS}
                onChange={e => set("startFinishS", Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
              />
            </div>
            <div className={css.stat} style={{ color: "#64748b" }}>
              白色横线 = 起/终点位置
            </div>
          </div>

          {/* Lane Config */}
          <div className={css.section}>
            <div className={css.sectionLabel}>车道配置</div>
            <div className={css.row2}>
              <div className={css.field}>
                <span className={css.label}>车道数</span>
                <input
                  className={css.input}
                  type="number"
                  min={1} max={12}
                  value={state.laneCount}
                  onChange={e => set("laneCount", Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div className={css.field}>
                <span className={css.label}>半宽（px）</span>
                <input
                  className={css.input}
                  type="number"
                  min={20} max={300}
                  value={state.laneHalfWidth}
                  onChange={e => set("laneHalfWidth", Math.max(20, Math.min(300, parseInt(e.target.value) || 75)))}
                />
              </div>
            </div>
            <div className={css.stat}>
              车道间距：{state.laneCount > 1 ? Math.round((state.laneHalfWidth * 2) / (state.laneCount + 1)) : "—"} px
            </div>
          </div>

          {/* Preview */}
          <div className={css.section}>
            <div className={css.sectionLabel}>马匹预览</div>
            <div className={css.field}>
              <span className={css.label}>预览马匹数（0=隐藏）</span>
              <input
                className={css.input}
                type="number"
                min={0} max={state.laneCount}
                value={previewHorses}
                onChange={e => setPreviewHorses(Math.max(0, Math.min(state.laneCount, parseInt(e.target.value) || 0)))}
              />
            </div>
            <div className={css.field}>
              <span className={css.label}>位置 S = {scrubS.toFixed(3)}</span>
              <div className={css.scrubRow}>
                <input
                  className={css.scrubber}
                  type="range"
                  min={0} max={1} step={0.001}
                  value={scrubS}
                  onChange={e => setScrubS(parseFloat(e.target.value))}
                />
                <span className={css.scrubVal}>{(scrubS * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className={css.btnRow}>
              <button
                className={css.btnSecondary + " " + css.btn}
                onClick={() => setShowIndexes(v => !v)}
              >
                {showIndexes ? "隐藏序号" : "显示序号"}
              </button>
            </div>
          </div>

          {/* Background */}
          <div className={css.section}>
            <div className={css.sectionLabel}>背景底图</div>
            <div className={css.btnRow}>
              <button
                className={css.btnSecondary + " " + css.btn}
                onClick={() => fileRef.current?.click()}
              >
                上传图片
              </button>
              {bgUrl && (
                <button
                  className={css.btnDanger + " " + css.btn}
                  onClick={() => setBgUrl(null)}
                >
                  移除底图
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleBgUpload}
            />
            {bgUrl && (
              <div className={css.field} style={{ marginTop: 8 }}>
                <span className={css.label}>透明度 {Math.round(bgOpacity * 100)}%</span>
                <input
                  className={css.scrubber}
                  type="range"
                  min={0.05} max={1} step={0.05}
                  value={bgOpacity}
                  onChange={e => setBgOpacity(parseFloat(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Export */}
          <div className={css.section}>
            <div className={css.sectionLabel}>导出 / 使用</div>
            <div className={css.btnRow}>
              <button
                className={css.btnPrimary + " " + css.btn}
                onClick={exportJSON}
              >
                下载 profile.json
              </button>
              <button
                className={css.btnSuccess + " " + css.btn}
                onClick={copyPoints}
                title="复制控制点数组，粘贴到创建比赛表单的「自定义赛道控制点 JSON」字段"
              >
                复制控制点
              </button>
              <button
                className={css.btnSecondary + " " + css.btn}
                onClick={() => setValidation(validate())}
              >
                验证
              </button>
            </div>
            <div className={css.stat}>
              「复制控制点」→ 粘贴到创建比赛表单的「自定义赛道控制点 JSON」字段
            </div>
          </div>

          {/* Validation result */}
          {validation && (
            <div className={css.validBox}>
              {validation.ok
                ? <div className={css.validOk}>✓ 验证通过，可导出</div>
                : <div className={css.validErr}>✗ 存在问题，请修正后再导出</div>
              }
              {validation.lines.map((ln, i) => (
                <div key={i} className={css.validItem}>{ln}</div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
