export function RiderProfilePageView({
  username, featuredRaceTitle, featuredWorkTitle, judgeComments, orgLabel,
  performanceSummary, publicWorkLinks, raceCount, raceRecords,
  reportSummaries: _reportSummaries, skillTags, workCount,
}: {
  username: string; featuredRaceTitle: null | string; featuredWorkTitle: null | string;
  judgeComments: Array<{ raceTitle: string; summary: string }>; orgLabel: string;
  performanceSummary: { averageProgressPercent: number; riskCount: number; totalTokens: number };
  raceCount: number; workCount: number; skillTags: string[];
  raceRecords: Array<{ raceId: string; raceSlug: string; raceTitle: string; phase: string;
    awardScore: null | number; awardNames: string[]; comment: null | string;
    evidenceCount: number; workTitle: null | string; }>;
  publicWorkLinks: Array<{ title: string; href: string }>; reportSummaries: string[];
}) {
  const reviewSummaries = raceRecords.filter((r) => r.comment).map((r) => r.comment as string);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gridAutoRows: "auto",
      gap: 16,
      alignItems: "start",
    }}>
      {/* Card 1: Hero — spans 2 cols */}
      <div className="card" style={{ gridColumn: "span 2", padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "var(--radius-2xl)",
            background: "linear-gradient(135deg,var(--accent),var(--accent-secondary))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 36, fontWeight: 700, flexShrink: 0,
            boxShadow: "var(--shadow-accent)",
          }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: "1.75rem", marginBottom: 4 }}>{username}</h1>
            <p className="muted" style={{ fontSize: "0.9375rem" }}>{orgLabel}</p>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            <Stat value={raceCount} label="赛事" />
            <Stat value={workCount} label="作品" />
            <Stat value={fmtNum(performanceSummary.totalTokens)} label="Tokens" />
          </div>
        </div>
      </div>

      {/* Card 2: Skill tags — small card, top-right */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
          能力标签
        </div>
        {skillTags.length === 0 ? (
          <p className="muted text-sm">暂无标签</p>
        ) : (
          <div className="flex-row">{skillTags.map((t) => <span className="file-chip" key={t}>{t}</span>)}</div>
        )}
      </div>

      {/* Card 3: Race timeline — wide bottom card, spans 2 cols */}
      <div className="card" style={{ gridColumn: "span 2", padding: 24 }}>
        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: 16, fontFamily: "var(--font-mono)" }}>
          参赛记录
        </div>
        {raceRecords.length === 0 ? (
          <p className="muted text-sm">暂无参赛记录。</p>
        ) : (
          <div className="stack" style={{ gap: 0 }}>
            {raceRecords.map((r) => (
              <a href={`/races/${r.raceSlug}`} key={r.raceId} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 0", borderBottom: "1px solid var(--border)",
                textDecoration: "none", color: "inherit", flexWrap: "wrap", gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                  <strong style={{ fontSize: "0.9375rem" }}>{r.raceTitle}</strong>
                  <span className="badge badge-accent">{r.phase}</span>
                </div>
                <div className="flex-row" style={{ gap: 16, fontSize: "0.8125rem" }}>
                  <span className="muted">{r.awardScore != null ? `#${r.awardScore}` : "—"}</span>
                  {r.awardNames.length > 0 && <span style={{ color: "var(--accent)" }}>{r.awardNames.join(" · ")}</span>}
                  <span className="muted">作品：{r.workTitle ?? "—"}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Card 4: Review summaries — small right card */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
          评审摘要
        </div>
        <div className="stack">
          {reviewSummaries.length === 0 ? (
            <p className="muted text-sm">暂无</p>
          ) : (
            reviewSummaries.slice(0, 3).map((s, i) => (
              <blockquote className="comment-card" key={i}>{s}</blockquote>
            ))
          )}
        </div>
      </div>

      {/* Card 5: Judge comments + Works — bottom-right, spans 1 col + row */}
      {judgeComments.length > 0 && (
        <div className="card" style={{ padding: 20, gridColumn: "span 1" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
            评委评语
          </div>
          <div className="stack">
            {judgeComments.map((c, i) => (
              <blockquote className="comment-card" key={i}>
                <strong style={{ fontSize: "0.8125rem" }}>{c.raceTitle}</strong>
                <p className="muted text-sm" style={{ marginTop: 4 }}>{c.summary}</p>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {publicWorkLinks.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
            公开作品
          </div>
          <div className="stack">
            {publicWorkLinks.map((w) => (
              <a className="public-link-card" href={w.href} key={w.href}>
                <strong style={{ fontSize: "0.9375rem" }}>{w.title}</strong>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>{value}</div>
      <div className="muted" style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

function fmtNum(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n); }
