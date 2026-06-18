// track-runtime 统一导出
export type {
  Point,
  Lane,
  Checkpoint,
  MessageZone,
  NoBubbleZone,
  TrackProfile,
  RacingEntrySnapshot,
  HorsePose,
  HorseMotionState,
  RaceSnapshot,
  Competition,
  CompetitionKPI,
  RidingMessageSnapshot,
  AttentionItem,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "./types";

export { samplePath, sampleAt, tangentAngle, normal } from "./path-sampler";
export type { SampledPath } from "./path-sampler";

export { calculateHorsePose, calculateAllHorsePoses, clearPathCache } from "./pose-calculator";

export { assignLane, assignAllLanes } from "./lane-manager";
export type { LaneAssignment } from "./lane-manager";

export { resolveMotionState, getMotionVisuals } from "./animation-state";

export { validateTrackProfile } from "./validator";
