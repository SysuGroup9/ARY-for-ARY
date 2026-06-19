"use client";

import { useState, useEffect, useCallback } from "react";
import JumbotronClient from "@/app/jumbotron/[raceId]/JumbotronClient";
import type { RaceSnapshot, TrackProfile } from "@/lib/jumbotron/track-runtime/types";

interface JumbotronData {
  raceId: string;
  raceTitle: string;
  snapshot: RaceSnapshot;
  trackProfile: TrackProfile;
}

interface Props {
  initialIndex?: number;
  items: JumbotronData[];
}

export default function JumbotronBanner({ initialIndex = 0, items }: Props) {
  const [current, setCurrent] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % items.length);
    setIsPaused(true);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + items.length) % items.length);
    setIsPaused(true);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length, isPaused]);

  if (items.length === 0) return null;

  const item = items[current];

  return (
    <div className="jt-banner">
      {/* 导航 */}
      <div className="jt-banner-nav">
        <span className="jt-banner-label">🏇 Live Race Switcher</span>
        <div className="jt-banner-tabs">
          {items.map((it, i) => (
            <button
              key={it.raceId}
              className={`jt-banner-tab ${i === current ? "active" : ""}`}
              onClick={() => {
                setCurrent(i);
                setIsPaused(true);
              }}
            >
              {it.raceTitle}
            </button>
          ))}
        </div>
        <div className="jt-banner-controls">
          <button onClick={prev} title="上一个">◀</button>
          <button onClick={() => setIsPaused((value) => !value)} title={isPaused ? "恢复自动轮播" : "暂停并锁定当前比赛"}>
            {isPaused ? "▶ 自动" : "⏸ 暂停"}
          </button>
          <button onClick={next} title="下一个">▶</button>
          <span className="jt-banner-counter">{isPaused ? "已锁定" : "自动轮播"} · {current + 1}/{items.length}</span>
          <a href={`/jumbotron/${item.raceId}`} target="_blank" style={{color:"#c34e36",fontSize:12,textDecoration:"none",marginLeft:8,fontWeight:600}}>🔲 全屏</a>
        </div>
      </div>

      {/* Jumbotron 画面 */}
      <div className="jt-banner-stage">
        <JumbotronClient snapshot={item.snapshot} trackProfile={item.trackProfile} />
      </div>

      <style>{bannerStyles}</style>
    </div>
  );
}

const bannerStyles = `
.jt-banner {
  width: 100%;
  background: #f2eadf;
  border: 1.5px solid rgba(68,55,37,0.12);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 4px 24px rgba(79,57,31,0.08);
}

.jt-banner-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  background: rgba(255,252,247,0.9);
  border-bottom: 1px solid rgba(68,55,37,0.08);
  flex-wrap: wrap;
}

.jt-banner-label {
  color: #c34e36;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}

.jt-banner-tabs {
  display: flex;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
}

.jt-banner-tab {
  padding: 4px 12px;
  border: 1px solid rgba(68,55,37,0.12);
  border-radius: 99px;
  background: transparent;
  color: #65584b;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.jt-banner-tab.active {
  background: rgba(195,78,54,0.08);
  border-color: #c34e36;
  color: #c34e36;
}

.jt-banner-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.jt-banner-controls button {
  padding: 2px 8px;
  border: 1px solid rgba(68,55,37,0.12);
  border-radius: 99px;
  background: transparent;
  color: #65584b;
  cursor: pointer;
  font-size: 12px;
}

.jt-banner-controls button:hover { color: #c34e36; background: rgba(195,78,54,0.06); }
.jt-banner-counter { color: #8b7b6e; font-size: 11px; }

.jt-banner-stage {
  width: 100%;
  height: clamp(700px, 95vh, 1200px);
  background: #f2eadf;
}
`;
