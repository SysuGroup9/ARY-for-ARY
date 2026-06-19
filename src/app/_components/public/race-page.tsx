import { formatDateTime } from "@/lib/format";
import type { RaceListItem } from "@/lib/services/races";

export function RacePageView({
  race,
  raceSlug,
}: {
  race: RaceListItem;
  raceSlug: string;
}) {
  const primaryCta =
    race.phase === "registration" || race.phase === "preparation"
      ? { href: `/races/${raceSlug}/register`, label: "进入报名页面" }
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
        <p className="eyebrow">赛事概览</p>
        <h2>赛事上下文</h2>
        <div className="stack">
          <p>{race.taskDescription}</p>
          <p className="muted">{race.evaluationNotes}</p>
        </div>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">规则</p>
          <h2>规则说明</h2>
          <div className="stack">
            <p>题目包：{race.taskPackageLabel}</p>
            <p>赛道：{race.trackId}</p>
            <p>关键词：{race.keywords.join(" / ")}</p>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">赛程</p>
          <h2>赛程安排</h2>
          <div className="stack">
            <p>
              报名：{formatDateTime(race.signupStart)} -{" "}
              {formatDateTime(race.signupEnd)}
            </p>
            <p>
              比赛：{formatDateTime(race.raceStart)} -{" "}
              {formatDateTime(race.raceEnd)}
            </p>
          </div>
        </section>
      </section>

      <section className="panel">
        <p className="eyebrow">公开入口</p>
        <h2>公开入口</h2>
        {(race.phase === "registration" || race.phase === "preparation") ? (
          <p className="muted">
            先登录或注册骑手账号，再进入该赛事完成正式报名。
          </p>
        ) : null}
        <div className="button-row-inline">
          <a className="button" href={primaryCta.href}>
            {primaryCta.label}
          </a>
          <a className="button-secondary" href={`/races/${raceSlug}/live`}>
            进入实况大厅
          </a>
          <a className="button-secondary" href={`/races/${raceSlug}/works`}>
            查看作品
          </a>
          <a className="button-secondary" href={`/races/${raceSlug}/results`}>
            查看赛果
          </a>
          <a className="button-secondary" href={`/races/${raceSlug}/review`}>
            查看复盘
          </a>
        </div>
      </section>

      <section className="grid">
        <section className="panel">
          <p className="eyebrow">骑手</p>
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
          <p className="eyebrow">作品 / 赛果 / 复盘</p>
          <h2>赛事信息分区</h2>
          <ul className="bullet-list">
            <li>作品：公开作品集合与作品详情入口</li>
            <li>赛果：最终赛果与榜单</li>
            <li>复盘：赛后总结与公开复盘</li>
          </ul>
        </section>
      </section>

      <section className="panel">
        <p className="eyebrow">下一步</p>
        <h2>下一步入口</h2>
        <div className="button-row-inline">
          <a className="button-secondary" href="/cooperation">
            查看合作
          </a>
          <a className="button-secondary" href="/races">
            返回赛事列表
          </a>
        </div>
      </section>
    </div>
  );
}
