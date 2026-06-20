"use client";

import ParticleBackground from "@/app/_components/particle-background";

/**
 * 客户端包装器。
 * mode: "constellation"（光点+连线网络）| "drift"（大柔光团漂浮）
 */
export function ParticleLayer() {
  return <ParticleBackground mode="drift" />;
}
