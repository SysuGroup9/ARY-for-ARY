import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminConsolePageView } from "./admin-console-page";

function us(count: number) {
  return Array.from({length:count},(_,i)=>({id:`u${i}`,profileCompleted:i%2===0,roles:(i===0?["ADMIN","ORGANIZER"]:i===1?["JUDGE"]:i===2?["RIDER"]:["ORGANIZER"])as any[],username:`user_${i}`}));
}

test("[AC-01] 3 section 全中文标题", () => {
  const h = ["users","profile-completion","roles"].map(s=>renderToStaticMarkup(<AdminConsolePageView section={s as any} users={us(1)}/>)).join("");
  assert.match(h,/用户列表/); assert.match(h,/资料补全/); assert.match(h,/角色维护/); assert.match(h,/管理控制台/);
});

test("[AC-02] 4 角色中文标签无英文", () => {
  const h = renderToStaticMarkup(<AdminConsolePageView section="users" users={us(4)}/>);
  assert.match(h,/管理员/); assert.match(h,/评委/); assert.match(h,/主办方/); assert.match(h,/骑手/);
  assert.doesNotMatch(h,/ADMIN/); assert.doesNotMatch(h,/JUDGE/); assert.doesNotMatch(h,/ORGANIZER/); assert.doesNotMatch(h,/RIDER/);
});

test("[AC-03] 资料状态+角色维护+治理说明全中文", () => {
  const h = renderToStaticMarkup(<AdminConsolePageView section="profile-completion" users={us(3)}/>) +
    renderToStaticMarkup(<AdminConsolePageView section="roles" users={us(1)}/>);
  assert.match(h,/已补全/); assert.match(h,/待补全/);
  assert.match(h,/保存角色/); assert.match(h,/最小账号治理/);
});
