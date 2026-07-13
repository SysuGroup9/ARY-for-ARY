import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const OVAL = "race_active_oval--%F0%9F%8F%87-%E8%B7%AF%E5%BE%84%E4%BC%98%E5%8C%96%E6%8C%91%E6%88%98%E8%B5%9B";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.locator('input[name="username"]').first().fill("rider_eve");
await page.locator('input[name="password"]').first().fill("rider123");
const loginForm = page.locator('form').filter({ has: page.locator('input[name="username"]') }).first();
await loginForm.locator('button[type="submit"]').click();
await page.waitForTimeout(2000);
await page.goto(`${BASE}/console/races/${OVAL}/rider/review`, { waitUntil: "domcontentloaded", timeout: 10000 });
await page.waitForTimeout(2000);
const body = await page.textContent("body");
console.log("Review page body:", body.slice(0, 800));
await browser.close();
