// Calibrator 编辑器状态管理（useReducer）

import type { Point, TrackProfile, Lane, Checkpoint } from "../track-runtime/types";

export interface CalibratorState {
  // 赛道元信息
  trackId: string;
  name: string;
  schemaVersion: string;

  // 画布 & 背景
  viewBox: { w: number; h: number };
  background: {
    src: string;
    naturalWidth: number;
    naturalHeight: number;
  } | null;

  // 中心线
  centerline: {
    type: "polyline";
    closed: boolean;
    points: Point[];
    smoothing: "catmull-rom" | "linear";
  };

  // 方向 & 起终点
  direction: "clockwise" | "counterclockwise";
  startFinish: { s: number };

  // 车道
  lanes: Lane[];

  // 检查点
  checkpoints: Checkpoint[];

  // 交互状态
  selectedPointIndex: number | null;
  isDragging: boolean;
  canvasScale: number;

  // 预览
  previewProgress: number;
  previewHorseCount: number;
  previewSpeed: number;
  isPlaying: boolean;

  // 校验
  validationErrors: string[];
  validationWarnings: string[];
}

export type CalibratorAction =
  | { type: "SET_BACKGROUND"; payload: { src: string; naturalWidth: number; naturalHeight: number } }
  | { type: "SET_VIEWBOX"; payload: { w: number; h: number } }
  | { type: "SET_NAME"; payload: string }
  | { type: "ADD_POINT"; payload: Point }
  | { type: "MOVE_POINT"; payload: { index: number; point: Point } }
  | { type: "DELETE_POINT"; payload: { index: number } }
  | { type: "SELECT_POINT"; payload: number | null }
  | { type: "START_DRAG" }
  | { type: "END_DRAG" }
  | { type: "SET_CLOSED"; payload: boolean }
  | { type: "REVERSE_DIRECTION" }
  | { type: "SET_START_FINISH"; payload: number }
  | { type: "ADD_LANE"; payload: Lane }
  | { type: "UPDATE_LANE"; payload: { index: number; lane: Lane } }
  | { type: "REMOVE_LANE"; payload: { index: number } }
  | { type: "ADD_CHECKPOINT"; payload: Checkpoint }
  | { type: "UPDATE_CHECKPOINT"; payload: { index: number; checkpoint: Checkpoint } }
  | { type: "REMOVE_CHECKPOINT"; payload: { index: number } }
  | { type: "SET_PREVIEW_PROGRESS"; payload: number }
  | { type: "SET_PREVIEW_HORSE_COUNT"; payload: number }
  | { type: "SET_PREVIEW_SPEED"; payload: number }
  | { type: "TOGGLE_PLAY" }
  | { type: "SET_VALIDATION"; payload: { errors: string[]; warnings: string[] } }
  | { type: "LOAD_PROFILE"; payload: TrackProfile }
  | { type: "SET_SCALE"; payload: number };

export function createInitialState(initialProfile?: TrackProfile): CalibratorState {
  const defaultState: CalibratorState = {
    trackId: `track-${Date.now()}`,
    name: "新赛道",
    schemaVersion: "1.0",
    viewBox: { w: 2560, h: 1263 },
    background: null,
    centerline: {
      type: "polyline",
      closed: true,
      points: [
        { x: 1280, y: 121 },
        { x: 1795, y: 189 },
        { x: 2172, y: 376 },
        { x: 2310, y: 631 },
        { x: 2172, y: 886 },
        { x: 1795, y: 1073 },
        { x: 1280, y: 1141 },
        { x: 765, y: 1073 },
        { x: 388, y: 886 },
        { x: 250, y: 631 },
        { x: 388, y: 376 },
        { x: 765, y: 189 },
      ],
      smoothing: "catmull-rom",
    },
    direction: "clockwise",
    startFinish: { s: 0 },
    lanes: [
      { id: "lane-0", name: "内侧车道", offset: -60 },
      { id: "lane-1", name: "中间车道", offset: 0 },
      { id: "lane-2", name: "外侧车道", offset: 60 },
    ],
    checkpoints: [],
    selectedPointIndex: null,
    isDragging: false,
    canvasScale: 1,
    previewProgress: 0,
    previewHorseCount: 1,
    previewSpeed: 1,
    isPlaying: false,
    validationErrors: [],
    validationWarnings: [],
  };

  if (!initialProfile) {
    return defaultState;
  }

  return {
    ...defaultState,
    background: initialProfile.background,
    centerline: initialProfile.centerline,
    checkpoints: initialProfile.checkpoints,
    direction: initialProfile.direction,
    lanes: initialProfile.lanes,
    name: initialProfile.name,
    schemaVersion: initialProfile.schemaVersion,
    startFinish: initialProfile.startFinish,
    trackId: initialProfile.trackId,
    viewBox: initialProfile.viewBox,
  };
}

export function calibratorReducer(
  state: CalibratorState,
  action: CalibratorAction,
): CalibratorState {
  switch (action.type) {
    case "SET_BACKGROUND":
      return {
        ...state,
        background: action.payload,
        viewBox: { w: action.payload.naturalWidth, h: action.payload.naturalHeight },
      };

    case "SET_VIEWBOX":
      return { ...state, viewBox: action.payload };

    case "SET_NAME":
      return { ...state, name: action.payload };

    case "ADD_POINT": {
      const points = state.selectedPointIndex !== null
        ? [
            ...state.centerline.points.slice(0, state.selectedPointIndex + 1),
            action.payload,
            ...state.centerline.points.slice(state.selectedPointIndex + 1),
          ]
        : [...state.centerline.points, action.payload];
      return {
        ...state,
        centerline: { ...state.centerline, points },
        selectedPointIndex: state.selectedPointIndex !== null
          ? state.selectedPointIndex + 1
          : points.length - 1,
      };
    }

    case "MOVE_POINT": {
      const points = [...state.centerline.points];
      if (points[action.payload.index]) {
        points[action.payload.index] = action.payload.point;
      }
      return { ...state, centerline: { ...state.centerline, points } };
    }

    case "DELETE_POINT": {
      const points = state.centerline.points.filter(
        (_, i) => i !== action.payload.index,
      );
      return {
        ...state,
        centerline: { ...state.centerline, points },
        selectedPointIndex: null,
      };
    }

    case "SELECT_POINT":
      return { ...state, selectedPointIndex: action.payload };

    case "START_DRAG":
      return { ...state, isDragging: true };

    case "END_DRAG":
      return { ...state, isDragging: false };

    case "SET_CLOSED":
      return { ...state, centerline: { ...state.centerline, closed: action.payload } };

    case "REVERSE_DIRECTION":
      return {
        ...state,
        centerline: {
          ...state.centerline,
          points: [...state.centerline.points].reverse(),
        },
        direction: state.direction === "clockwise" ? "counterclockwise" : "clockwise",
      };

    case "SET_START_FINISH":
      return { ...state, startFinish: { s: action.payload } };

    case "ADD_LANE":
      return { ...state, lanes: [...state.lanes, action.payload] };

    case "UPDATE_LANE": {
      const lanes = [...state.lanes];
      lanes[action.payload.index] = action.payload.lane;
      return { ...state, lanes };
    }

    case "REMOVE_LANE": {
      const lanes = state.lanes.filter((_, i) => i !== action.payload.index);
      return { ...state, lanes };
    }

    case "ADD_CHECKPOINT":
      return { ...state, checkpoints: [...state.checkpoints, action.payload] };

    case "UPDATE_CHECKPOINT": {
      const checkpoints = [...state.checkpoints];
      checkpoints[action.payload.index] = action.payload.checkpoint;
      return { ...state, checkpoints };
    }

    case "REMOVE_CHECKPOINT": {
      const checkpoints = state.checkpoints.filter(
        (_, i) => i !== action.payload.index,
      );
      return { ...state, checkpoints };
    }

    case "SET_PREVIEW_PROGRESS":
      return { ...state, previewProgress: action.payload };

    case "SET_PREVIEW_HORSE_COUNT":
      return { ...state, previewHorseCount: action.payload };

    case "SET_PREVIEW_SPEED":
      return { ...state, previewSpeed: action.payload };

    case "TOGGLE_PLAY":
      return { ...state, isPlaying: !state.isPlaying };

    case "SET_VALIDATION":
      return {
        ...state,
        validationErrors: action.payload.errors,
        validationWarnings: action.payload.warnings,
      };

    case "LOAD_PROFILE": {
      return {
        ...createInitialState(action.payload),
        previewHorseCount: state.previewHorseCount,
        previewProgress: state.previewProgress,
        previewSpeed: state.previewSpeed,
        isPlaying: state.isPlaying,
      };
    }

    case "SET_SCALE":
      return { ...state, canvasScale: action.payload };

    default:
      return state;
  }
}

/**
 * 将 CalibratorState 导出为 TrackProfile
 */
export function toTrackProfile(state: CalibratorState): TrackProfile {
  return {
    schemaVersion: state.schemaVersion,
    trackId: state.trackId,
    name: state.name,
    viewBox: state.viewBox,
    background: state.background ?? {
      src: "",
      naturalWidth: state.viewBox.w,
      naturalHeight: state.viewBox.h,
    },
    centerline: state.centerline,
    direction: state.direction,
    startFinish: state.startFinish,
    lanes: state.lanes,
    checkpoints: state.checkpoints,
  };
}
