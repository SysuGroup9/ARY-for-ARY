import { updateUserRolesAction } from "@/app/actions";
import { Panel } from "@/app/_components/ary-shared";
import type { AppRole } from "@/lib/user-roles";

type UserRow = {
  id: string;
  profileCompleted: boolean;
  roles: AppRole[];
  username: string;
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
      <Panel title={adminSectionTitle[section]} eyebrow="Admin Console">
        <p className="muted">
          This branch now uses `User.roles` semantics for account governance. GitHub OAuth and the full profile-completion workflow still remain future slices.
        </p>
      </Panel>
      {renderAdminSection({ section, users })}
    </>
  );
}

const adminSectionTitle = {
  "profile-completion": "Profile Completion",
  roles: "User Roles",
  users: "Users",
} as const;

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
        <Panel title="User List" eyebrow="Users">
          <div className="stack">
            {users.map((user) => (
              <div className="public-link-card" key={user.id}>
                <strong>{user.username}</strong>
                <span>Roles: {user.roles.join(", ")}</span>
                <span>
                  Profile: {user.profileCompleted ? "Completed" : "Incomplete"}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      );
    case "profile-completion":
      return (
        <Panel title="Profile State" eyebrow="Current Coverage">
          <div className="stack">
            {users.map((user) => (
              <div className="public-link-card" key={`${user.id}-profile`}>
                <strong>{user.username}</strong>
                <span>{user.profileCompleted ? "Completed" : "Incomplete"}</span>
              </div>
            ))}
            <p className="muted">
              The repository now stores profile completion state, but still lacks the full GitHub-driven profile onboarding required by `grs003`.
            </p>
          </div>
        </Panel>
      );
    case "roles":
      return (
        <section className="stack">
          {users.map((user) => (
            <Panel key={`${user.id}-roles`} title={user.username} eyebrow="Role Governance">
              <form action={updateUserRolesAction} className="form-grid">
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
                      {role}
                    </label>
                  ))}
                </div>
                <button type="submit">Save Roles</button>
              </form>
            </Panel>
          ))}
        </section>
      );
  }
}

const allRoleOptions: AppRole[] = ["ADMIN", "JUDGE", "ORGANIZER", "RIDER"];
