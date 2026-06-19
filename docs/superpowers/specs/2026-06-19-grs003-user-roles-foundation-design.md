# GRS003 User Roles Foundation Design

## Purpose

This slice moves the repository off the current single-role user model and toward the `grs003` identity contract.

The immediate target is not full GitHub OAuth parity. The immediate target is:

- stop treating identity as `User.role`
- establish `User.roles` semantics in code and storage
- make Admin Console capable of basic role governance
- remove public self-registration of organizer identity

This unlocks the later `Registration / RaceProject / JudgeAssignment / Award` refactors because those slices depend on multi-role users being real first.

## Scope

### In Scope

- `User.roles` semantics
- `ADMIN` and `JUDGE` role support
- session/auth helpers that understand multiple roles
- role-aware capability helpers
- Admin Console user listing and role editing
- public registration becoming rider-only by default
- seed data for admin and judge users

### Out Of Scope

- GitHub OAuth
- full profile completion workflow
- `Registration` replacing `Team`
- `RaceProject`, `CAConnection`, `Session`
- `JudgeAssignment`, `JudgingRecord`

## Current Gap

The repository still carries the largest identity mismatch called out by `grs003`:

- Prisma stores a single `User.role`
- auth/session only carries one role
- public registration lets a user choose organizer vs rider
- Admin Console cannot actually govern roles
- Judge and Admin routes exist only as structural placeholders

This directly contradicts:

- `docs/grs003/ary-domain-analysis.v0.3.md`
- `docs/grs003/ary-permission-matrix.md`
- `docs/grs003/ary-mvp.prd.md`

## Design Decisions

### 1. Introduce `User.roles` now, keep a compatibility active role temporarily

This slice should make `roles` the source of truth while keeping a compatibility single-role field only where needed for transition.

That means:

- code reads roles from a collection-like source
- authorization checks use role membership, not equality
- session payload includes the full role set
- a derived active/default role can remain temporarily to limit churn in existing UI code

### 2. Public registration becomes rider-only

`grs003` does not support self-registration into organizer authority through the public auth form.

So the registration form should:

- create rider accounts by default
- stop exposing organizer choice to the public
- leave organizer/admin/judge identity assignment to Admin Console or seed/setup

### 3. Admin Console becomes minimally real

Admin Console should stop being only a placeholder-backed explanation page.

This slice should provide:

- user list
- current role display
- basic role editing

Even if profile completion is still incomplete, `User.roles` management should become functional.

### 4. Judge and Admin role presence land before judge workflow semantics

This slice does not need to finish judging. It only needs to make the identity model capable of expressing a judge or admin user.

That lets later `JudgeAssignment` work attach to real user identity instead of synthetic placeholders.

## Storage Strategy

Because the current repo already depends on the single `role` column in many places, the safest aligned transition is:

- add a roles-backed representation
- make code treat roles as authoritative
- keep a derived compatibility role field only until the wider domain rewrite removes it

This is still a temporary compromise, but it makes the system materially closer to `grs003` than the current single-role-only model.

## Acceptance Criteria

This slice is complete when:

1. users are represented in app code with a roles collection
2. auth/session helpers authorize by role membership
3. public registration no longer lets users self-select organizer identity
4. Admin Console can show users and edit role membership
5. seeded admin and judge accounts exist
6. docs/superpowers status records that `User.roles` foundation has landed, while GitHub OAuth and profile workflow remain pending

## Implementation Note

This slice is implemented as a compatibility migration:

- `User.roles` semantics are now authoritative in app code
- a derived compatibility `User.role` field still exists in the Prisma model for transition safety
- public signup is rider-only
- Admin Console can now edit role membership

This means the repository is materially closer to `grs003`, but not yet at the final identity target because GitHub OAuth and profile-completion workflow are still pending.
