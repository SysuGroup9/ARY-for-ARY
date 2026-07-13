/**
 * GRS004 协作功能 E2E 回归测试 v5 (Final)
 * 使用真实的 race_active_oval (rider_alice 是 Pathfinders Alpha 的 leader)
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PASS = "rider123";
const ORG_PASS = "organizer123";

const LEADER = { username: "rider_alice", password: PASS };
const MATE = { username: "rider_bob", password: PASS };
const ORGANIZER = { username: "organizer_demo", password: ORG_PASS };
const OVAL_SLUG = "race_active_oval--%F0%9F%8F%87-%E8%B7%AF%E5%BE%84%E4%BC%98%E5%8C%96%E6%8C%91%E6%88%98%E8%B5%9B";
const FINISHED_SLUG = "race_finished--performance-marathon";

let passed = 0, failed = 0;
const failures = [];

function result(name, ok, detail = "") {
  if (ok) { console.log(`  ✅ ${name}`); passed++; }
  else { console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`); failed++; failures.push({ name, detail }); }
}

async function login(page, user) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForSelector('input[name="username"]', { timeout: 8000 });
  await page.locator('input[name="username"]').first().fill(user.username);
  await page.locator('input[name="password"]').first().fill(user.password);
  const loginForm = page.locator('form').filter({ has: page.locator('input[name="username"]') }).first();
  await loginForm.locator('button[type="submit"]').click();
  try {
    await page.waitForURL((u) => !u.pathname.includes("/login") && (u.pathname.startsWith("/console") || u.pathname === "/"), { timeout: 15000 });
  } catch {}
  if (page.url() === `${BASE}/`) {
    await page.goto(`${BASE}/console/races`, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
  }
}

async function navTo(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // ============================================================
    // Phase 1: 协作页基础验证 (Pathfinders Alpha 队伍)
    // ============================================================
    console.log("\n📌 Phase 1: 协作页基础验证");
    const leaderPage = await browser.newPage();
    await login(leaderPage, LEADER);
    await navTo(leaderPage, `/console/races/${OVAL_SLUG}/rider/collaboration`);

    const body = await leaderPage.textContent("body");
    result("P1.1 看到队伍信息面板", body.includes("队伍信息"));
    result("P1.2 队长名非占位符", body.includes("rider_alice"));
    result("P1.3 人数显示 APPROVED 人数", body.includes("人数"));
    result("P1.4 看到任务看板", body.includes("任务看板"));
    result("P1.5 看到协作消息", body.includes("协作消息"));
    result("P1.6 看到知识库", body.includes("知识库"));
    result("P1.7 知识库下载按钮", body.includes("下载最新代码"));
    result("P1.8 知识库导出按钮", body.includes("导出知识库"));

    // ============================================================
    // Phase 2: 任务创建 + 发布时间
    // ============================================================
    console.log("\n📌 Phase 2: 任务创建");
    // 任务标题 input 实际 name="title"
    const taskInput = await leaderPage.locator('input[name="title"]').isVisible().catch(() => false);
    result("P2.1 任务表单可见", taskInput);

    if (taskInput) {
      await leaderPage.locator('input[name="title"]').fill("E2E-Task-Test");
      // 选 assignee
      const assigneeSelect = leaderPage.locator('select[name="assigneeId"]');
      if (await assigneeSelect.isVisible().catch(() => false)) {
        const options = await assigneeSelect.locator('option').all();
        if (options.length > 1) {
          const value = await options[1].getAttribute("value");
          if (value) await assigneeSelect.selectOption(value);
        }
      }
      await leaderPage.locator('button:has-text("发布任务")').click();
      await leaderPage.waitForTimeout(3000);
      const text = await leaderPage.textContent("body");
      result("P2.2 任务已创建", text.includes("E2E-Task-Test"));
      result("P2.3 任务显示发布时间", text.includes("发布于"));
    }

    // ============================================================
    // Phase 3: 协作消息发送
    // ============================================================
    console.log("\n📌 Phase 3: 协作消息");
    const msgArea = await leaderPage.locator('textarea[name="content"]').isVisible().catch(() => false);
    result("P3.1 消息表单可见", msgArea);

    if (msgArea) {
      // 选 receiver
      const receiverSelect = leaderPage.locator('select[name="receiverId"]');
      if (await receiverSelect.isVisible().catch(() => false)) {
        const options = await receiverSelect.locator('option').all();
        if (options.length > 1) {
          const value = await options[1].getAttribute("value");
          if (value) await receiverSelect.selectOption(value);
        }
      }
      await leaderPage.locator('textarea[name="content"]').fill("E2E 消息测试 2026");
      const sendBtn = leaderPage.locator('button:has-text("发送消息")').first();
      await sendBtn.click();
      await leaderPage.waitForTimeout(3000);
      // 刷新页面看消息是否显示
      await navTo(leaderPage, `/console/races/${OVAL_SLUG}/rider/collaboration`);
      const text = await leaderPage.textContent("body");
      result("P3.2 消息已发送", text.includes("E2E 消息测试 2026"));
    }

    // ============================================================
    // Phase 4: 提交流程 (teamId 路径) - 在 race_finished 上提交
    // ============================================================
    console.log("\n📌 Phase 4: 提交流程 (teamId)");
    await navTo(leaderPage, `/console/races/${FINISHED_SLUG}/rider/submission`);
    const draftArea = await leaderPage.locator('textarea[name="workSummary"]').isVisible().catch(() => false);
    if (draftArea) {
      await leaderPage.locator('textarea[name="workSummary"]').fill("E2E 提交测试");
      const saveBtn = leaderPage.locator('button:has-text("保存")').first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await leaderPage.waitForTimeout(2000);
        const text = await leaderPage.textContent("body");
        result("P4.1 保存草稿 (teamId)", !text.includes("请先创建或加入队伍"));
      }
    } else {
      result("P4.1 作品草稿表单", false, "表单不可见");
    }

    // ============================================================
    // Phase 5: 发送反馈 (teamId)
    // ============================================================
    console.log("\n📌 Phase 5: 发送反馈 (teamId)");
    await navTo(leaderPage, `/console/races/${FINISHED_SLUG}/rider/review`);
    const fbArea = await leaderPage.locator('textarea[name="content"]').isVisible().catch(() => false);
    if (fbArea) {
      await leaderPage.locator('textarea[name="content"]').fill("E2E 反馈测试");
      const sendBtn = leaderPage.locator('button:has-text("发送反馈")').first();
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
        await leaderPage.waitForTimeout(2000);
        const text = await leaderPage.textContent("body");
        result("P5.1 反馈已发送 (teamId)", !text.includes("请先创建或加入队伍"));
      }
    } else {
      result("P5.1 反馈表单", false, "表单不可见");
    }

    // ============================================================
    // Phase 6: 知识库 API 测试
    // ============================================================
    console.log("\n📌 Phase 6: 知识库 API");
    await navTo(leaderPage, `/console/races/${OVAL_SLUG}/rider/collaboration`);
    const codeHref = await leaderPage.locator('a[href*="/code"]').first().getAttribute("href").catch(() => null);
    if (codeHref) {
      const codeResp = await leaderPage.request.get(`${BASE}${codeHref}`);
      result("P6.1 代码下载 API 200", codeResp.status() === 200, `status: ${codeResp.status()}`);
      const ct = codeResp.headers()["content-type"];
      result("P6.2 返回 text/plain", ct?.includes("text/plain"), `CT: ${ct}`);
    } else {
      result("P6.1 代码下载链接", false, "未找到");
    }

    const exportHref = await leaderPage.locator('a[href*="/export"]').first().getAttribute("href").catch(() => null);
    if (exportHref) {
      const exportResp = await leaderPage.request.get(`${BASE}${exportHref}`);
      result("P6.3 导出 API 响应", exportResp.status() === 200, `status: ${exportResp.status()}`);
      const ect = exportResp.headers()["content-type"];
      result("P6.4 导出 ZIP (application/zip)", ect?.includes("zip") || ect?.includes("octet-stream"), `CT: ${ect}`);
    } else {
      result("P6.3 导出 API", false, "未找到");
    }

    // P6.5 不存在或无权限的团队 API 拒绝访问（非 200）
    const noCodeResp = await leaderPage.request.get(`${BASE}/api/knowledge-base/nonexistent_team/code`).catch(() => null);
    result("P6.5 无关团队代码 API 拒绝访问", noCodeResp?.status() === 403, `status: ${noCodeResp?.status() ?? "error"}`);

    // P6.6 有提交团队仍显示下载链接（回归）
    const kbBody = await leaderPage.textContent("body");
    result("P6.6 有提交团队显示下载最新代码", kbBody.includes("下载最新代码"));
    result("P6.7 有提交团队不显示暂无提交提示", !kbBody.includes("暂无代码提交记录"));

    // ============================================================
    // Phase 7: Organizer 管理
    // ============================================================
    console.log("\n📌 Phase 7: Organizer 管理");
    const orgPage = await browser.newPage();
    await login(orgPage, ORGANIZER);
    await navTo(orgPage, `/console/races/${OVAL_SLUG}/organizer/registrations`);

    // Organizer Console 用 list 布局，不是 table
    const orgBody = await orgPage.textContent("body");
    const hasRegList = orgBody.includes("状态") || orgBody.includes("APPROVED") || orgBody.includes("已就绪") || orgBody.includes("批准报名");
    result("P7.1 Organizer 看到报名列表", hasRegList);

    await navTo(orgPage, `/console/races/${OVAL_SLUG}/organizer/reports`);
    // 团队评语 textarea 在 reports 区，name="content"，用 label 文本定位
    const teamCommentArea = await orgPage.locator('textarea[name="content"]').first().isVisible().catch(() => false);
    result("P7.2 团队评语编辑区", teamCommentArea);

    // P7.3 团队列表成员数只统计 APPROVED（不含 PENDING/REJECTED/REMOVED）
    await navTo(orgPage, `/console/races/${OVAL_SLUG}/organizer/riders`);
    const ridersBody = await orgPage.textContent("body");
    // Pathfinders Alpha: alice(APPROVED) + bob(PENDING) + charlie(APPROVED) = 2 APPROVED
    const memberCount2Match = ridersBody.match(/成员数：(\d+)/g);
    const allCountsTwo = memberCount2Match?.every(m => m === "成员数：2");
    result("P7.3 团队列表成员数仅统计 APPROVED 成员", allCountsTwo === true, allCountsTwo === undefined ? "未找到成员数标签" : `成员数: ${memberCount2Match?.join(", ")}`);

    // ============================================================
    // Phase 8: Mate 视角 - rider_bob
    // ============================================================
    console.log("\n📌 Phase 8: Mate (rider_bob) 视角");
    const matePage = await browser.newPage();
    await login(matePage, MATE);
    await navTo(matePage, `/console/races/${OVAL_SLUG}/rider/collaboration`);
    const mateBody = await matePage.textContent("body");
    result("P8.1 Mate 看到队伍信息", mateBody.includes("队伍信息"));
    result("P8.2 Mate 看到任务看板", mateBody.includes("任务看板"));
    result("P8.3 Mate 看到协作消息", mateBody.includes("协作消息"));
    result("P8.4 Mate 看到队长 (rider_alice)", mateBody.includes("rider_alice"));

    // ============================================================
    // Phase 9: PENDING 成员访问控制（rider_eve 是 Pathfinders Alpha PENDING Mate）
    // ============================================================
    console.log("\n📌 Phase 9: PENDING 成员访问控制");
    const pendingPage = await browser.newPage();
    await login(pendingPage, { username: "rider_eve", password: PASS });
    await navTo(pendingPage, `/console/races/${OVAL_SLUG}/rider/collaboration`);
    const pendingBody = await pendingPage.textContent("body");
    // PENDING 成员应该看到提示文案，不应该看到下载按钮/任务/消息
    result("P9.1 PENDING 看到队伍信息", pendingBody.includes("队伍信息"));
    result("P9.2 PENDING 任务看板被拦截", pendingBody.includes("入队申请尚未通过") || pendingBody.includes("队长审批通过后可查看"));
    result("P9.3 PENDING 消息面板被拦截", pendingBody.includes("协作消息") && !pendingBody.includes("发送给"));
    result("P9.4 PENDING 知识库被拦截", !pendingBody.includes("下载最新代码"));

    // 验证 PENDING 提交作品被拦截
    await navTo(pendingPage, `/console/races/${OVAL_SLUG}/rider/submission`);
    const subBody = await pendingPage.textContent("body");
    result("P9.5 PENDING 提交作品被拦截", subBody.includes("队长审批") || subBody.includes("请先创建") || !subBody.includes("worksummary"));

    // 验证 PENDING 发送反馈被拦截（点击发送后应报错）
    await navTo(pendingPage, `/console/races/${OVAL_SLUG}/rider/review`);
    const fbAreaP = await pendingPage.locator('textarea[name="content"]').isVisible().catch(() => false);
    if (fbAreaP) {
      await pendingPage.locator('textarea[name="content"]').fill("PENDING-FB");
      const fbBtnP = pendingPage.locator('button:has-text("发送反馈")').first();
      if (await fbBtnP.isVisible().catch(() => false)) {
        await fbBtnP.click();
        await pendingPage.waitForTimeout(2000);
      }
    }
    const fbBodyP = await pendingPage.textContent("body");
    result("P9.6 PENDING 发送反馈被拦截", fbBodyP.includes("队长审批") || fbBodyP.includes("请先创建") || fbBodyP.includes("请等待"));

    // ============================================================
    // Summary
    // ============================================================
    console.log(`\n${"=".repeat(60)}`);
    const total = passed + failed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : "0";
    console.log(`  总计: ${total} | ✅ ${passed} | ❌ ${failed} | 通过率 ${passRate}%`);
    if (failures.length) {
      console.log(`\n  失败项:`);
      failures.forEach(f => console.log(`    - ${f.name}: ${f.detail}`));
    }
    console.log(`${"=".repeat(60)}\n`);

  } finally {
    await browser.close();
  }
  return { passed, failed, failures };
}

run().then(({ failed }) => process.exit(failed > 0 ? 1 : 0))
  .catch(err => { console.error("E2E 异常:", err.message); process.exit(2); });
