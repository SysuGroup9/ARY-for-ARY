import { registerForRaceAction, withdrawRegistrationAction } from "@/app/actions";
import { ErrorNotice, Panel } from "@/app/_components/ary-shared";
import type { SessionUser } from "@/lib/auth";
import { buildProfileCompletionHref } from "@/lib/profile-completion";
import { getRacePhaseLabel } from "@/lib/race-phase";
import type { PublicRaceListItem } from "@/lib/services/public-routes";
import type { getRegistrationForUser } from "@/lib/services/registrations";
import { hasRole } from "@/lib/user-roles";

type RiderRegistration = Awaited<ReturnType<typeof getRegistrationForUser>>;

export function RaceRegisterPageView({
  feedback,
  race,
  raceSlug,
  registration,
  sessionUser,
}: {
  feedback?: { message: string; title: string } | null;
  race: PublicRaceListItem;
  raceSlug: string;
  registration: RiderRegistration;
  sessionUser: SessionUser | null;
}) {
  const isRegistrationPhase = race.phase === "registration";
  const canRide = sessionUser ? hasRole(sessionUser.roles, "RIDER") : false;
  const publicReturnTo = `/races/${raceSlug}/register`;
  const loginHref = `/login?returnTo=${encodeURIComponent(publicReturnTo)}`;
  const riderReturnTo = `/console/races/${raceSlug}/rider/registration`;
  const registrationStatus = String(registration?.status ?? "").toUpperCase();

  return (
    <div className="stack">
      {feedback ? <ErrorNotice message={feedback.message} title={feedback.title} /> : null}
      <Panel title="赛事报名" eyebrow="Registration">
        <div className="stack">
          <strong>{race.title}</strong>
          <p className="muted">{race.summary}</p>
          <p className="muted">
            这里是公开站的正式报名页：先确认身份，再对当前赛事提交报名，不再要求你先自己摸到控制台里去找入口。
          </p>
        </div>
      </Panel>

      {registration ? (
        registrationStatus === "APPROVED" ? (
          <Panel title="你已完成报名" eyebrow="Registration Status">
            <div className="stack">
              <strong>状态：{registration.status}</strong>
              <span>报名用户：{registration.user.username}</span>
              <span>
                RaceProject：{registration.raceProject ? registration.raceProject.aggregateIngestionStatus : "未生成"}
              </span>
              <p className="muted">
                你在比赛开始前已经报过名，因此当前阶段仍然可以继续进入骑手工作台参赛。
              </p>
              <div className="button-row-inline">
                <a className="button" href={`/console/races/${raceSlug}/rider/registration`}>
                  进入骑手工作台
                </a>
                {isRegistrationPhase ? (
                  <form action={withdrawRegistrationAction}>
                    <input
                      name="registrationId"
                      type="hidden"
                      value={registration.id}
                    />
                    <input
                      name="feedbackReturnTo"
                      type="hidden"
                      value={publicReturnTo}
                    />
                    <input name="raceSlug" type="hidden" value={raceSlug} />
                    <button type="submit">撤回报名</button>
                  </form>
                ) : null}
                <a className="button-secondary" href={`/races/${raceSlug}`}>
                  返回赛事页
                </a>
              </div>
            </div>
          </Panel>
        ) : registrationStatus === "SUBMITTED" ? (
          <Panel title="报名已提交" eyebrow="Registration Status">
            <div className="stack">
              <strong>状态：{registration.status}</strong>
              <span>报名用户：{registration.user.username}</span>
              <p className="muted">
                你的报名已经提交，正在等待主办方审核。只有审核通过后，系统才会生成 RaceProject 并解锁后续参赛上下文。
              </p>
              <div className="button-row-inline">
                <a className="button" href={`/console/races/${raceSlug}/rider/registration`}>
                  查看报名状态
                </a>
                {isRegistrationPhase ? (
                  <form action={withdrawRegistrationAction}>
                    <input
                      name="registrationId"
                      type="hidden"
                      value={registration.id}
                    />
                    <input
                      name="feedbackReturnTo"
                      type="hidden"
                      value={publicReturnTo}
                    />
                    <input name="raceSlug" type="hidden" value={raceSlug} />
                    <button type="submit">撤回报名</button>
                  </form>
                ) : null}
                <a className="button-secondary" href={`/races/${raceSlug}`}>
                  返回赛事页
                </a>
              </div>
            </div>
          </Panel>
        ) : registrationStatus === "WITHDRAWN" ? (
          <Panel title="报名已撤回" eyebrow="Registration Status">
            <div className="stack">
              <strong>状态：{registration.status}</strong>
              <span>报名用户：{registration.user.username}</span>
              <p className="muted">
                这条报名已经撤回，当前不会进入正式参赛上下文。
              </p>
              <div className="button-row-inline">
                <a className="button" href={`/console/races/${raceSlug}/rider/registration`}>
                  查看报名状态
                </a>
                <a className="button-secondary" href={`/races/${raceSlug}`}>
                  返回赛事页
                </a>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel title="报名未通过" eyebrow="Registration Status">
            <div className="stack">
              <strong>状态：{registration.status}</strong>
              <span>报名用户：{registration.user.username}</span>
              <p className="muted">
                当前报名还没有进入正式参赛上下文。若需要继续参赛，请联系主办方确认下一步处理方式。
              </p>
              <div className="button-row-inline">
                <a className="button" href={`/console/races/${raceSlug}/rider/registration`}>
                  查看报名状态
                </a>
                <a className="button-secondary" href={`/races/${raceSlug}`}>
                  返回赛事页
                </a>
              </div>
            </div>
          </Panel>
        )
      ) : !isRegistrationPhase ? (
        <Panel title="报名已截止" eyebrow="Registration Status">
          <div className="stack">
            <p className="muted">
              当前赛事阶段为 {getRacePhaseLabel(race.phase)}。比赛开始后不再接受新的正式报名，但赛前已报名的骑手仍可继续进入自己的工作台。
            </p>
            <div className="button-row-inline">
              <a className="button-secondary" href={`/races/${raceSlug}`}>
                返回赛事页
              </a>
              <a className="button-secondary" href={`/races/${raceSlug}/live`}>
                进入实况大厅
              </a>
            </div>
          </div>
        </Panel>
      ) : !sessionUser ? (
        <Panel title="先登录或注册骑手账号" eyebrow="Identity First">
          <div className="stack">
            <p className="muted">
              你还没有登录。先完成骑手登录或注册，系统会把你带回当前赛事报名页继续报名。
            </p>
            <div className="button-row-inline">
              <a className="button" href={loginHref}>
                登录 / 注册后继续报名
              </a>
              <a className="button-secondary" href={`/races/${raceSlug}`}>
                返回赛事页
              </a>
            </div>
          </div>
        </Panel>
      ) : !canRide ? (
        <Panel title="当前身份不能报名" eyebrow="Role Required">
          <div className="stack">
            <p className="muted">
              当前账号已登录，但不具备 Rider 身份，不能直接对赛事提交报名。
            </p>
            <div className="button-row-inline">
              <a className="button-secondary" href="/login">
                返回身份入口
              </a>
              <a className="button-secondary" href={`/races/${raceSlug}`}>
                返回赛事页
              </a>
            </div>
          </div>
        </Panel>
      ) : sessionUser.profileCompleted === false ? (
        <Panel title="先补全资料" eyebrow="Profile Required">
          <div className="stack">
            <p className="muted">
              你已经登录并具备 Rider 身份，但还没有完成最小个人资料补全。先补全资料，再回到当前赛事页继续报名。
            </p>
            <div className="button-row-inline">
              <a className="button" href={buildProfileCompletionHref(`/races/${raceSlug}/register`)}>
                去补全资料
              </a>
              <a className="button-secondary" href={`/races/${raceSlug}`}>
                返回赛事页
              </a>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel title="提交正式报名" eyebrow="Registration Action">
          <div className="stack">
            <p className="muted">
              当前账号已具备 Rider 身份。点击下方按钮后，系统会先创建报名记录；通过主办方审核后，才会生成正式参赛上下文。
            </p>
            <form action={registerForRaceAction} className="form-grid">
              <input
                name="feedbackReturnTo"
                type="hidden"
                value={publicReturnTo}
              />
              <input name="raceId" type="hidden" value={race.id} />
              <input name="returnTo" type="hidden" value={riderReturnTo} />
              <button type="submit">报名参赛</button>
            </form>
          </div>
        </Panel>
      )}
    </div>
  );
}
