"use client";

import { useReducer, useRef, useEffect, useCallback, useState } from "react";
import {
  calibratorReducer,
  createInitialState,
  toTrackProfile,
} from "@/lib/jumbotron/calibrator/CalibratorState";
import { samplePath, sampleAt, tangentAngle, normal } from "@/lib/jumbotron/track-runtime/path-sampler";
import { validateTrackProfile } from "@/lib/jumbotron/track-runtime/validator";
import type { Point } from "@/lib/jumbotron/track-runtime/types";

export default function CalibratorClient() {
  const [state, dispatch] = useReducer(calibratorReducer, null, createInitialState);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ index: number; ox: number; oy: number; px: number; py: number } | null>(null);

  // 自动播放
  useEffect(() => {
    if (!state.isPlaying) return;
    const interval = setInterval(() => {
      dispatch({ type: "SET_PREVIEW_PROGRESS", payload: (state.previewProgress + 0.002 * state.previewSpeed) % 1 });
    }, 16);
    return () => clearInterval(interval);
  }, [state.isPlaying, state.previewProgress, state.previewSpeed]);

  // ---- 拖拽处理（SVG 原生事件，viewBox 坐标） ----
  const onPointMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    dragRef.current = { index, ox: e.clientX, oy: e.clientY, px: state.centerline.points[index].x, py: state.centerline.points[index].y };
    dispatch({ type: "SELECT_POINT", payload: index });
  }, [state.centerline.points]);

  const onPointContextMenu = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "DELETE_POINT", payload: { index } });
  }, []);

  const onSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    const dx = svgPt.x - dragRef.current.px;
    const dy = svgPt.y - dragRef.current.py;
    dispatch({ type: "MOVE_POINT", payload: { index: dragRef.current.index, point: { x: dragRef.current.px + dx, y: dragRef.current.py + dy } } });
  }, []);

  const onSvgMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const onSvgDoubleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    dispatch({ type: "ADD_POINT", payload: { x: svgPt.x, y: svgPt.y } });
  }, []);

  // ---- 导入/导出 ----
  const handleImportBg = useCallback(() => fileInputRef.current?.click(), []);
  const handleBgFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => { setBgImage(img); dispatch({ type: "SET_BACKGROUND", payload: { src: reader.result as string, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight } }); };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImportProfile = useCallback(() => profileInputRef.current?.click(), []);
  const handleProfileFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { const profile = JSON.parse(reader.result as string); dispatch({ type: "LOAD_PROFILE", payload: profile }); } catch { alert("JSON 解析失败"); }
    };
    reader.readAsText(file);
  }, []);

  const handleValidate = useCallback(() => {
    const result = validateTrackProfile(toTrackProfile(state));
    dispatch({ type: "SET_VALIDATION", payload: { errors: result.errors.map(e => `${e.field}: ${e.message}`), warnings: result.warnings.map(w => `${w.field}: ${w.message}`) } });
  }, [state]);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(toTrackProfile(state), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${state.trackId}.profile.json`; a.click();
  }, [state]);

  // ---- 路径计算 ----
  const path = state.centerline.points.length >= 2
    ? samplePath(state.centerline.points, state.centerline.closed, 20)
    : null;

  // ---- 马匹预览 ----
  const horsePreviews = path ? Array.from({ length: state.previewHorseCount }, (_, i) => {
    const s = (state.previewProgress + i * 0.03) % 1;
    const sampled = sampleAt(path, Math.max(0, Math.min(1, s)));
    if (!sampled) return null;
    const lane = state.lanes[i % state.lanes.length];
    const n = normal(sampled.tangent);
    const offset = lane?.offset ?? 0;
    return { x: sampled.point.x + n.x * offset, y: sampled.point.y + n.y * offset, angle: (tangentAngle(sampled.tangent) * 180) / Math.PI, idx: i };
  }).filter(Boolean) : [];

  const vb = state.viewBox;
  const selectedIdx = state.selectedPointIndex;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 40px)", gap: 8 }}>
      {/* Toolbar */}
      <div className="cal-bar">
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleBgFile} />
        <input ref={profileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleProfileFile} />
        <button onClick={handleImportBg}>📷 导入底图</button>
        <button onClick={handleImportProfile}>📂 导入 Profile</button>
        <button onClick={handleValidate}>✓ 校验</button>
        <button onClick={handleExport} className="cal-btn1">⬇ 导出</button>
        <span className="cal-inf">点数: {state.centerline.points.length}{path ? ` | 路径: ${Math.round(path.totalLength)}px` : ""}</span>
      </div>

      <div style={{ display: "flex", gap: 8, flex: 1, minHeight: 0 }}>
        {/* Main SVG Area */}
        <div style={{ flex: 1, background: "#1a1a1a", border: "1px solid #ccc", position: "relative", overflow: "hidden" }}>
          {!state.background && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#888", zIndex: 1, pointerEvents: "none", gap: 8 }}>
              <div style={{ fontSize: 28 }}>📷</div>
              <div>点击上方「导入底图」加载赛道图片</div>
              <div style={{ fontSize: 12, color: "#555" }}>加载后双击添加控制点，拖拽移动，右键删除</div>
            </div>
          )}
          {state.background && (
            <div style={{ position: "absolute", top: 8, left: 8, zIndex: 2, background: "rgba(0,0,0,0.75)", color: "#4f4", padding: "6px 12px", borderRadius: 4, fontSize: 12, pointerEvents: "none" }}>
              ✓ 底图已加载 ({state.background.naturalWidth}×{state.background.naturalHeight}) | 双击添加点 | 拖拽移动 | 右键删除
            </div>
          )}

          <svg
            viewBox={`0 0 ${vb.w} ${vb.h}`}
            style={{ width: "100%", height: "100%", position: "absolute", inset: 0, cursor: dragRef.current ? "grabbing" : "crosshair" }}
            onMouseMove={onSvgMouseMove}
            onMouseUp={onSvgMouseUp}
            onMouseLeave={onSvgMouseUp}
            onDoubleClick={onSvgDoubleClick}
          >
            {/* 背景 */}
            {bgImage && <image href={state.background?.src ?? ""} width={vb.w} height={vb.h} />}

            {/* 采样路径 */}
            {path && path.points.length > 1 && (
              <>
                <polyline points={path.points.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="rgba(60,140,200,0.5)" strokeWidth={6} />
                {/* 方向箭头 */}
                {path.points.filter((_, i) => i % 50 === 0).map((p, i) => {
                  const j = Math.min(i * 50 + 1, path.points.length - 1);
                  const q = path.points[j];
                  const a = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
                  return <polygon key={i} points="-8,-4 8,0 -8,4" fill="rgba(60,140,200,0.4)" transform={`translate(${p.x},${p.y}) rotate(${a})`} />;
                })}
              </>
            )}

            {/* 控制点连线 */}
            {state.centerline.points.length > 1 && (
              <polyline points={state.centerline.points.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="rgba(74,144,217,0.3)" strokeWidth={2} strokeDasharray="8,6" />
            )}

            {/* 车道预览 */}
            {path && state.lanes.map(lane => (
              <polyline
                key={lane.id}
                points={path.points.map((_, i) => {
                  const s = i / (path.points.length - 1 || 1);
                  const smp = sampleAt(path, s);
                  if (!smp) return "";
                  const n = normal(smp.tangent);
                  return `${smp.point.x + n.x * lane.offset},${smp.point.y + n.y * lane.offset}`;
                }).join(" ")}
                fill="none" stroke="rgba(150,150,150,0.3)" strokeWidth={1.5} strokeDasharray="10,10"
              />
            ))}

            {/* 起跑线 */}
            {path && (() => { const r = sampleAt(path, state.startFinish.s); if (!r) return null; const n = normal(r.tangent); const L = 80; return <line x1={r.point.x + n.x * L} y1={r.point.y + n.y * L} x2={r.point.x - n.x * L} y2={r.point.y - n.y * L} stroke="#ff4444" strokeWidth={5} />; })()}

            {/* 检查点 */}
            {path && state.checkpoints.map(cp => {
              const r = sampleAt(path, cp.s); if (!r) return null; const n = normal(r.tangent);
              return <g key={cp.id}><rect x={r.point.x + n.x * 40 - 8} y={r.point.y + n.y * 40 - 8} width={16} height={16} fill="#fa0" stroke="#fff" strokeWidth={1} transform={`rotate(45, ${r.point.x + n.x * 40}, ${r.point.y + n.y * 40})`} /></g>;
            })}

            {/* 马匹预览 */}
            {horsePreviews.map((hp: any) => hp && (
              <g key={hp.idx} transform={`translate(${hp.x}, ${hp.y}) rotate(${hp.angle})`}>
                <ellipse cx={0} cy={0} rx={16} ry={9} fill={`hsl(${(hp.idx * 50) % 360},60%,55%)`} stroke="#333" strokeWidth={1} />
                <circle cx={18} cy={-5} r={6} fill={`hsl(${(hp.idx * 50) % 360},60%,45%)`} stroke="#333" strokeWidth={1} />
                <circle cx={0} cy={-16} r={10} fill="#d96c5a" stroke="#fff" strokeWidth={2} />
                <text x={0} y={-12} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold">{hp.idx + 1}</text>
              </g>
            ))}

            {/* 控制点（最后画，在最上层） */}
            {state.centerline.points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={i === selectedIdx ? 14 : 10} fill="#fff" stroke={i === selectedIdx ? "#ff6600" : "#4a90d9"} strokeWidth={3}
                  style={{ cursor: "pointer" }}
                  onMouseDown={(e) => onPointMouseDown(i, e)}
                  onContextMenu={(e) => onPointContextMenu(i, e)}
                />
                <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="central" fill={i === selectedIdx ? "#ff6600" : "#4a90d9"} fontSize={10} fontWeight="bold" style={{ pointerEvents: "none" }}>{i}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Inspector */}
        <div className="cal-inspector">
          <h3>赛道信息</h3>
          <label>名称</label><input value={state.name} onChange={e => dispatch({ type: "SET_NAME", payload: e.target.value })} />
          <label>画布 (w×h)</label>
          <div style={{ display: "flex", gap: 4 }}>
            <input type="number" value={vb.w} onChange={e => dispatch({ type: "SET_VIEWBOX", payload: { w: Number(e.target.value), h: vb.h } })} />
            <input type="number" value={vb.h} onChange={e => dispatch({ type: "SET_VIEWBOX", payload: { w: vb.w, h: Number(e.target.value) } })} />
          </div>
          <h3>几何</h3>
          <label className="cal-inspector__check"><input type="checkbox" checked={state.centerline.closed} onChange={e => dispatch({ type: "SET_CLOSED", payload: e.target.checked })} />闭合赛道</label>
          <button onClick={() => dispatch({ type: "REVERSE_DIRECTION" })}>🔄 反转方向 ({state.direction === "clockwise" ? "顺" : "逆"})</button>
          <h3>起终点 s</h3>
          <input type="range" min={0} max={1} step={0.01} value={state.startFinish.s} onChange={e => dispatch({ type: "SET_START_FINISH", payload: Number(e.target.value) })} />
          <span>{state.startFinish.s.toFixed(2)}</span>
          <h3>车道 ({state.lanes.length})</h3>
          {state.lanes.map((l, i) => (
            <div key={l.id} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              <input size={8} value={l.name} onChange={e => dispatch({ type: "UPDATE_LANE", payload: { index: i, lane: { ...l, name: e.target.value } } })} />
              <input type="number" size={5} value={l.offset} onChange={e => dispatch({ type: "UPDATE_LANE", payload: { index: i, lane: { ...l, offset: Number(e.target.value) } } })} />
              <button onClick={() => dispatch({ type: "REMOVE_LANE", payload: { index: i } })} disabled={state.lanes.length <= 1}>✕</button>
            </div>
          ))}
          <button onClick={() => dispatch({ type: "ADD_LANE", payload: { id: `lane-${state.lanes.length}`, name: `车道${state.lanes.length + 1}`, offset: state.lanes.length * 50 } })}>+ 车道</button>
          <h3>检查点</h3>
          {state.checkpoints.map((cp, i) => (
            <div key={cp.id} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              <input size={8} value={cp.name} onChange={e => dispatch({ type: "UPDATE_CHECKPOINT", payload: { index: i, checkpoint: { ...cp, name: e.target.value } } })} />
              <input type="number" size={5} min={0} max={1} step={0.01} value={cp.s} onChange={e => dispatch({ type: "UPDATE_CHECKPOINT", payload: { index: i, checkpoint: { ...cp, s: Number(e.target.value) } } })} />
              <button onClick={() => dispatch({ type: "REMOVE_CHECKPOINT", payload: { index: i } })}>✕</button>
            </div>
          ))}
          <button onClick={() => dispatch({ type: "ADD_CHECKPOINT", payload: { id: `cp-${Date.now()}`, name: `CP${state.checkpoints.length + 1}`, s: 0.5 } })}>+ 检查点</button>
          {(state.validationErrors.length > 0 || state.validationWarnings.length > 0) && (
            <>
              <h3>校验</h3>
              {state.validationErrors.map((e, i) => <div key={i} className="cal-inspector__err">❌ {e}</div>)}
              {state.validationWarnings.map((w, i) => <div key={i} className="cal-inspector__warn">⚠️ {w}</div>)}
            </>
          )}
        </div>
      </div>

      {/* Preview Bar */}
      <div className="cal-preview-bar">
        <button onClick={() => dispatch({ type: "TOGGLE_PLAY" })}>{state.isPlaying ? "⏸" : "▶"}</button>
        <input type="range" min={0} max={1} step={0.001} value={state.previewProgress} onChange={e => dispatch({ type: "SET_PREVIEW_PROGRESS", payload: Number(e.target.value) })} style={{ flex: 1 }} />
        <span>{Math.round(state.previewProgress * 100)}%</span>
        <label>马:</label>
        <input type="number" min={1} max={12} value={state.previewHorseCount} onChange={e => dispatch({ type: "SET_PREVIEW_HORSE_COUNT", payload: Number(e.target.value) })} style={{ width: 50 }} />
        <label>速:</label>
        <select value={state.previewSpeed} onChange={e => dispatch({ type: "SET_PREVIEW_SPEED", payload: Number(e.target.value) })}>
          <option value={0.5}>0.5x</option><option value={1}>1x</option><option value={2}>2x</option>
        </select>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.cal-bar { display: flex; gap: 8px; padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; align-items: center; flex-shrink: 0; }
.cal-bar button { padding: 6px 14px; border: 1px solid #ccc; background: #fff; border-radius: 4px; cursor: pointer; font-size: 13px; }
.cal-bar button:hover { background: #e8e8e8; }
.cal-btn1 { background: #4a90d9 !important; color: #fff !important; border-color: #3a7bc8 !important; }
.cal-inf { margin-left: auto; font-size: 12px; color: #666; }
.cal-inspector { width: 260px; background: #fafafa; border: 1px solid #ddd; border-radius: 4px; padding: 12px; overflow-y: auto; font-size: 13px; flex-shrink: 0; }
.cal-inspector h3 { margin: 12px 0 6px; font-size: 13px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 4px; }
.cal-inspector h3:first-child { margin-top: 0; }
.cal-inspector label { display: block; font-size: 11px; color: #666; margin: 6px 0 2px; }
.cal-inspector input[type="text"], .cal-inspector input[type="number"] { width: 100%; padding: 4px 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px; }
.cal-inspector button { padding: 3px 8px; font-size: 12px; cursor: pointer; margin-top: 4px; }
.cal-inspector__check { display: flex !important; align-items: center; gap: 6px; }
.cal-inspector__check input { width: auto !important; }
.cal-inspector__err { color: #c0392b; font-size: 11px; margin: 2px 0; }
.cal-inspector__warn { color: #e67e22; font-size: 11px; margin: 2px 0; }
.cal-preview-bar { display: flex; gap: 8px; padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; align-items: center; font-size: 13px; flex-shrink: 0; }
.cal-preview-bar button { padding: 4px 10px; cursor: pointer; }
.cal-preview-bar input[type="range"] { width: auto; }
`;
