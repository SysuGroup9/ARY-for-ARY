import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const sections = [
  {
    name: "Auth / Profile / Role Governance",
    command:
      'node --test-concurrency=1 --import tsx --test src/app/_components/public/public-auth-entry-regression.test.tsx src/lib/auth-entry.test.ts src/app/_components/public/public-copy-cleanup.test.tsx src/app/_components/public/public-header.test.tsx src/app/actions.return-to.test.ts src/lib/profile-completion.test.ts src/lib/services/users-profile-completion.test.ts src/app/profile/page.test.tsx src/app/_components/console/admin-console-page.test.tsx src/app/actions.user-roles-admin-scope.test.ts',
  },
  {
    name: "Console Access / System Scope",
    command:
      "node --test-concurrency=1 --import tsx --test src/app/console/page.test.tsx src/app/console/races/page.test.tsx src/lib/viewer-access.test.ts src/lib/services/console-routes.test.ts",
    reseedBefore: true,
  },
  {
    name: "Race Lifecycle",
    command:
      "node --test-concurrency=1 --import tsx --test src/app/actions.race-create-system-scope.test.ts src/lib/services/race-create-scope.test.ts src/app/actions.race-publish-system-scope.test.ts src/lib/services/race-publish-scope.test.ts src/app/actions.race-archive-system-scope.test.ts src/lib/services/race-archive-scope.test.ts src/app/actions.race-edit-system-scope.test.ts src/lib/services/race-edit-scope.test.ts",
    reseedBefore: true,
  },
  {
    name: "Registration / CA Participation",
    command:
      "node --test-concurrency=1 --import tsx --test src/lib/registration-helpers.test.ts src/lib/services/registration-review-flow.test.ts src/app/actions.registration-review-system-scope.test.ts src/app/_components/public/race-register-page.test.tsx src/lib/services/ca-connection-audit.test.ts src/lib/services/ca-rotation-disable.test.ts src/app/actions.rider-snapshot-own-scope.test.ts src/lib/services/ca-fetch-rider-scope.test.ts",
    reseedBefore: true,
  },
  {
    name: "CA Ingestion / Projection / Live / Screen",
    command:
      "node --test-concurrency=1 --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-signature-verification.test.ts src/lib/services/ca-ingestion-integrity.test.ts src/lib/services/ca-fetch-integrity.test.ts src/lib/services/ca-fetch-audit.test.ts src/app/actions.projection-rebuild-scope.test.ts src/app/actions.race-snapshot-system-scope.test.ts src/app/actions.screen-display-system-scope.test.ts src/lib/services/race-snapshot.test.ts src/lib/services/screen-display.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/console/screen-console-controls.test.tsx src/app/_components/console/console-copy.test.tsx",
    reseedBefore: true,
  },
  {
    name: "Work Submission / Visibility / Public Routes",
    command:
      "node --test-concurrency=1 --import tsx --test src/lib/services/submissions-work-materialization.test.ts src/app/actions.work-create-submit-scope.test.ts src/app/_components/submission-form-client.test.tsx src/app/_components/final-submission-form-client.test.tsx src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions.test.ts src/lib/services/material-integrity-submissions.test.ts src/app/actions.work-visibility-lifecycle-scope.test.ts src/lib/services/work-visibility-lifecycle-scope.test.ts src/lib/services/public-routes.test.ts src/lib/public-site.test.ts src/app/_components/console/organizer-console-page.test.tsx src/lib/review-readiness-helpers.test.ts",
    reseedBefore: true,
  },
  {
    name: "Judging / Awards / Reports / Public Results",
    command:
      "node --test-concurrency=1 --import tsx --test src/app/actions.judge-assignment-scope.test.ts src/app/actions.judge-assignment-remove-scope.test.ts src/lib/services/judging-assignment-scope.test.ts src/lib/services/result-reference-freeze-judging.test.ts src/app/actions.managed-race-system-access.test.ts src/lib/services/awards-draft-withdraw.test.ts src/lib/services/reports-generation.test.ts src/lib/services/announcements.test.ts src/lib/services/results.test.ts src/lib/services/review.test.ts",
    reseedBefore: true,
  },
];

function runCommand(name, command) {
  console.log(`\n== ${name} ==`);
  console.log(`$ ${command}`);

  const result = spawnSync(command, {
    cwd: rootDir,
    env: process.env,
    shell: true,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${name} failed with exit code ${result.status ?? "unknown"}`);
  }
}

try {
  for (const section of sections) {
    if (section.reseedBefore) {
      runCommand(`Reset Database Before ${section.name}`, "npm run db:seed");
    }

    runCommand(section.name, section.command);
  }

  runCommand("Production Build Verification", "npm run build");
  console.log("\nGRS004 P0 regression passed.");
} catch (error) {
  console.error(
    `\nGRS004 P0 regression failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}
