import { Panel } from "@/app/_components/ary-shared";
import { formatDateTime } from "@/lib/format";
import type { ConsoleRaceListItem } from "@/lib/services/console-routes";

function getAccessLabel(access: ConsoleRaceListItem["access"]) {
  switch (access) {
    case "organizer":
      return "主办方视图";
    case "judge":
      return "评委视图";
    case "rider":
      return "骑手视图";
  }
}

export function ConsoleRacesPageView({
  races,
}: {
  races: ConsoleRaceListItem[];
}) {
  return (
    <>
      <Panel title="赛事工作台" eyebrow="赛事控制台">
        <p className="muted">
          赛事控制台始终保持单场赛事上下文，不再把赛事操作混进公开首页。
        </p>
      </Panel>

      <section className="console-card-grid">
        {races.length === 0 ? (
          <Panel title="暂无工作台" eyebrow="空状态">
            <p className="muted">
              当前账号下暂时没有可进入的主办方赛事、评委赛事或已加入赛事。
            </p>
          </Panel>
        ) : (
          races.map((item) => (
            <a
              className="console-link-card"
              href={item.defaultHref}
              key={`${item.access}-${item.race.id}`}
            >
              <strong>{item.race.title}</strong>
              <span>{getAccessLabel(item.access)}</span>
              <span>{item.race.summary}</span>
              <span>
                {formatDateTime(item.race.raceStart)} -{" "}
                {formatDateTime(item.race.raceEnd)}
              </span>
            </a>
          ))
        )}
      </section>
    </>
  );
}
