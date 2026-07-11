import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { WorksDisplayView } from "./works-display";

test("works display renders a dedicated works showcase without public-page copy", () => {
  const html = renderToStaticMarkup(
    <WorksDisplayView
      race={{
        awards: [
          {
            awardName: "Best Overall",
            createdAt: new Date("2026-07-11T12:00:00Z"),
            decisionReason: "把路线、预算和夜景节奏收得最完整。",
            id: "award_1",
            publishedAt: new Date("2026-07-11T12:00:00Z"),
            rank: 1,
            registration: {
              user: {
                username: "mira",
              },
            },
            updatedAt: new Date("2026-07-11T12:00:00Z"),
            work: {
              id: "work_1",
              title: "GBA WanderMate",
            },
          },
        ],
        phase: "judging",
        registrations: [
          {
            awards: [
              {
                awardName: "Best Overall",
                rank: 1,
              },
            ],
            createdAt: new Date("2026-07-11T12:00:00Z"),
            id: "reg_1",
            user: {
              username: "mira",
            },
            work: {
              demoUrl: "https://example.com/demo",
              id: "work_1",
              summary: "三条湾区路线已经上墙：早茶、海岸、夜景，预算和交通都标清。",
              title: "GBA WanderMate",
              videoUrl: null,
            },
          },
          {
            awards: [],
            createdAt: new Date("2026-07-11T11:00:00Z"),
            id: "reg_2",
            user: {
              username: "ana",
            },
            work: {
              demoUrl: null,
              id: "work_2",
              summary: "周末短途游作品，节奏轻快，适合第一次来湾区的朋友。",
              title: "LocalJoy Agent",
              videoUrl: null,
            },
          },
          {
            awards: [],
            createdAt: new Date("2026-07-11T10:00:00Z"),
            id: "reg_3",
            user: {
              username: "kai",
            },
            work: null,
          },
        ],
        title: "湾区开心游",
      } as never}
    />,
  );

  assert.match(html, /作品展示/);
  assert.match(html, /湾区开心游作品墙/);
  assert.match(html, /精选作品/);
  assert.match(html, /作品橱窗/);
  assert.match(html, /GBA WanderMate/);
  assert.match(html, /LocalJoy Agent/);
  assert.match(html, /Best Overall/);
  assert.match(html, /评审中/);
  assert.match(html, /查看作品详情/);
  assert.match(html, /已提供公开 Demo/);
  assert.match(html, /作品筛选与排序/);
  assert.doesNotMatch(html, /Works \/ Showcase/);
  assert.doesNotMatch(html, /Featured Work/);
  assert.doesNotMatch(html, /Works filter and sort/);
  assert.doesNotMatch(html, /当前页面展示这场赛事已发布的公开作品/);
  assert.doesNotMatch(html, /排序：按发布时间/);
});
