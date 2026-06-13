import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const baseUrl = process.env.GRS002_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = process.env.GRS002_OUTPUT_DIR ?? "outputs";
const videoPath = join(outputDir, "grs002-jumbotron-captioned-demo.webm");
const srtPath = join("docs", "grs002-captioned-demo.zh.srt");
const chromeExecutable = process.env.PLAYWRIGHT_CHROME_EXECUTABLE ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const viewport = { height: 810, width: 1440 };

const scenes = [
  {
    bullets: [
      "GRS-001: Product Definition + 去中心化数据主权 PoC",
      "GRS-002: Jumbotron + Track Calibrator 子系统",
      "本视频无声音，字幕即讲解内容",
    ],
    durationMs: 12_000,
    subtitle: "本视频展示 ARY 平台 PoC、GRS-002 Jumbotron、Calibrator、runtime 架构和 Agent Riding 证据。",
    title: "ARY for ARY / GRS-002 Jumbotron",
    type: "slide",
  },
  {
    bullets: [
      "Organizer 掌握 Race 源数据和私有 Runner",
      "ARY 只展示公开元数据、公开投影和参与入口",
      "Rider / Audience 看到的是可公开传播的赛事状态",
    ],
    durationMs: 14_000,
    subtitle: "ARY 的核心边界是 Public Yard, Private Race Source：数据主权属于 Organizer，ARY 不中心化保存完整 Race 源数据。",
    title: "ARY 平台边界",
    type: "slide",
  },
  {
    bullets: [
      "真实账号：Organizer / Rider Cookie Session",
      "Rider 提交代码后生成 Runner task",
      "Organizer 私有 Runner 拉取任务并回传公开分数",
      "Audience 和 Jumbotron 只消费公开投影",
    ],
    durationMs: 14_000,
    subtitle: "GRS-001 PoC 已证明赛事创建、报名、提交、私有 Runner 评分和公开榜单展示链路可以运行。",
    title: "GRS-001 PoC 链路",
    type: "slide",
  },
  {
    actions: [{ delayMs: 6_000, name: "clickTopEntry" }],
    durationMs: 22_000,
    path: "/jumbotron?debug=1",
    subtitle: "这是 GRS-002 的 Race Live View。观众能看到 LIVE 状态、TOP3、KPI、主赛道、消息气泡和风险 ticker。",
    title: "Race Live View",
    type: "route",
  },
  {
    durationMs: 20_000,
    path: "/jumbotron?debug=1",
    subtitle: "Debug 模式展示 centerline、sampled points、lane offsets、risk zones 和 collision boxes，证明赛马位置不是写死在图片里。",
    title: "可信几何 Debug",
    type: "route",
  },
  {
    durationMs: 18_000,
    path: "/jumbotron?track=city-hairpin&debug=1",
    subtitle: "切换到 city-hairpin 后，同一套 runtime 会根据新的 track.profile.json 重新计算 horse pose，证明赛道资产可复用。",
    title: "第二条赛道资产",
    type: "route",
  },
  {
    actions: [
      { delayMs: 4_000, name: "clickAddLane" },
      { delayMs: 9_000, name: "clickSetStartFinish" },
    ],
    durationMs: 24_000,
    path: "/jumbotron/calibrator",
    subtitle: "Calibrator 把视觉底图变成语义赛道资产：可以编辑 centerline、start / finish、lanes、checkpoints 和 zones。",
    title: "Track Profile Calibrator",
    type: "route",
  },
  {
    bullets: [
      "background 只负责视觉",
      "centerline.points 描述赛道几何",
      "lanes 使用 normal offset 派生",
      "checkpoints / message zones / risk zones 使用 s 轴范围",
    ],
    durationMs: 16_000,
    subtitle: "导出的 track.profile.json 是运行时事实来源。背景图不是定位来源，马匹、排名、消息和风险都由数据驱动。",
    title: "track.profile.json 的作用",
    type: "slide",
  },
  {
    bullets: [
      "contracts.ts: JumbotronSnapshot / RacingEntrySnapshot / AttentionItem",
      "adapter.ts: DCR Race -> JumbotronSnapshot",
      "track-runtime.ts: progress + profile -> HorsePose",
      "mock-racing-data.ts / prisma/seed.ts: 可复现数据故事",
    ],
    durationMs: 18_000,
    subtitle: "数据链路从 DCR 公开投影进入 Jumbotron snapshot，再由 track-runtime 计算位置、旋转、状态和碰撞框。",
    title: "Runtime Architecture",
    type: "slide",
  },
  {
    bullets: [
      "4 支 seed 队伍：Vector / Orbit / Pulse / Cedar",
      "不同 Agent provider、token usage 和提交状态",
      "Runner task、feedback、notification 映射成 ticker / bubble / risk",
    ],
    durationMs: 16_000,
    subtitle: "seed 数据不是单一静态 mock，而是半真实 DCR 故事：队伍、提交、Runner task、反馈、通知共同驱动大屏。",
    title: "Data Story",
    type: "slide",
  },
  {
    bullets: [
      "先按 rubric 识别 MVP 不足",
      "补 Riding Record、视频脚本、debug evidence",
      "补 Entry Inspect、Calibrator 完整流程、seed story",
      "补 PR 描述、提交清单、彩排脚本和视频产物",
    ],
    durationMs: 18_000,
    subtitle: "Agent Riding 的重点是人持续观察、质疑和纠偏，而不是让 Agent 一次性生成一个漂亮但不可解释的大屏。",
    title: "Agent Riding Process",
    type: "slide",
  },
  {
    bullets: [
      "node --import tsx --test src/lib/jumbotron/*.test.ts",
      "node --import tsx --test src/lib/*.test.ts",
      "node --import tsx --test organizer_demo/runner_demo/src/*.test.ts",
      "npm run lint && npm run build",
      "npm run grs002:check && npm run grs002:record:captioned",
    ],
    durationMs: 14_000,
    subtitle: "最终验收包含单元测试、lint、build、四个关键页面彩排和字幕版无声浏览器录制。",
    title: "Verification",
    type: "slide",
  },
  {
    bullets: [
      "Calibrator 目前导出本地 JSON / SVG，不写数据库",
      "Remote Racing Cockpit 只保留公开入口，不实现完整鉴权",
      "当前是 2D SVG runtime，不是物理引擎或 3D 引擎",
      "如需最终口播，可基于本字幕版继续剪辑",
    ],
    durationMs: 16_000,
    subtitle: "PoC 边界是诚实提交的一部分：我们证明可信大屏和赛道校准流程成立，但没有声称完成完整生产级赛事平台。",
    title: "PoC Boundaries",
    type: "slide",
  },
  {
    bullets: [
      "Jumbotron: 公开、可解释、数据驱动",
      "Calibrator: 可校准、可验证、可导出",
      "Runtime: track profile + snapshot + horse pose",
      "Riding Record: 计划、干预、错误、验证、复盘",
    ],
    durationMs: 12_000,
    subtitle: "这套提交证明：Jumbotron 可以由可信数据和可信几何驱动，形成可运行、可解释、可复用的赛事现场大屏。",
    title: "Submission Summary",
    type: "slide",
  },
];

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    throw new Error([
      "Unable to import Playwright.",
      "Run `npm install` first.",
      error instanceof Error ? error.message : String(error),
    ].join("\n"));
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await writeFile(srtPath, buildSrt(scenes), "utf8");

  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({
    executablePath: chromeExecutable,
    headless: true,
  });
  const context = await browser.newContext({
    recordVideo: {
      dir: outputDir,
      size: viewport,
    },
    viewport,
  });
  const page = await context.newPage();

  for (const [index, scene] of scenes.entries()) {
    console.log(`scene ${index + 1}/${scenes.length}: ${scene.title}`);
    if (scene.type === "slide") {
      await page.setContent(buildSlideHtml(scene), { waitUntil: "domcontentloaded" });
    } else {
      await page.goto(new URL(scene.path, baseUrl).toString(), { waitUntil: "networkidle" });
      await installCaptionOverlay(page);
      await setCaption(page, scene.title, scene.subtitle);
    }

    await runSceneActions(page, scene.actions ?? []);
    await page.waitForTimeout(scene.durationMs);
  }

  const video = page.video();
  await page.close();
  const tempVideoPath = video ? await video.path() : "";
  await context.close();
  await browser.close();

  if (!tempVideoPath) {
    throw new Error("Playwright did not produce a video artifact.");
  }

  await copyFile(tempVideoPath, videoPath);
  console.log(`saved ${videoPath}`);
  console.log(`saved ${srtPath}`);
}

async function runSceneActions(page, actions) {
  const startedAt = Date.now();
  for (const action of actions) {
    const elapsed = Date.now() - startedAt;
    if (action.delayMs > elapsed) {
      await page.waitForTimeout(action.delayMs - elapsed);
    }

    await runAction(page, action.name);
  }
}

async function runAction(page, name) {
  if (name === "clickTopEntry") {
    await clickIfVisible(page, "button", "Inspect entry", 1);
    return;
  }

  if (name === "clickAddLane") {
    await clickIfVisible(page, "button", "Add Lane");
    return;
  }

  if (name === "clickSetStartFinish") {
    await clickIfVisible(page, "button", "Set Start / Finish at Scrubber");
  }
}

async function clickIfVisible(page, tagName, text, index = 0) {
  const locator = page.locator(`${tagName}:has-text("${text}")`).nth(index);
  if ((await locator.count()) > 0 && (await locator.isVisible())) {
    await locator.click();
  }
}

async function installCaptionOverlay(page) {
  await page.addStyleTag({
    content: `
      #grs002-caption-overlay {
        position: fixed;
        left: 50%;
        bottom: 24px;
        z-index: 2147483647;
        width: min(1180px, calc(100vw - 64px));
        transform: translateX(-50%);
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.78);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.36);
        color: #fff;
        font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
        padding: 14px 18px 16px;
        pointer-events: none;
      }
      #grs002-caption-title {
        color: #f2be5c;
        font-size: 18px;
        font-weight: 900;
        letter-spacing: 0;
        margin-bottom: 6px;
      }
      #grs002-caption-text {
        font-size: 25px;
        font-weight: 800;
        line-height: 1.42;
        text-wrap: balance;
      }
    `,
  });
  await page.evaluate(() => {
    const previous = document.getElementById("grs002-caption-overlay");
    previous?.remove();
    const overlay = document.createElement("div");
    overlay.id = "grs002-caption-overlay";
    overlay.innerHTML = `
      <div id="grs002-caption-title"></div>
      <div id="grs002-caption-text"></div>
    `;
    document.body.appendChild(overlay);
  });
}

async function setCaption(page, title, subtitle) {
  await page.evaluate(({ title, subtitle }) => {
    const titleNode = document.getElementById("grs002-caption-title");
    const textNode = document.getElementById("grs002-caption-text");
    if (titleNode) titleNode.textContent = title;
    if (textNode) textNode.textContent = subtitle;
  }, { title, subtitle });
}

function buildSlideHtml(scene) {
  const bullets = scene.bullets
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        width: 100vw;
        height: 100vh;
        margin: 0;
        overflow: hidden;
        background:
          linear-gradient(135deg, rgba(6, 16, 15, 0.98), rgba(21, 31, 28, 0.98) 52%, rgba(50, 36, 24, 0.96)),
          #0a1110;
        color: #f7f3e8;
        font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
      }
      main {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-rows: 1fr auto;
        padding: 58px 72px 36px;
      }
      section {
        display: grid;
        align-content: center;
        max-width: 1160px;
      }
      p.eyebrow {
        margin: 0 0 18px;
        color: #f2be5c;
        font-size: 18px;
        font-weight: 900;
        text-transform: uppercase;
      }
      h1 {
        max-width: 1080px;
        margin: 0;
        color: #fff9e8;
        font-size: 72px;
        line-height: 1.06;
        letter-spacing: 0;
      }
      ul {
        display: grid;
        gap: 16px;
        max-width: 980px;
        margin: 36px 0 0;
        padding: 0;
        list-style: none;
      }
      li {
        border-left: 5px solid #5ed1ff;
        background: rgba(255, 255, 255, 0.07);
        border-radius: 8px;
        padding: 14px 18px;
        font-size: 28px;
        font-weight: 800;
        line-height: 1.35;
      }
      footer {
        display: flex;
        gap: 12px;
        color: #c8d7cf;
        font-size: 18px;
        font-weight: 800;
      }
      footer span {
        border: 1px solid rgba(255,255,255,0.16);
        border-radius: 8px;
        padding: 9px 12px;
        background: rgba(255,255,255,0.06);
      }
      #grs002-caption-overlay {
        position: fixed;
        left: 50%;
        bottom: 24px;
        z-index: 2147483647;
        width: min(1180px, calc(100vw - 64px));
        transform: translateX(-50%);
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.78);
        color: #fff;
        padding: 14px 18px 16px;
      }
      #grs002-caption-title {
        color: #f2be5c;
        font-size: 18px;
        font-weight: 900;
        margin-bottom: 6px;
      }
      #grs002-caption-text {
        font-size: 25px;
        font-weight: 800;
        line-height: 1.42;
        text-wrap: balance;
      }
    </style>
  </head>
  <body>
    <main>
      <section>
        <p class="eyebrow">ARY / GRS-002 Evidence Video</p>
        <h1>${escapeHtml(scene.title)}</h1>
        <ul>${bullets}</ul>
      </section>
      <footer>
        <span>Race Live View</span>
        <span>Track Calibrator</span>
        <span>Agent Riding Record</span>
      </footer>
    </main>
    <div id="grs002-caption-overlay">
      <div id="grs002-caption-title">${escapeHtml(scene.title)}</div>
      <div id="grs002-caption-text">${escapeHtml(scene.subtitle)}</div>
    </div>
  </body>
</html>`;
}

function buildSrt(items) {
  let cursorMs = 0;
  return items
    .map((scene, index) => {
      const start = cursorMs;
      const end = cursorMs + scene.durationMs;
      cursorMs = end;
      return [
        String(index + 1),
        `${formatSrtTime(start)} --> ${formatSrtTime(end)}`,
        `${scene.title}：${scene.subtitle}`,
        "",
      ].join("\n");
    })
    .join("\n");
}

function formatSrtTime(valueMs) {
  const hours = Math.floor(valueMs / 3_600_000);
  const minutes = Math.floor((valueMs % 3_600_000) / 60_000);
  const seconds = Math.floor((valueMs % 60_000) / 1_000);
  const milliseconds = valueMs % 1_000;
  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":") + `,${String(milliseconds).padStart(3, "0")}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
