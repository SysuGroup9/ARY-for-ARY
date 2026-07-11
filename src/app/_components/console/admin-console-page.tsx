import { updateUserRolesAction } from "@/app/actions";
import { Panel } from "@/app/_components/ary-shared";
import type { AppRole } from "@/lib/user-roles";

type UserRow = {
  id: string;
  profileCompleted: boolean;
  roles: AppRole[];
  username: string;
};

const adminSectionTitle = {
  "profile-completion": "资料补全",
  roles: "角色维护",
  users: "用户列表",
} as const;

const roleLabelMap: Record<AppRole, string> = {
  ADMIN: "管理员",
  JUDGE: "评委",
  ORGANIZER: "主办方",
  RIDER: "骑手",
};

export function AdminConsolePageView({
  section,
  users,
}: {
  section: "profile-completion" | "roles" | "users";
  users: UserRow[];
}) {
  return (
    <>
      <Panel title={adminSectionTitle[section]} eyebrow="管理控制台">
        <p className="muted">
          当前仅提供最小账号治理能力，用于查看用户、资料补全状态和维护
          `User.roles`。
        </p>
      </Panel>
      {renderAdminSection({ section, users })}
    </>
  );
}

function renderAdminSection({
  section,
  users,
}: {
  section: keyof typeof adminSectionTitle;
  users: UserRow[];
}) {
  switch (section) {
    case "users":
      return (
        <Panel title="用户列表" eyebrow="账号概览">
          <div className="stack">
            {users.map((user) => (
              <div className="public-link-card" key={user.id}>
                <strong>{user.username}</strong>
                <span>
                  角色：{user.roles.map((role) => roleLabelMap[role]).join("、")}
                </span>
                <span>
                  资料状态：{user.profileCompleted ? "已补全" : "待补全"}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      );
    case "profile-completion":
      return (
        <Panel title="资料补全" eyebrow="当前覆盖情况">
          <div className="stack">
            {users.map((user) => (
              <div className="public-link-card" key={`${user.id}-profile`}>
                <strong>{user.username}</strong>
                <span>{user.profileCompleted ? "已补全" : "待补全"}</span>
              </div>
            ))}
            <p className="muted">
              该视图只反映当前资料补全状态，不承载 GitHub 登录流程或更复杂的账号运营能力。
            </p>
          </div>
        </Panel>
      );
    case "roles":
      return (
        <section className="stack">
          {users.map((user) => (
            <Panel
              key={`${user.id}-roles`}
              title={user.username}
              eyebrow="角色维护"
            >
              <form action={updateUserRolesAction} className="form-grid">
                <input
                  name="returnTo"
                  type="hidden"
                  value="/console/admin/roles"
                />
                <input name="userId" type="hidden" value={user.id} />
                <div className="check-grid">
                  {allRoleOptions.map((role) => (
                    <label className="checkbox" key={`${user.id}-${role}`}>
                      <input
                        defaultChecked={user.roles.includes(role)}
                        name="roles"
                        type="checkbox"
                        value={role}
                      />
                      {roleLabelMap[role]}
                    </label>
                  ))}
                </div>
                <button type="submit">保存角色</button>
              </form>
            </Panel>
          ))}
        </section>
      );
  }
}

const allRoleOptions: AppRole[] = ["ADMIN", "JUDGE", "ORGANIZER", "RIDER"];
