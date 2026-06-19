import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("console new-race page uses Chinese user-facing route copy", () => {
  const source = readFileSync(
    "src/app/console/races/new/page.tsx",
    "utf8",
  );

  assert.match(source, /控制台/);
  assert.match(source, /赛事控制台/);
  assert.match(source, /创建赛事/);
  assert.match(source, /返回赛事控制台/);
  assert.match(source, /该页面承接原先位于公开首页的创建赛事入口。/);
  assert.match(source, /赛事表单/);
  assert.doesNotMatch(source, /label: "Race Console"/);
  assert.doesNotMatch(source, /label: "Create Race"/);
  assert.doesNotMatch(source, /Back to Race Console/);
  assert.doesNotMatch(
    source,
    /Organizer-only race creation lives under Console instead of the public site\./,
  );
});
