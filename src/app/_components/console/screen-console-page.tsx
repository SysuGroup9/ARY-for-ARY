import JumbotronInline from "@/app/JumbotronInline";
import { Panel } from "@/app/_components/ary-shared";
import type { TrackProfile, RaceSnapshot } from "@/lib/jumbotron/track-runtime/types";
import type { RaceListItem } from "@/lib/services/races";

export function ScreenConsolePageView({
  mode,
  race,
  raceSlug,
  races,
  jumbotronPreview,
}: {
  mode?: "announcement" | "billboard" | "calibration" | "jumbotron" | "leaderboard" | "live" | "works";
  race?: RaceListItem;
  raceSlug?: string;
  races?: Array<{ defaultHref: string; race: RaceListItem; slug: string }>;
  jumbotronPreview?: {
    snapshot: RaceSnapshot | null;
    trackProfile: TrackProfile | null;
  };
}) {
  if (!race) {
    return (
      <>
        <Panel title="赛事选择" eyebrow="大屏控制台">
          <p className="muted">
            大屏控制台独立于赛事控制台。请先选择一场赛事，再进入对应的展示模式。
          </p>
        </Panel>
        <section className="console-card-grid">
          {(races ?? []).map((item) => (
            <a className="console-link-card" href={item.defaultHref} key={item.race.id}>
              <strong>{item.race.title}</strong>
              <span>{item.race.phase}</span>
              <span>{item.race.summary}</span>
            </a>
          ))}
        </section>
      </>
    );
  }

  return (
    <>
      <Panel title={`当前模式：${screenModeLabel[mode ?? "jumbotron"]}`} eyebrow="大屏控制台">
        <p className="muted">
          当前赛事：{race.title}。此页面用于管理大屏输出，并复用现有 Jumbotron 与公开页面作为当前展示目标。
        </p>
      </Panel>
      <section className="grid">
        <Panel title="输出目标" eyebrow="大屏控制台">
          <div className="button-row-inline">
            <a className="button-secondary" href={`/jumbotron/${race.id}`}>
              打开大屏
            </a>
            <a className="button-secondary" href="/calibrator">
              打开校准器
            </a>
            <a className="button-secondary" href={`/races/${raceSlug ?? ""}`}>
              打开公开赛事页
            </a>
          </div>
          {mode === "jumbotron" && jumbotronPreview ? (
            <JumbotronInline
              raceId={race.id}
              snapshot={jumbotronPreview.snapshot}
              trackProfile={jumbotronPreview.trackProfile}
            />
          ) : null}
        </Panel>
        <Panel title="模式说明" eyebrow="过渡输出">
          <p className="muted">{screenModeDescription[mode ?? "jumbotron"]}</p>
        </Panel>
      </section>
    </>
  );
}

const screenModeLabel = {
  announcement: "公告",
  billboard: "看板",
  calibration: "主题 / 校准",
  jumbotron: "大屏",
  leaderboard: "榜单",
  live: "实况",
  works: "作品",
} as const;

const screenModeDescription = {
  announcement: "公告模式当前仍复用公开赛事上下文，后续再收口到独立公告输出。",
  billboard: "看板模式已经进入路由结构，但当前仍由过渡展示内容支撑。",
  calibration: "校准仍由现有 `/calibrator` 工具支撑，后续再完全并入大屏控制台。",
  jumbotron: "大屏模式仍是当前主要输出，继续沿用既有 snapshot 与 track runtime 实现。",
  leaderboard: "榜单模式当前复用公开赛果 / 读取模型数据，尚未拆出独立的大屏榜单 projection。",
  live: "实况模式当前引导到公开实况大厅，后续再收口到专门的大屏 feed。",
  works: "作品模式当前复用公开赛事作品页作为过渡展示内容。",
} as const;
