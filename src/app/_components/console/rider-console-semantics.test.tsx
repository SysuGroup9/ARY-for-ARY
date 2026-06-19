import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RiderConsolePageView } from "./rider-console-page";
import type { RaceListItem } from "@/lib/services/races";

function r(overrides?: Partial<RaceListItem>): RaceListItem {
  return { feedbackThreads:[],highlights:[],id:"r1",leaderboardEntries:[],organizerComment:"",phase:"active",raceEnd:new Date("2026-06-20"),raceStart:new Date("2026-06-19"),submissions:[],teamComments:[],teamArchives:[],title:"T",...overrides } as unknown as RaceListItem;
}

test("[RC-01] 6 section 全中文语义", () => {
  const h = render(RiderConsolePageView, [["registration",null],["submission",null],["review",null],["ca-setup",null],["riding",null]]);
  assert.match(h,/报名/); assert.match(h,/作品提交/); assert.match(h,/评审/); assert.match(h,/CA 接入/); assert.match(h,/骑行/);
  assert.doesNotMatch(h,/Registration/); assert.doesNotMatch(h,/Submission/); assert.doesNotMatch(h,/Review Result/);
});

test("[RC-02] report→骑手报告+不暴露过渡层", () => {
  const h = renderToStaticMarkup(<RiderConsolePageView race={r({organizerComment:"s",teamArchives:[{teamId:"t1",totalScore:91} as any]})} registration={{evidences:[{id:"e",summary:"s",title:"t",type:"INTERNAL"}]} as never} reviewSummary={null} riderReports={[]} riderTeam={{id:"t1",name:"solo"} as never} section="report"/>);
  assert.match(h,/骑手报告/); assert.match(h,/最终得分/);
  assert.doesNotMatch(h,/Transitional/); assert.doesNotMatch(h,/Highlight/); assert.doesNotMatch(h,/Rider Report/);
});

test("[RC-03] 不暴露 compatibility 层+赛事上下文保留", () => {
  const h = render(RiderConsolePageView, [["registration",null],["submission",null]]);
  assert.doesNotMatch(h,/Compatibility/); assert.doesNotMatch(h,/compatibility/); assert.match(h,/赛事上下文始终保留在当前页面/);
});

// 帮助函数：对多 section 批量渲染
function render(Component: typeof RiderConsolePageView, sections: Array<[string, any]>) {
  return sections.map(([s,xtra]) => renderToStaticMarkup(
    <Component race={r()} registration={null} reviewSummary={null} riderReports={[]} riderTeam={null} section={s as any} {...(xtra??{})}/>
  )).join("");
}
