"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { getRacePrimaryCta, groupPublicRacesByPhase } from "@/lib/public-site";
import type { ReturnTypeOfBuildPublicSiteModel } from "@/lib/public-site-types";
import { getRacePhaseLabel } from "@/lib/race-phase";

const TABS = [
  { key: "all", label: "全部" },
  { key: "featured", label: "主推" },
  { key: "active", label: "进行中" },
  { key: "upcoming", label: "报名中" },
  { key: "past", label: "往届" },
] as const;

export function RacesIndexPageView({ model }: { model: ReturnTypeOfBuildPublicSiteModel }) {
  const [tab, setTab] = useState<string>("all");
  const [query, setQuery] = useState("");

  const grouped = groupPublicRacesByPhase(model.featuredRaces);
  const active = [...grouped.active, ...grouped.frozen];
  const upcoming = [...grouped.registration, ...grouped.preparation];

  const allRaces = model.featuredRaces.map((r) => ({
    race: r,
    category: active.some((a) => a.id === r.id) ? "active"
      : upcoming.some((u) => u.id === r.id) ? "upcoming"
      : model.pastRaces.some((p) => p.id === r.id) ? "past"
      : "other",
  }));

  const filtered = allRaces.filter(({ race, category }) => {
    if (tab === "featured") return model.featuredRaces.some((f) => f.id === race.id);
    if (tab === "active") return category === "active";
    if (tab === "upcoming") return category === "upcoming";
    if (tab === "past") return category === "past";
    return true; // all
  }).filter(({ race }) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return race.title.toLowerCase().includes(q) || race.summary.toLowerCase().includes(q);
  });

  const activeCount = active.length;
  const upcomingCount = upcoming.length;
  const pastCount = model.pastRaces.length;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <section style={{ paddingTop: 8 }}>
        <h1 style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)", marginBottom: 20 }}>赛事列表</h1>

        {/* Tabs */}
        <div className="flex-row" style={{ gap: 4, marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 18px", border: 0, borderRadius: "var(--radius-full)",
                cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                background: tab === t.key
                  ? "linear-gradient(135deg,var(--accent),var(--accent-secondary))"
                  : "var(--muted)",
                color: tab === t.key ? "#fff" : "var(--muted-foreground)",
                transition: "all 0.15s",
              }}>
              {t.label}
              {t.key === "active" ? ` ${activeCount}` : ""}
              {t.key === "upcoming" ? ` ${upcomingCount}` : ""}
              {t.key === "past" ? ` ${pastCount}` : ""}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 400 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", fontSize: 14 }}>🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索赛事名称或描述..."
            style={{ paddingLeft: 40, height: 44, fontSize: "0.9375rem" }}
          />
        </div>
      </section>

      {/* Results */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {filtered.length === 0 ? (
          <p className="muted text-sm" style={{ gridColumn: "1/-1", textAlign: "center", padding: 40 }}>
            {query ? "没有匹配的赛事" : "暂无赛事"}
          </p>
        ) : (
          filtered.map(({ race }) => {
            const cta = getRacePrimaryCta(race);
            return (
              <article className="card card-accent" key={race.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <strong style={{ fontSize: "1rem", lineHeight: 1.3 }}>{race.title}</strong>
                  <span className="badge badge-accent" style={{ flexShrink: 0 }}>{getRacePhaseLabel(race.phase)}</span>
                </div>
                <p className="muted text-sm" style={{ marginBottom: 12, lineHeight: 1.6 }}>{race.summary}</p>
                <small className="muted" style={{ fontSize: "0.8rem" }}>{formatDateTime(race.raceStart)} - {formatDateTime(race.raceEnd)}</small>
                <div className="flex-row" style={{ marginTop: 16 }}>
                  <a className="button-secondary" href={cta.href} style={{ fontSize: 13, minHeight: 36 }}>{cta.label}</a>
                  <a className="button-secondary" href={`/races/${race.slug}`} style={{ fontSize: 13, minHeight: 36 }}>赛事详情</a>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
