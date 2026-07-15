"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import ParticleBackground from "@/app/_components/particle-background";

interface RiderInfo {
  username: string;
  orgLabel: string;
  workCount: number;
  raceCount: number;
  riderSlug: string;
  featuredRaceTitle?: string;
}

export function ParticleLayer({ riders }: { riders: RiderInfo[] }) {
  const pathname = usePathname();
  const [popup, setPopup] = useState<{ x: number; y: number; rider: RiderInfo } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Hide particles on screen/jumbotron display pages
  if (pathname && (pathname.startsWith("/screen") || pathname.startsWith("/jumbotron"))) return null;

  const onParticleClick = useCallback((e: MouseEvent) => {
    if (riders.length === 0) return;
    const rider = riders[Math.floor(Math.random() * riders.length)];
    setPopup({ x: e.clientX, y: e.clientY, rider });
  }, [riders]);

  // Close on outside click
  useEffect(() => {
    if (!popup) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    };
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [popup]);

  return (
    <>
      <ParticleBackground mode="drift" onParticleClick={onParticleClick} />
      {popup && (
        <div ref={popupRef} style={{
          position: "fixed",
          left: Math.min(popup.x + 20, window.innerWidth - 280),
          top: Math.min(popup.y - 100, window.innerHeight - 220),
          zIndex: 9999,
          width: 260,
        }}>
          <div className="card" style={{
            padding: 20,
            boxShadow: "var(--shadow-elevated)",
            cursor: "default",
            animation: "fadeIn 0.25s ease",
          }}>
            <button onClick={() => setPopup(null)} style={{
              position: "absolute", top: 10, right: 14,
              border: "none", background: "none", fontSize: 16,
              cursor: "pointer", color: "var(--muted-foreground)", lineHeight: 1,
            }}>×</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "var(--radius-full)",
                background: "linear-gradient(135deg,var(--accent),var(--accent-secondary))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 18,
              }}>
                {popup.rider.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong style={{ fontSize: "1rem", display: "block" }}>{popup.rider.username}</strong>
                <span className="muted text-xs">{popup.rider.orgLabel}</span>
              </div>
            </div>
            <div className="detail-grid" style={{ marginBottom: 12 }}>
              <div><dt>参赛</dt><dd>{popup.rider.raceCount} 场</dd></div>
              <div><dt>作品</dt><dd>{popup.rider.workCount} 件</dd></div>
            </div>
            <a href={`/riders/${popup.rider.riderSlug}`} className="button-secondary" style={{ width: "100%", fontSize: 13, minHeight: 36 }}>
              查看骑手档案 →
            </a>
          </div>
        </div>
      )}
    </>
  );
}
