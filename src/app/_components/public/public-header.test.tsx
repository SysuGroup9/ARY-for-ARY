import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicHeader } from "./public-header";

test("public header shows logout action for authenticated users", () => {
  const html = renderToStaticMarkup(<PublicHeader roles={["RIDER"]} />);

  assert.match(html, /退出登录/);
  assert.match(html, /进入控制台/);
  assert.doesNotMatch(html, /身份入口/);
});

test("public header keeps login entry for anonymous users", () => {
  const html = renderToStaticMarkup(<PublicHeader roles={null} />);

  assert.match(html, /登录 \/ 注册/);
  assert.match(html, /赛事/);
  assert.match(html, /作品/);
  assert.match(html, /骑手/);
  assert.match(html, /合作/);
  assert.doesNotMatch(html, /退出登录/);
});
