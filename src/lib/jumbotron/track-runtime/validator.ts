// TrackProfile 校验器
import type { TrackProfile, ValidationResult } from "./types";

/**
 * 校验 TrackProfile 的 schema 和 geometry 合法性
 */
export function validateTrackProfile(profile: unknown): ValidationResult {
  const errors: ValidationResult["errors"] = [];
  const warnings: ValidationResult["warnings"] = [];

  if (!profile || typeof profile !== "object") {
    errors.push({ field: "root", message: "TrackProfile must be an object" });
    return { valid: false, errors, warnings };
  }

  const p = profile as Record<string, unknown>;

  // schemaVersion
  if (!p.schemaVersion) {
    errors.push({ field: "schemaVersion", message: "缺少 schemaVersion" });
  }

  // trackId
  if (!p.trackId || typeof p.trackId !== "string") {
    errors.push({ field: "trackId", message: "缺少 trackId" });
  }

  // viewBox
  const vb = p.viewBox as Record<string, unknown> | undefined;
  if (!vb || typeof vb.w !== "number" || typeof vb.h !== "number" || vb.w <= 0 || vb.h <= 0) {
    errors.push({ field: "viewBox", message: "viewBox 不合法 (w/h 必须为正数)" });
  }

  // background
  const bg = p.background as Record<string, unknown> | undefined;
  if (!bg || typeof bg.src !== "string") {
    errors.push({ field: "background.src", message: "缺少 background.src" });
  }

  // centerline
  const cl = p.centerline as Record<string, unknown> | undefined;
  if (!cl) {
    errors.push({ field: "centerline", message: "缺少 centerline" });
  } else {
    const points = cl.points as Array<{ x: number; y: number }> | undefined;
    const closed = cl.closed === true;
    if (!points || !Array.isArray(points)) {
      errors.push({ field: "centerline.points", message: "缺少 centerline.points" });
    } else {
      const minPoints = closed ? 4 : 2;
      if (points.length < minPoints) {
        errors.push({
          field: "centerline.points",
          message: `${closed ? "闭合" : "开放"}路径至少需要 ${minPoints} 个点，当前 ${points.length}`,
        });
      }

      // 检查 NaN / Infinity
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        if (!isFinite(pt.x) || !isFinite(pt.y)) {
          errors.push({
            field: `centerline.points[${i}]`,
            message: `点 [${i}] 包含 NaN 或 Infinity`,
          });
        }
      }

      // 检查相邻点异常跳变
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 500) {
          warnings.push({
            field: `centerline.points[${i}]`,
            message: `点 [${i - 1}] → [${i}] 距离过大 (${dist.toFixed(0)}px)，可能是异常跳变`,
          });
        }
      }
    }
  }

  // direction
  if (p.direction !== "clockwise" && p.direction !== "counterclockwise") {
    errors.push({ field: "direction", message: "direction 必须是 clockwise 或 counterclockwise" });
  }

  // startFinish
  const sf = p.startFinish as Record<string, unknown> | undefined;
  if (!sf || typeof sf.s !== "number" || sf.s < 0 || sf.s > 1) {
    errors.push({ field: "startFinish.s", message: "startFinish.s 必须在 0~1 范围内" });
  }

  // lanes
  const lanes = p.lanes as Array<Record<string, unknown>> | undefined;
  if (!lanes || !Array.isArray(lanes) || lanes.length === 0) {
    errors.push({ field: "lanes", message: "至少需要 1 条车道" });
  } else {
    const offsets = new Set<number>();
    for (const lane of lanes) {
      if (typeof lane.offset !== "number") {
        errors.push({ field: "lanes", message: "车道 offset 必须为数字" });
      } else if (offsets.has(lane.offset)) {
        errors.push({ field: "lanes", message: `车道 offset ${lane.offset} 重复` });
      } else {
        offsets.add(lane.offset);
      }
    }
  }

  // checkpoints
  const checkpoints = p.checkpoints as Array<Record<string, unknown>> | undefined;
  if (checkpoints) {
    for (let i = 0; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      if (typeof cp.s !== "number" || cp.s < 0 || cp.s > 1) {
        errors.push({
          field: `checkpoints[${i}].s`,
          message: `checkpoint [${i}] s 必须在 0~1 范围内`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
