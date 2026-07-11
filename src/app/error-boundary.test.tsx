import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("app and global error boundaries provide friendly fallback UI", () => {
  const appErrorSource = readFileSync("src/app/error.tsx", "utf8");
  const globalErrorSource = readFileSync("src/app/global-error.tsx", "utf8");

  assert.match(appErrorSource, /当前操作暂时无法完成/);
  assert.match(appErrorSource, /原始报错/);
  assert.match(appErrorSource, /重试当前页面/);
  assert.match(globalErrorSource, /页面暂时不可用/);
  assert.match(globalErrorSource, /全局错误兜底界面/);
  assert.match(globalErrorSource, /返回公开首页/);
});
