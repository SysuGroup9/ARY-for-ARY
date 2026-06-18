import { formatDateTime } from "@/lib/format";
import type { RaceListItem } from "@/lib/services/races";

export function RacePageView({ race, raceSlug }: { race: RaceListItem; raceSlug: string }) {
  const primaryCta =
    race.phase === "registration" || race.phase === "preparation"
      ? { href: "/login", label: "立即报名" }
      : race.phase === "active" || race.phase === "frozen"
        ? { href: `/races/${raceSlug}/live`, label: "进入实况大厅" }
        : { href: `/races/${raceSlug}/results`, label: "查看赛果" };

  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">{race.phase}</p>
        <h1>{race.title}</h1>
        <p className="muted">{race.summary}</p>
        <div className="detail-grid" style={{ marginTop: "1rem" }}>
          <div>
            <dt>报名时间</dt>
            <dd>
              {formatDateTime(race.signupStart)} - {formatDateTime(race.signupEnd)}
            </dd>
          </div>
          <div>
            <dt>比赛时间</dt>
            <dd>
              {formatDateTime(race.raceStart)} - {formatDateTime(race.raceEnd)}
            </dd>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Overview</p>
        <h2>赛事上下文</h2>
        <div className="stack">
          <p>{race.taskDescription}</p>
          <p className="muted">{race.evaluationNotes}</p>
        </div>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">Rules</p>
          <h2>规则</h2>
          <div className="stack">
            <p>题目包：{race.taskPackageLabel}</p>
            <p>赛道：{race.trackId}</p>
            <p>关键词：{race.keywords.join(" / ")}</p>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Schedule</p>
          <h2>赛程安排</h2>
          <div className="stack">
            <p>报名：{formatDateTime(race.signupStart)} - {formatDateTime(race.signupEnd)}</p>
            <p>比赛：{formatDateTime(race.raceStart)} - {formatDateTime(race.raceEnd)}</p>
          </div>
        </section>
      </section>

      <section className="panel">
        <p className="eyebrow">Public Entry</p>
        <h2>公开入口</h2>
        <div className="button-row-inline">
          <a className="button" href={primaryCta.href}>
            {primaryCta.label}
          </a>
          <a className="button-secondary" href={`/races/${raceSlug}/live`}>
            进入 Live Hall
          </a>
          <a className="button-secondary" href={`/races/${raceSlug}/works`}>
            查看 Works
          </a>
          <a className="button-secondary" href={`/races/${raceSlug}/results`}>
            查看 Results
          </a>
          <a className="button-secondary" href={`/races/${raceSlug}/review`}>
            查看 Review
          </a>
        </div>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">Riders</p>
          <h2>参赛骑手</h2>
          <div className="stack">
            {race.teams.map((team) => (
              <div className="public-link-card" key={team.id}>
                <strong>{team.name}</strong>
                <span>{team.captain.username}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Works / Results / Review</p>
          <h2>赛事信息分区</h2>
          <ul className="bullet-list">
            <li>Works：公开作品集合与作品详情入口</li>
            <li>Results：最终赛果与榜单</li>
            <li>Review：赛后总结与公开复盘</li>
          </ul>
        </section>
      </section>

      <section className="panel">
        <p className="eyebrow">Next Step</p>
        <h2>下一步入口</h2>
        <div className="button-row-inline">
          <a className="button-secondary" href="/cooperation">
            查看 Cooperation
          </a>
          <a className="button-secondary" href="/races">
            返回 Races
          </a>
        </div>
      </section>
    </div>
  );
}
