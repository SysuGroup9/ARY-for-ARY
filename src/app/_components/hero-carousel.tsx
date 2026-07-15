"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDateTime } from "@/lib/format";
import { getRacePrimaryCta } from "@/lib/public-site";
import { getRacePhaseLabel } from "@/lib/race-phase";

interface RaceItem {
  id: string; slug: string; title: string; summary: string;
  phase: string; raceStart: Date; raceEnd: Date;
  activeRiderCount?: number; workCount?: number;
}

export default function HeroCarousel({ races }: { races: RaceItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive((a) => (a + 1) % races.length), [races.length]);
  const prev = useCallback(() => setActive((a) => (a - 1 + races.length) % races.length), [races.length]);

  useEffect(() => {
    if (paused || races.length < 2) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, races.length, next]);

  if (races.length === 0) return null;

  const main = races[active];
  const prevIdx = (active - 1 + races.length) % races.length;
  const nextIdx = (active + 1) % races.length;
  const cta = getRacePrimaryCta(main);

  return (
    <div
      style={{ display: "flex", gap: 16, alignItems: "stretch", minHeight: 280 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Side card left */}
      {races.length > 1 && (
        <div
          onClick={() => setActive(prevIdx)}
          style={{
            flex: 1, minWidth: 160, maxWidth: 200, cursor: "pointer",
            opacity: 0.4, transform: "scale(0.9)",
            transition: "all 0.4s ease",
          }}
        >
          <article className="card" style={{ height: "100%", padding: 14 }}>
            <span className="badge badge-muted" style={{ marginBottom: 8, fontSize: "0.75rem" }}>{getRacePhaseLabel(races[prevIdx].phase)}</span>
            <strong style={{ fontSize: "0.875rem" }}>{races[prevIdx].title}</strong>
          </article>
        </div>
      )}

      {/* Main card */}
      <div style={{ flex: 5, minWidth: 480, transition: "all 0.4s ease" }}>
        <article className="card card-accent" style={{ height: "100%", padding: 28, boxShadow: "var(--shadow-accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <span className="badge badge-accent" style={{ fontSize: "0.8125rem", padding: "6px 14px" }}>{getRacePhaseLabel(main.phase)}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={prev} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--card)", cursor: "pointer", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>←</button>
              <button onClick={next} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--card)", cursor: "pointer", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>→</button>
            </div>
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>{main.title}</h2>
          <p className="muted" style={{ fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: 16 }}>{main.summary}</p>
          <div className="flex-row" style={{ marginBottom: 16, gap: 20 }}>
            <span className="text-sm">{formatDateTime(main.raceStart)} - {formatDateTime(main.raceEnd)}</span>
            {main.activeRiderCount != null && <span className="muted text-sm">{main.activeRiderCount} 骑手</span>}
            {main.workCount != null && <span className="muted text-sm">{main.workCount} 作品</span>}
          </div>
          <div className="flex-row">
            <a className="button" href={cta.href} style={{ height: 44, padding: "0 24px" }}>{cta.label} →</a>
            <a className="button-secondary" href={`/races/${main.slug}`} style={{ height: 44 }}>赛事详情</a>
          </div>
          {/* Dot indicators */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
            {races.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} style={{
                width: i === active ? 20 : 8, height: 8, borderRadius: 4, border: 0, cursor: "pointer",
                background: i === active ? "var(--accent)" : "var(--border)", transition: "all 0.3s",
              }} />
            ))}
          </div>
        </article>
      </div>

      {/* Side card right */}
      {races.length > 1 && (
        <div
          onClick={() => setActive(nextIdx)}
          style={{
            flex: 1, minWidth: 160, maxWidth: 200, cursor: "pointer",
            opacity: 0.4, transform: "scale(0.9)",
            transition: "all 0.4s ease",
          }}
        >
          <article className="card" style={{ height: "100%", padding: 14 }}>
            <span className="badge badge-muted" style={{ marginBottom: 8, fontSize: "0.75rem" }}>{getRacePhaseLabel(races[nextIdx].phase)}</span>
            <strong style={{ fontSize: "0.875rem" }}>{races[nextIdx].title}</strong>
          </article>
        </div>
      )}
    </div>
  );
}
