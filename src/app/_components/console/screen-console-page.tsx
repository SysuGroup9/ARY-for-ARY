import {
  fallbackScreenDisplayToStableAction,
  fallbackScreenDisplayToStaticAction,
  saveRaceTrackCalibrationAction,
  updateScreenDisplayModeAction,
  updateScreenDisplayThemeAction,
} from "@/app/actions";
import CalibratorClient from "@/app/calibrator/CalibratorClient";
import JumbotronInline from "@/app/JumbotronInline";
import { ErrorNotice, Panel } from "@/app/_components/ary-shared";
import { StaticDisplayFallback } from "@/app/_components/public/static-display-fallback";
import type { TrackProfile, RaceSnapshot } from "@/lib/jumbotron/track-runtime/types";
import { getEffectiveTrackProfile } from "@/lib/jumbotron/track-config";
import { getRacePhaseLabel } from "@/lib/race-phase";
import type { RaceListItem } from "@/lib/services/races";
import {
  resolveScreenDisplayHref,
  type ScreenDisplayFallbackMode,
  type ScreenDisplayMode,
} from "@/lib/services/screen-display";

type ScreenMode =
  | "announcement"
  | "billboard"
  | "calibration"
  | "jumbotron"
  | "leaderboard"
  | "live"
  | "works";

export function ScreenConsolePageView({
  feedback,
  mode,
  race,
  raceSlug,
  races,
  screenDisplay,
  jumbotronPreview,
}: {
  feedback?: { message: string; title: string } | null;
  mode?: ScreenMode;
  race?: RaceListItem;
  raceSlug?: string;
  races?: Array<{ defaultHref: string; race: RaceListItem; slug: string }>;
  screenDisplay?: {
    fallbackMode: ScreenDisplayFallbackMode;
    mode: ScreenDisplayMode;
    theme: string;
  } | null;
  jumbotronPreview?: {
    fallbackReason?: null | string;
    snapshot: RaceSnapshot | null;
    source: "live" | "stable" | "static";
    trackProfile: TrackProfile | null;
  };
}) {
  if (!race) {
    return (
      <>
        {feedback ? (
          <ErrorNotice message={feedback.message} title={feedback.title} />
        ) : null}
        <Panel title="赛事选择" eyebrow="大屏控制台">
          <p className="muted">
            大屏控制台独立于赛事控制台。请先选择一场赛事，再进入对应的展示模式。
          </p>
        </Panel>
        <section className="console-card-grid">
          {(races ?? []).map((item) => (
            <a
              className="console-link-card"
              href={item.defaultHref}
              key={item.race.id}
            >
              <strong>{item.race.title}</strong>
              <span>{getRacePhaseLabel(item.race.phase)}</span>
              <span>{item.race.summary}</span>
            </a>
          ))}
        </section>
      </>
    );
  }

  const resolvedMode = mode ?? "jumbotron";
  const activeScreenDisplay = screenDisplay ?? {
    fallbackMode: "auto" as ScreenDisplayFallbackMode,
    mode: (resolvedMode === "calibration"
      ? "jumbotron"
      : resolvedMode) as ScreenDisplayMode,
    theme: "default",
  };
  const currentModeHref = `/console/screen/${raceSlug ?? ""}/${resolvedMode}`;
  const currentPublicHref = resolveScreenDisplayHref({
    fallbackMode: activeScreenDisplay.fallbackMode,
    mode: activeScreenDisplay.mode,
    raceId: race.id,
    raceSlug: raceSlug ?? "",
  });
  const calibrationProfile = getEffectiveTrackProfile(
    race.trackId,
    race.trackConfig ?? null,
  );
  const latestAnnouncement = [...(race.announcements ?? [])]
    .filter(
      (announcement) =>
        announcement.visibility === "PUBLIC" && announcement.publishedAt,
    )
    .sort(
      (left, right) => right.publishedAt!.getTime() - left.publishedAt!.getTime(),
    )[0];

  return (
    <>
      {feedback ? <ErrorNotice message={feedback.message} title={feedback.title} /> : null}
      <Panel
        title={`当前模式：${screenModeLabel[resolvedMode]}`}
        eyebrow="大屏控制台"
      >
        <p className="muted">
          当前赛事：{race.title}。此页面用于管理大屏输出，并复用现有 Jumbotron 与公开页面作为当前展示目标。
        </p>
        <p className="muted">当前阶段：{getRacePhaseLabel(race.phase)}</p>
      </Panel>

      <section className="grid">
        <Panel title="当前 ScreenDisplay" eyebrow="控制状态">
          <div className="stack">
            <div className="detail-grid">
              <div>
                <dt>当前模式</dt>
                <dd>{screenModeLabel[activeScreenDisplay.mode]}</dd>
              </div>
              <div>
                <dt>当前 Theme</dt>
                <dd>{activeScreenDisplay.theme}</dd>
              </div>
              <div>
                <dt>当前 Fallback</dt>
                <dd>{activeScreenDisplay.fallbackMode}</dd>
              </div>
            </div>
            <a className="button-secondary" href={currentPublicHref}>
              全屏展示当前输出
            </a>
            <span className="muted">当前公开播放入口：{currentPublicHref}</span>
            <div className="button-row-inline">
              {displayModeActions.map((item) => (
                <form action={updateScreenDisplayModeAction} key={item.mode}>
                  <input name="raceId" type="hidden" value={race.id} />
                  <input name="raceSlug" type="hidden" value={raceSlug ?? ""} />
                  <input name="returnTo" type="hidden" value={currentModeHref} />
                  <input name="mode" type="hidden" value={item.mode} />
                  <button type="submit">{item.label}</button>
                </form>
              ))}
            </div>
            <form action={updateScreenDisplayThemeAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <input name="raceSlug" type="hidden" value={raceSlug ?? ""} />
              <input name="returnTo" type="hidden" value={currentModeHref} />
              <label className="full">
                Theme
                <input
                  defaultValue={activeScreenDisplay.theme}
                  name="theme"
                  type="text"
                />
              </label>
              <button type="submit">保存 Theme</button>
            </form>
            <div className="button-row-inline">
              <form action={fallbackScreenDisplayToStableAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <input name="raceSlug" type="hidden" value={raceSlug ?? ""} />
                <input name="returnTo" type="hidden" value={currentModeHref} />
                <button type="submit">切到稳定 Projection fallback</button>
              </form>
              <form action={fallbackScreenDisplayToStaticAction}>
                <input name="raceId" type="hidden" value={race.id} />
                <input name="raceSlug" type="hidden" value={raceSlug ?? ""} />
                <input name="returnTo" type="hidden" value={currentModeHref} />
                <button type="submit">切到静态公告 fallback</button>
              </form>
            </div>
          </div>
        </Panel>

        <Panel title="输出目标" eyebrow="大屏控制台">
          <div className="button-row-inline">
            <a className="button-secondary" href={`/jumbotron/${race.id}`}>
              打开大屏
            </a>
            <a className="button-secondary" href="/calibrator">
              打开独立校准器
            </a>
            {resolvedMode === "announcement" ? (
              <a
                className="button-secondary"
                href={`/screen/${raceSlug ?? ""}/announcement`}
              >
                打开公告大屏
              </a>
            ) : null}
            <a className="button-secondary" href={`/races/${raceSlug ?? ""}`}>
              打开公开赛事页
            </a>
          </div>
          <div className="stack" style={{ marginTop: 12 }}>
            <strong>当前输出预览</strong>
            <span className="muted">
              预览当前公开播放入口，控制按钮仍保留在 Screen Console，不进入观众大屏。
            </span>
          </div>

          {resolvedMode === "jumbotron" && jumbotronPreview?.source === "stable" ? (
            <p className="muted" style={{ marginTop: 12 }}>
              当前预览已回退到最近一次稳定快照。
            </p>
          ) : null}

          {resolvedMode === "jumbotron" && jumbotronPreview?.source === "static" ? (
            <>
              <StaticDisplayFallback
                compact
                race={race}
                raceSlug={raceSlug}
                reason={jumbotronPreview.fallbackReason}
              />
              <div className="button-row-inline" style={{ marginTop: 12 }}>
                <a
                  className="button-secondary"
                  href={`/console/screen/${raceSlug ?? ""}/announcement`}
                >
                  切到公告模式
                </a>
                <a
                  className="button-secondary"
                  href={`/console/screen/${raceSlug ?? ""}/leaderboard`}
                >
                  切到榜单模式
                </a>
              </div>
            </>
          ) : null}

          {resolvedMode === "jumbotron" &&
          jumbotronPreview &&
          jumbotronPreview.source !== "static" ? (
            <JumbotronInline
              raceId={race.id}
              snapshot={jumbotronPreview.snapshot}
              trackProfile={jumbotronPreview.trackProfile}
            />
          ) : null}

          {resolvedMode !== "jumbotron" ? (
            <iframe
              src={currentPublicHref}
              title="当前输出预览"
              style={{
                marginTop: 12,
                width: "100%",
                minHeight: 560,
                border: "1px solid rgba(128, 128, 128, 0.18)",
                borderRadius: 16,
                background: "#ffffff",
              }}
            />
          ) : null}
        </Panel>

        {resolvedMode === "calibration" ? (
          <Panel title="校准工作区" eyebrow="Theme / Calibration">
            <div className="stack">
              <p className="muted">
                当前校准模式直接复用现有校准器，便于在 Screen Console 内完成底图导入、路径校验和 Profile 导出。
              </p>
              <CalibratorClient
                embedded
                initialProfile={calibrationProfile}
                raceId={race.id}
                raceSlug={raceSlug}
                saveAction={saveRaceTrackCalibrationAction}
              />
            </div>
          </Panel>
        ) : null}

        <Panel title="模式说明" eyebrow="过渡输出">
          <p className="muted">{screenModeDescription[resolvedMode]}</p>
          {resolvedMode === "announcement" ? (
            latestAnnouncement ? (
              <div className="public-link-card">
                <strong>{latestAnnouncement.title}</strong>
                <span>{latestAnnouncement.body}</span>
                <span>
                  发布时间：{latestAnnouncement.publishedAt?.toISOString() ?? "not yet"}
                </span>
              </div>
            ) : (
              <p className="muted">当前还没有已发布公告。</p>
            )
          ) : null}
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

const displayModeActions: Array<{
  label: string;
  mode: ScreenDisplayMode;
}> = [
  { label: "切到大屏", mode: "jumbotron" },
  { label: "切到看板", mode: "billboard" },
  { label: "切到实况", mode: "live" },
  { label: "切到榜单", mode: "leaderboard" },
  { label: "切到作品", mode: "works" },
  { label: "切到公告", mode: "announcement" },
];

const screenModeDescription = {
  announcement:
    "公告模式读取最近已发布公告，供 Live Hall 与现场大屏直接播放。",
  billboard:
    "看板模式已经进入路由结构，但当前仍由过渡展示内容支撑。",
  calibration:
    "校准模式现在直接承载现有校准工作区，用于完成现场屏幕校准与 Profile 导出。",
  jumbotron:
    "大屏模式仍是当前主要输出，继续沿用既有 snapshot 与 track runtime 实现。",
  leaderboard:
    "榜单模式当前复用公开赛果 / 读取模型数据，尚未拆出独立的大屏榜单 projection。",
  live:
    "实况模式当前引导到公开实况大厅，后续再收口到专门的大屏 feed。",
  works:
    "作品模式当前已切到专用作品墙输出，并继续只消费公开作品链路。",
} as const;
