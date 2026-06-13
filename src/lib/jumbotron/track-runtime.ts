import type {
  HorseMotionState,
  HorsePose,
  MessageBubbleCandidate,
  RacingEntrySnapshot,
} from "@/lib/jumbotron/contracts";
import {
  formatZodIssues,
  type Point,
  type TrackLane,
  type TrackProfile,
  type TrackValidationReport,
  trackProfileSchema,
} from "@/lib/jumbotron/track-profile";

const MIN_TRACK_LENGTH = 120;
const DEFAULT_SAMPLE_COUNT = 96;
const DEFAULT_STALE_THRESHOLD_MS = 90_000;

interface TrackSegment {
  cumulativeStart: number;
  end: Point;
  length: number;
  start: Point;
}

export interface SampledTrackPoint extends Point {
  normal: Point;
  rotation: number;
  s: number;
  tangent: Point;
}

export interface TrackRuntime {
  profile: TrackProfile;
  sampledPoints: SampledTrackPoint[];
  segments: TrackSegment[];
  totalLength: number;
}

export function buildTrackRuntime(profile: TrackProfile): TrackRuntime {
  const report = validateTrackProfile(profile);
  if (!report.valid) {
    throw new Error(`Invalid track profile: ${report.errors.join("; ")}`);
  }

  const segments = buildSegments(profile);
  const totalLength = sumSegments(segments);
  const runtime = {
    profile,
    sampledPoints: [],
    segments,
    totalLength,
  };

  return {
    ...runtime,
    sampledPoints: sampleCenterlinePoints(runtime, DEFAULT_SAMPLE_COUNT),
  };
}

export function validateTrackProfile(input: unknown): TrackValidationReport {
  const parsed = trackProfileSchema.safeParse(input);
  if (!parsed.success) {
    return emptyReport(formatZodIssues(parsed.error));
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const profile = parsed.data;
  const points = profile.centerline.points;

  if (profile.centerline.closed && points.length < 4) {
    errors.push("closed track requires at least 4 centerline points");
  }

  if (!profile.centerline.closed && points.length < 2) {
    errors.push("open track requires at least 2 centerline points");
  }

  collectLaneErrors(profile.lanes, errors);
  collectZoneErrors(profile, errors);

  const segments = buildSegments(profile);
  const pathLength = sumSegments(segments);
  if (pathLength < MIN_TRACK_LENGTH) {
    errors.push(`path length must be greater than ${MIN_TRACK_LENGTH}`);
  }

  collectGeometryWarnings(segments, pathLength, warnings);

  return {
    errors,
    metrics: {
      pathLength,
      sampleCount: DEFAULT_SAMPLE_COUNT,
    },
    valid: errors.length === 0,
    warnings,
  };
}

export function normalizeProgress(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function sampleCenterline(runtime: TrackRuntime, s: number): SampledTrackPoint {
  const normalized = normalizeProgress(s);
  const targetDistance = normalized * runtime.totalLength;
  const segment = findSegment(runtime.segments, targetDistance);
  const distanceIntoSegment = targetDistance - segment.cumulativeStart;
  const segmentT = segment.length === 0 ? 0 : distanceIntoSegment / segment.length;
  const point = lerpPoint(segment.start, segment.end, segmentT);
  const tangent = normalizeVector({
    x: segment.end.x - segment.start.x,
    y: segment.end.y - segment.start.y,
  });
  const normal = {
    x: -tangent.y,
    y: tangent.x,
  };

  return {
    ...point,
    normal,
    rotation: radiansToDegrees(Math.atan2(tangent.y, tangent.x)),
    s: normalized,
    tangent,
  };
}

export function sampleLanePoint(
  runtime: TrackRuntime,
  laneId: string | undefined,
  s: number,
): SampledTrackPoint {
  const lane = resolveLane(runtime.profile, laneId);
  const center = sampleCenterline(runtime, s);

  return {
    ...center,
    x: center.x + center.normal.x * lane.offset,
    y: center.y + center.normal.y * lane.offset,
  };
}

export function sampleLanePath(
  runtime: TrackRuntime,
  laneId: string,
  count = DEFAULT_SAMPLE_COUNT,
): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const s = count <= 1 ? 0 : index / (count - 1);
    return sampleLanePoint(runtime, laneId, s);
  });
}

export function calculateHorsePose(
  runtime: TrackRuntime,
  entry: RacingEntrySnapshot,
  options: {
    now?: Date;
    staleThresholdMs?: number;
  } = {},
): HorsePose {
  const lane = resolveLane(runtime.profile, entry.laneId);
  const state = deriveHorseMotionState(
    entry,
    options.now ?? new Date(),
    options.staleThresholdMs ?? DEFAULT_STALE_THRESHOLD_MS,
  );
  const sampled = sampleLanePoint(runtime, lane.laneId, entry.roundProgress);

  return {
    collisionBox: buildCollisionBox(sampled),
    entryId: entry.entryId,
    laneId: lane.laneId,
    laneResolvedByFallback: lane.laneId !== entry.laneId,
    normal: sampled.normal,
    rotation: sampled.rotation,
    s: sampled.s,
    state,
    tangent: sampled.tangent,
    x: sampled.x,
    y: sampled.y,
    zIndex: Math.round(sampled.y),
  };
}

export function interpolateProgressOnSAxis(input: {
  closed: boolean;
  from: number;
  t: number;
  to: number;
}): number {
  const from = normalizeProgress(input.from);
  const to = normalizeProgress(input.to);
  const t = normalizeProgress(input.t);

  if (!input.closed) {
    return from + (to - from) * t;
  }

  const direct = to - from;
  const wrapped =
    Math.abs(direct) <= 0.5
      ? direct
      : direct > 0
        ? direct - 1
        : direct + 1;
  const value = from + wrapped * t;
  return value < 0 ? value + 1 : value % 1;
}

export function calculateInterpolatedHorsePose(
  runtime: TrackRuntime,
  entry: RacingEntrySnapshot,
  previousRoundProgress: number,
  t: number,
): HorsePose {
  return calculateHorsePose(runtime, {
    ...entry,
    roundProgress: interpolateProgressOnSAxis({
      closed: runtime.profile.centerline.closed,
      from: previousRoundProgress,
      t,
      to: entry.roundProgress,
    }),
  });
}

export function calculateHorsePoses(
  runtime: TrackRuntime,
  entries: RacingEntrySnapshot[],
  now = new Date(),
): HorsePose[] {
  return entries
    .map((entry) => calculateHorsePose(runtime, entry, { now }))
    .sort((left, right) => left.zIndex - right.zIndex);
}

export function deriveHorseMotionState(
  entry: RacingEntrySnapshot,
  now: Date,
  staleThresholdMs = DEFAULT_STALE_THRESHOLD_MS,
): HorseMotionState {
  const updatedAt = Date.parse(entry.updatedAt);
  if (!Number.isFinite(updatedAt)) {
    return "stale";
  }

  if (now.getTime() - updatedAt > staleThresholdMs) {
    return "stale";
  }

  if (entry.status !== "running") {
    return entry.status;
  }

  if (entry.riskLevel === "high" || entry.obstacleCount > 0) {
    return "slowed";
  }

  if (entry.roundProgress >= 0.92 || entry.phaseProgress === 1) {
    return "sprinting";
  }

  return "running";
}

export function selectMessageBubbles(
  profile: TrackProfile,
  poses: HorsePose[],
  entries: RacingEntrySnapshot[],
  maxGlobal = 3,
): MessageBubbleCandidate[] {
  const poseMap = new Map(poses.map((pose) => [pose.entryId, pose]));
  const candidates = entries
    .filter((entry) => entry.lastMessage?.displayMode === "bubble")
    .sort(compareMessagePriority)
    .flatMap((entry) => {
      const pose = poseMap.get(entry.entryId);
      if (!pose || isInsideNoBubbleZone(profile, pose.s) || !entry.lastMessage) {
        return [];
      }

      const zone = findMessageZone(profile, pose.s);
      return [{
        entryId: entry.entryId,
        height: 54,
        message: entry.lastMessage,
        width: 210,
        x: pose.x + zone.dx,
        y: pose.y + zone.dy,
      }];
    });

  return avoidBubbleCollisions(candidates).slice(0, maxGlobal);
}

function buildSegments(profile: TrackProfile): TrackSegment[] {
  const points = profile.centerline.points;
  const pairs = points.slice(0, -1).map((point, index) => ({
    end: points[index + 1],
    start: point,
  }));

  if (profile.centerline.closed) {
    pairs.push({
      end: points[0],
      start: points[points.length - 1],
    });
  }

  let cumulativeStart = 0;
  return pairs.map(({ end, start }) => {
    const length = distance(start, end);
    const segment = {
      cumulativeStart,
      end,
      length,
      start,
    };
    cumulativeStart += length;
    return segment;
  });
}

function sampleCenterlinePoints(runtime: TrackRuntime, count: number): SampledTrackPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const s = count <= 1 ? 0 : index / (count - 1);
    return sampleCenterline(runtime, s);
  });
}

function collectLaneErrors(lanes: TrackLane[], errors: string[]): void {
  const ids = new Set<string>();
  const offsets = new Set<number>();

  for (const lane of lanes) {
    if (ids.has(lane.laneId)) {
      errors.push(`duplicate laneId: ${lane.laneId}`);
    }
    ids.add(lane.laneId);

    if (offsets.has(lane.offset)) {
      errors.push(`duplicate lane offset: ${lane.offset}`);
    }
    offsets.add(lane.offset);
  }
}

function collectZoneErrors(profile: TrackProfile, errors: string[]): void {
  for (const zone of [
    ...profile.messageZones,
    ...profile.noBubbleZones,
    ...profile.riskZones,
  ]) {
    if (zone.sStart > zone.sEnd) {
      errors.push(`${zone.zoneId} has sStart greater than sEnd`);
    }
  }
}

function collectGeometryWarnings(
  segments: TrackSegment[],
  pathLength: number,
  warnings: string[],
): void {
  if (segments.some((segment) => segment.length === 0)) {
    warnings.push("centerline contains duplicate adjacent points");
  }

  for (let index = 1; index < segments.length; index += 1) {
    const angle = angleBetween(segments[index - 1], segments[index]);
    if (angle > 135) {
      warnings.push(`sharp turn detected near segment ${index}`);
    }
  }

  const longest = Math.max(...segments.map((segment) => segment.length));
  if (pathLength > 0 && longest / pathLength > 0.45) {
    warnings.push("one segment owns too much of the path; add control points");
  }
}

function findSegment(segments: TrackSegment[], targetDistance: number): TrackSegment {
  const fallback = segments[segments.length - 1];
  if (!fallback) {
    throw new Error("track runtime has no segments");
  }

  return (
    segments.find(
      (segment) =>
        targetDistance >= segment.cumulativeStart &&
        targetDistance <= segment.cumulativeStart + segment.length,
    ) ?? fallback
  );
}

export function resolveLane(profile: TrackProfile, laneId: string | undefined): TrackLane {
  const lane = profile.lanes.find((item) => item.laneId === laneId);
  return lane ?? profile.lanes[0];
}

function buildCollisionBox(point: Point): HorsePose["collisionBox"] {
  return {
    height: 50,
    width: 74,
    x: point.x - 37,
    y: point.y - 25,
  };
}

function findMessageZone(profile: TrackProfile, s: number): { dx: number; dy: number } {
  const zone = profile.messageZones
    .filter((item) => s >= item.sStart && s <= item.sEnd)
    .sort((left, right) => right.priority - left.priority)[0];

  return {
    dx: zone?.dx ?? 18,
    dy: zone?.dy ?? -74,
  };
}

function isInsideNoBubbleZone(profile: TrackProfile, s: number): boolean {
  return profile.noBubbleZones.some((zone) => s >= zone.sStart && s <= zone.sEnd);
}

function avoidBubbleCollisions(
  candidates: MessageBubbleCandidate[],
): MessageBubbleCandidate[] {
  const placed: MessageBubbleCandidate[] = [];

  for (const candidate of candidates) {
    let y = candidate.y;
    while (placed.some((item) => overlaps({ ...candidate, y }, item))) {
      y -= candidate.height + 8;
    }
    placed.push({ ...candidate, y });
  }

  return placed;
}

function compareMessagePriority(
  left: RacingEntrySnapshot,
  right: RacingEntrySnapshot,
): number {
  const weights = {
    critical: 5,
    high: 4,
    info: 1,
    low: 2,
    medium: 3,
  };

  const leftWeight = weights[left.lastMessage?.severity ?? "info"];
  const rightWeight = weights[right.lastMessage?.severity ?? "info"];
  return rightWeight - leftWeight;
}

function overlaps(left: MessageBubbleCandidate, right: MessageBubbleCandidate): boolean {
  return !(
    left.x + left.width < right.x ||
    right.x + right.width < left.x ||
    left.y + left.height < right.y ||
    right.y + right.height < left.y
  );
}

function emptyReport(errors: string[]): TrackValidationReport {
  return {
    errors,
    metrics: {
      pathLength: 0,
      sampleCount: 0,
    },
    valid: false,
    warnings: [],
  };
}

function sumSegments(segments: TrackSegment[]): number {
  return segments.reduce((total, segment) => total + segment.length, 0);
}

function lerpPoint(start: Point, end: Point, t: number): Point {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

function normalizeVector(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 1, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function distance(left: Point, right: Point): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function angleBetween(left: TrackSegment, right: TrackSegment): number {
  const a = normalizeVector({
    x: left.end.x - left.start.x,
    y: left.end.y - left.start.y,
  });
  const b = normalizeVector({
    x: right.end.x - right.start.x,
    y: right.end.y - right.start.y,
  });
  const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y));
  return radiansToDegrees(Math.acos(dot));
}

function radiansToDegrees(value: number): number {
  return (value * 180) / Math.PI;
}
