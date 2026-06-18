// 姿态计算器：RacingEntrySnapshot → HorsePose
import type { HorsePose, Point, TrackProfile } from "./types";
import { samplePath, sampleAt, tangentAngle, normal } from "./path-sampler";
import { assignLane } from "./lane-manager";
import { resolveMotionState } from "./animation-state";
import type { SampledPath } from "./path-sampler";

// 缓存每个 TrackProfile 的采样路径，避免重复计算
const pathCache = new Map<string, SampledPath>();

function getOrSamplePath(profile: TrackProfile): SampledPath {
  const key = profile.trackId;
  if (pathCache.has(key)) return pathCache.get(key)!;

  const path = samplePath(
    profile.centerline.points,
    profile.centerline.closed,
    20,
  );
  // 只在 path 有效时缓存
  if (path.points.length >= 2) {
    pathCache.set(key, path);
  }
  return path;
}

/** 清除路径缓存（profile 更新后调用） */
export function clearPathCache(trackId?: string): void {
  if (trackId) {
    pathCache.delete(trackId);
  } else {
    pathCache.clear();
  }
}

/**
 * 计算单匹马的 HorsePose
 *
 * @param profile  赛道配置
 * @param progress 赛道进度 (0~1)
 * @param rank     排名（用于分配车道）
 * @param entryId  条目 ID
 * @param laneCount 总车道数
 * @param status   马匹状态字符串
 * @param zIndex   层级
 */
export function calculateHorsePose(params: {
  profile: TrackProfile;
  progress: number;
  rank: number;
  entryId: string;
  laneCount: number;
  status: string;
  zIndex: number;
}): HorsePose | null {
  const { profile, progress, rank, entryId, laneCount, status, zIndex } = params;

  const path = getOrSamplePath(profile);
  if (path.points.length < 2) return null;

  // clamp progress
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // s = 起点到终点，从 startFinish.s 开始偏移
  // 简单处理：直接从 0 开始，0 = 起点，1 = 终点
  const s = clampedProgress;

  // 采样中心线点
  const sampled = sampleAt(path, s);
  if (!sampled) return null;

  // 分配车道
  const lane = assignLane(rank, laneCount);
  const laneOffset = profile.lanes[lane.index]?.offset ?? 0;

  // 法线方向
  const n = normal(sampled.tangent);

  // 最终位置 = 中心点 + 车道偏移
  const finalPoint: Point = {
    x: sampled.point.x + n.x * laneOffset,
    y: sampled.point.y + n.y * laneOffset,
  };

  // 旋转角度
  const rotation = tangentAngle(sampled.tangent);

  return {
    entryId,
    x: finalPoint.x,
    y: finalPoint.y,
    rotation,
    s,
    laneId: lane.id,
    state: resolveMotionState(status),
    zIndex,
  };
}

/**
 * 批量计算所有马的 HorsePose
 */
export function calculateAllHorsePoses(params: {
  profile: TrackProfile;
  entries: Array<{
    entryId: string;
    progress: number;
    rank: number;
    status: string;
  }>;
  laneCount?: number;
}): HorsePose[] {
  const { profile, entries, laneCount = 3 } = params;

  return entries
    .map((entry, i) =>
      calculateHorsePose({
        profile,
        progress: entry.progress,
        rank: entry.rank,
        entryId: entry.entryId,
        laneCount,
        status: entry.status,
        zIndex: entries.length - i, // 排名越前 zIndex 越高
      }),
    )
    .filter((pose): pose is HorsePose => pose !== null);
}
