import { registerForRaceAction } from "@/app/actions";
import { Panel } from "@/app/_components/ary-shared";
import type { SessionUser } from "@/lib/auth";
import type { RaceListItem } from "@/lib/services/races";
import type { getRegistrationForUser } from "@/lib/services/registrations";
import { hasRole } from "@/lib/user-roles";

type RiderRegistration = Awaited<ReturnType<typeof getRegistrationForUser>>;

export function RaceRegisterPageView({
  race,
  raceSlug,
  registration,
  sessionUser,
}: {
  race: RaceListItem;
  raceSlug: string;
  registration: RiderRegistration;
  sessionUser: SessionUser | null;
}) {
  const isRegistrationPhase =
    race.phase === "registration" || race.phase === "preparation";
  const canRide = sessionUser ? hasRole(sessionUser.roles, "RIDER") : false;
  const loginHref = `/login?returnTo=${encodeURIComponent(`/races/${raceSlug}/register`)}`;

  return (
    <div className="stack">
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
              <a className="button-secondary" href={`/races/${raceSlug}`}>
                返回赛事页
              </a>
            </div>
          </div>
        </Panel>
      ) : !isRegistrationPhase ? (
        <Panel title="报名已截止" eyebrow="Registration Status">
          <div className="stack">
            <p className="muted">
              当前赛事阶段为 {race.phase}。比赛开始后不再接受新的正式报名，但赛前已报名的骑手仍可继续进入自己的工作台。
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
      ) : (
        <Panel title="提交正式报名" eyebrow="Registration Action">
          <div className="stack">
            <p className="muted">
              当前账号已具备 Rider 身份。点击下方按钮后，系统会为你创建当前赛事的正式报名记录和后续参赛上下文。
            </p>
            <form action={registerForRaceAction} className="form-grid">
              <input name="raceId" type="hidden" value={race.id} />
              <button type="submit">报名参赛</button>
            </form>
          </div>
        </Panel>
      )}
    </div>
  );
}
