// 动画状态机：RacingEntrySnapshot.status → 视觉表现映射
import type { HorseMotionState } from "./types";

const STALE_THRESHOLD_MS = 300_000; // 5 分钟无更新视为 stale（demo 用，生产改为 30s）

export function resolveMotionState(
  status: string,
  updatedAt?: string,
  now: Date = new Date(),
): HorseMotionState {
  // 只对 running/sprinting 检查时间 staleness
  if ((status === "running" || status === "sprinting") && updatedAt) {
    const elapsed = now.getTime() - new Date(updatedAt).getTime();
    if (elapsed > STALE_THRESHOLD_MS) return "stale";
  }

  switch (status) {
    case "idle":
    case "running":
    case "sprinting":
    case "slowed":
    case "blocked":
    case "pit_stop":
    case "takeover":
    case "finished":
    case "stale":
      return status;
    default:
      return "idle";
  }
}

/**
 * 获取状态的视觉属性
 *
 * 用于 CSS/SVG 渲染时决定动画类型、透明度、颜色等
 */
export function getMotionVisuals(state: HorseMotionState): {
  opacity: number;
  speed: string;       // CSS animation-duration
  highlight: boolean;
  pulse: boolean;
  cssClass: string;
} {
  switch (state) {
    case "idle":
      return { opacity: 0.8, speed: "2s", highlight: false, pulse: false, cssClass: "horse-idle" };
    case "running":
      return { opacity: 1, speed: "0.8s", highlight: false, pulse: false, cssClass: "horse-running" };
    case "sprinting":
      return { opacity: 1, speed: "0.4s", highlight: true, pulse: true, cssClass: "horse-sprinting" };
    case "slowed":
      return { opacity: 0.7, speed: "1.5s", highlight: false, pulse: false, cssClass: "horse-slowed" };
    case "blocked":
      return { opacity: 0.6, speed: "0s", highlight: false, pulse: false, cssClass: "horse-blocked" };
    case "pit_stop":
      return { opacity: 0.7, speed: "0s", highlight: false, pulse: true, cssClass: "horse-pitstop" };
    case "takeover":
      return { opacity: 1, speed: "0s", highlight: true, pulse: true, cssClass: "horse-takeover" };
    case "finished":
      return { opacity: 0.9, speed: "0s", highlight: true, pulse: false, cssClass: "horse-finished" };
    case "stale":
      return { opacity: 0.3, speed: "0s", highlight: false, pulse: false, cssClass: "horse-stale" };
    default:
      return { opacity: 0.8, speed: "1s", highlight: false, pulse: false, cssClass: "horse-idle" };
  }
}
