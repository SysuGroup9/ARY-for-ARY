import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LiveHallView } from "./live-hall";
import { RacePageView } from "./race-page";
import type { RaceListItem } from "@/lib/services/races";

function r(overrides?: Partial<RaceListItem>): RaceListItem {
  return { id:"r1",title:"T",phase:"registration",summary:"s",taskDescription:"td",evaluationNotes:"en",taskPackageLabel:"pkg",trackId:"oval",keywords:["k1"],signupStart:new Date("2026-01"),signupEnd:new Date("2026-02"),raceStart:new Date("2026-03"),raceEnd:new Date("2026-04"),teams:[],projections:[],registrations:[],leaderboardEntries:[],...overrides } as unknown as RaceListItem;
}

test("[RL-01] live-hall 12 项中文标题全正确", () => {
  const h = renderToStaticMarkup(<LiveHallView race={r()}/>);
  assert.match(h,/实况大厅/); assert.match(h,/过程总览/); assert.match(h,/过程指标/);
  assert.match(h,/当前输出/); assert.match(h,/打开大屏/); assert.match(h,/打开大屏控制台/);
  assert.match(h,/报名状态/); assert.match(h,/当前榜单/); assert.match(h,/过程榜单/);
  assert.match(h,/最近事件/); assert.match(h,/骑手动态/);
  assert.doesNotMatch(h,/Live Hall/); assert.doesNotMatch(h,/Process Summary/); assert.doesNotMatch(h,/Open Jumbotron/);
});

test("[RL-02] race-page 公开入口+下一步全中文", () => {
  const h = renderToStaticMarkup(<RacePageView race={r()} raceSlug="r1--t"/>);
  assert.match(h,/公开入口/); assert.match(h,/查看作品/); assert.match(h,/查看赛果/);
  assert.match(h,/查看复盘/); assert.match(h,/查看合作/); assert.match(h,/返回赛事列表/);
  assert.match(h,/赛事概览/); assert.match(h,/规则说明/); assert.match(h,/赛程安排/);
  assert.match(h,/参赛骑手/); assert.match(h,/下一步入口/); assert.match(h,/报名时间/); assert.match(h,/比赛时间/);
  assert.doesNotMatch(h,/Public Entry/); assert.doesNotMatch(h,/View Works/); assert.doesNotMatch(h,/Next Steps/);
});
