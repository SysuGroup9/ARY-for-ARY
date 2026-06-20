import { formatDateTime } from "@/lib/format";
import type { RaceListItem } from "@/lib/services/races";

export function RacePageView({ race, raceSlug }: { race: RaceListItem; raceSlug: string }) {
  const cta =
    race.phase === "registration" || race.phase === "preparation"
      ? { href: `/races/${raceSlug}/register`, label: "进入报名页面" }
      : race.phase === "active" || race.phase === "frozen" || race.phase === "running" || race.phase === "submitting"
        ? { href: `/races/${raceSlug}/live`, label: "进入实况大厅" }
        : { href: `/races/${raceSlug}/results`, label: "查看赛果" };

  const isActive = race.phase === "active" || race.phase === "frozen" || race.phase === "running" || race.phase === "submitting";
  const riderSubmitHref = `/console/races/${raceSlug}/rider/submission`;

  return (
    <div className="stack" style={{ gap: "var(--space-6)" }}>
      {/* 标题区 */}
      <section className="hero" style={{ textAlign: "left", padding: "24px 0 8px" }}>
        <div className="section-label"><span className="section-label__dot" />{race.phase}</div>
        <h1 style={{ fontSize: "clamp(2rem,4vw,2.5rem)", marginBottom: 12, lineHeight: 1.15 }}>{race.title}</h1>
        <p className="muted" style={{ fontSize: "1.0625rem", maxWidth: "100%", margin: 0 }}>{race.summary}</p>
      </section>

      {/* 指标 + CTA */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, padding: "20px 28px" }}>
        <div className="detail-grid" style={{ flex: 1 }}>
          <div><dt>报名时间</dt><dd style={{fontSize:"0.8125rem"}}>{formatDateTime(race.signupStart)} - {formatDateTime(race.signupEnd)}</dd></div>
          <div><dt>比赛时间</dt><dd style={{fontSize:"0.8125rem"}}>{formatDateTime(race.raceStart)} - {formatDateTime(race.raceEnd)}</dd></div>
        </div>
        <div className="flex-row">
          <a className="button" href={cta.href} style={{ height: 52, padding: "0 28px", fontSize: "1rem" }}>{cta.label} →</a>
          {isActive ? (
            <a className="button-secondary" href={riderSubmitHref} style={{ height: 52, fontSize: "0.9375rem" }}>
              选手提交入口
            </a>
          ) : null}
        </div>
      </div>

      {/* 上下文 + 规则 */}
      <div className="grid-2">
        <div className="card">
          <div className="section-label"><span className="section-label__dot" />赛事上下文</div>
          <p>{race.taskDescription}</p>
          <p className="muted text-sm" style={{ marginTop: 8 }}>{race.evaluationNotes}</p>
        </div>
        <div className="card">
          <div className="section-label"><span className="section-label__dot" />规则与赛程</div>
          <div className="stack">
            <div><dt>题目包</dt><dd>{race.taskPackageLabel}</dd></div>
            <div><dt>关键词</dt><dd>{race.keywords.join(" / ")}</dd></div>
            <div className="muted text-sm">报名：{formatDateTime(race.signupStart)} - {formatDateTime(race.signupEnd)}</div>
            <div className="muted text-sm">比赛：{formatDateTime(race.raceStart)} - {formatDateTime(race.raceEnd)}</div>
          </div>
        </div>
      </div>

      {/* 子页面入口 */}
      <div className="card">
        <div className="section-label"><span className="section-label__dot" />赛事入口</div>
        <div className="flex-row" style={{ marginTop: 8 }}>
          <a className="button-secondary" href={`/races/${raceSlug}/live`}>实况大厅</a>
          <a className="button-secondary" href={`/races/${raceSlug}/works`}>查看作品</a>
          <a className="button-secondary" href={`/races/${raceSlug}/results`}>查看赛果</a>
          <a className="button-secondary" href={`/races/${raceSlug}/review`}>查看复盘</a>
          <a className="button-secondary" href="/races">返回赛事列表</a>
        </div>
      </div>

      {/* 参赛骑手 */}
      {race.teams.length > 0 && (
        <div className="card">
          <div className="section-label"><span className="section-label__dot" />参赛骑手</div>
          <div className="grid-3" style={{ marginTop: 8 }}>
            {race.teams.map((team) => (
              <a className="public-link-card" key={team.id} href={`/riders/${team.captain.username}`}>
                <strong>{team.name}</strong>
                <span className="muted text-sm">{team.captain.username}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
