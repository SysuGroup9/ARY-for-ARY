import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizerConsolePageView } from "./organizer-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return { awards:[],displayHighlightCount:3,displayShowOrganizerComment:false,displayShowRiderCode:false,displayShowTopHighlights:false,displayShowTrainingData:false,feedbackThreads:[],harnessEntries:[],highlights:[],id:"race_active",organizerComment:"",phase:"active",projections:[],raceEnd:new Date("2026-06-20T12:00:00Z"),raceStart:new Date("2026-06-19T12:00:00Z"),registrations:[],reports:[],runnerTasks:[],submissions:[],teamComments:[],teams:[],title:"T",leaderboardEntries:[],...overrides } as unknown as RaceListItem;
}

test("[OC-01] overview+settings 全中文标题", () => {
  const race = buildRace();
  const slug = "r--t";
  const h = renderToStaticMarkup(<OrganizerConsolePageView judgeAssignments={[]} judges={[]} race={race} raceSlug={slug} section="overview"/>) +
    renderToStaticMarkup(<OrganizerConsolePageView judgeAssignments={[]} judges={[]} race={race} raceSlug={slug} section="settings"/>);
  assert.match(h,/主办方视图/); assert.match(h,/赛事概览/); assert.match(h,/赛事内容/); assert.match(h,/显示选项/);
  assert.match(h,/保存赛事内容/); assert.match(h,/保存显示选项/); assert.match(h,/下一步入口/);
  assert.doesNotMatch(h,/Overview/); assert.doesNotMatch(h,/Settings/);
});
