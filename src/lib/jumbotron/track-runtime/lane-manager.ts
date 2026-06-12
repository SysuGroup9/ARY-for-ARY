// 车道管理器：根据排名分配车道

export interface LaneAssignment {
  index: number;  // 车道索引 (0-based)
  id: string;     // 车道 ID (lane-1, lane-2, ...)
}

/**
 * 按排名循环分配车道
 *
 * 默认规则：
 *   排名 1 → lane-0 (最内侧)
 *   排名 2 → lane-1
 *   排名 3 → lane-2
 *   排名 4 → lane-0 (循环复用)
 *   ...
 *
 * 这样避免所有马挤在同一条车道上
 */
export function assignLane(rank: number, laneCount: number): LaneAssignment {
  const index = (rank - 1) % Math.max(1, laneCount);
  return {
    index,
    id: `lane-${index}`,
  };
}

/**
 * 为一批条目批量分配车道
 *
 * @param entries  条目列表（已按 rank 排序）
 * @param laneCount 车道总数
 * @returns Map<entryId, LaneAssignment>
 */
export function assignAllLanes(
  entries: Array<{ entryId: string; rank: number }>,
  laneCount: number,
): Map<string, LaneAssignment> {
  const map = new Map<string, LaneAssignment>();
  for (const entry of entries) {
    map.set(entry.entryId, assignLane(entry.rank, laneCount));
  }
  return map;
}
