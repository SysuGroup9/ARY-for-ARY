import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ConsoleShell } from "./console-shell";

test("console shell renders logout action", () => {
  const html = renderToStaticMarkup(
    <ConsoleShell
      breadcrumbs={[{ href: "/console", label: "控制台" }]}
      navItems={[{ href: "/console/races", label: "赛事控制台" }]}
      title="赛事控制台"
    >
      <div>content</div>
    </ConsoleShell>,
  );

  assert.match(html, /退出登录/);
});
