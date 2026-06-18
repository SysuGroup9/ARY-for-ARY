// 路径采样器：polyline → Catmull-Rom 平滑 → 等距采样点
import type { Point } from "./types";

export interface SampledPath {
  points: Point[];
  totalLength: number;
  /** 每个采样点距离起点的累计弧长 */
  cumulativeLengths: number[];
}

/**
 * Catmull-Rom 插值
 * 输入 4 个控制点和参数 t，返回插值点
 */
function catmullRom(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    ),
  };
}

/**
 * 计算两点间距离
 */
function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * 对控制点做 Catmull-Rom 平滑，生成密集采样点
 * @param controlPoints 中心线控制点
 * @param closed 是否闭合
 * @param samplesPerSegment 每段控制点间的采样数
 */
export function samplePath(
  controlPoints: Point[],
  closed: boolean,
  samplesPerSegment: number = 20,
): SampledPath {
  if (controlPoints.length < 2) {
    return { points: [], totalLength: 0, cumulativeLengths: [] };
  }

  const points: Point[] = [];
  const n = controlPoints.length;

  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = controlPoints[(i - 1 + n) % n];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % n];
    const p3 = controlPoints[(i + 2) % n];

    for (let j = 0; j < samplesPerSegment; j++) {
      const t = j / samplesPerSegment;
      points.push(catmullRom(p0, p1, p2, p3, t));
    }
  }

  // 闭合路径需回到起点
  if (!closed) {
    points.push({ ...controlPoints[controlPoints.length - 1] });
  } else {
    points.push(points[0]);
  }

  // 计算累计弧长
  const cumulativeLengths: number[] = [0];
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    totalLength += distance(points[i - 1], points[i]);
    cumulativeLengths.push(totalLength);
  }

  return { points, totalLength, cumulativeLengths };
}

/**
 * 根据弧长参数 s（0~1）在采样路径上取点
 * 返回 { point, tangent, index }
 */
export function sampleAt(
  path: SampledPath,
  s: number,
): { point: Point; tangent: Point; index: number } | null {
  if (path.points.length < 2) return null;

  const clampedS = Math.max(0, Math.min(1, s));
  const targetDist = clampedS * path.totalLength;

  // 二分查找
  let lo = 0;
  let hi = path.cumulativeLengths.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (path.cumulativeLengths[mid] <= targetDist) lo = mid;
    else hi = mid;
  }

  // 在 lo 和 hi 之间线性插值
  const segLen = path.cumulativeLengths[hi] - path.cumulativeLengths[lo];
  const t = segLen > 0 ? (targetDist - path.cumulativeLengths[lo]) / segLen : 0;

  const point: Point = {
    x: path.points[lo].x + (path.points[hi].x - path.points[lo].x) * t,
    y: path.points[lo].y + (path.points[hi].y - path.points[lo].y) * t,
  };

  // 切线方向 (归一化)
  const dx = path.points[hi].x - path.points[lo].x;
  const dy = path.points[hi].y - path.points[lo].y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const tangent: Point = { x: dx / len, y: dy / len };

  return { point, tangent, index: lo };
}

/**
 * 计算切线的旋转角度（弧度），0 = 向右
 */
export function tangentAngle(tangent: Point): number {
  return Math.atan2(tangent.y, tangent.x);
}

/**
 * 计算法线方向（垂直切线，逆时针旋转 90°）
 * 正法线 = 切线左侧
 */
export function normal(tangent: Point): Point {
  return { x: -tangent.y, y: tangent.x };
}
