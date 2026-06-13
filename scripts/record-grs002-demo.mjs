import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const baseUrl = process.env.GRS002_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = process.env.GRS002_OUTPUT_DIR ?? "outputs";
const outputPath = join(outputDir, "grs002-jumbotron-silent-demo.webm");
const chromeExecutable = process.env.PLAYWRIGHT_CHROME_EXECUTABLE ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    throw new Error(
      [
        "Unable to import Playwright.",
        "Install it with `npm install --save-dev playwright`, or run this script in an environment where Playwright is available.",
        error instanceof Error ? error.message : String(error),
      ].join("\n"),
    );
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({
    executablePath: chromeExecutable,
    headless: true,
  });
  const context = await browser.newContext({
    recordVideo: {
      dir: outputDir,
      size: {
        height: 810,
        width: 1440,
      },
    },
    viewport: {
      height: 810,
      width: 1440,
    },
  });
  const page = await context.newPage();

  await gotoAndPause(page, "/jumbotron?debug=1", 4500);
  await clickIfVisible(page, "button", "Inspect entry");
  await page.waitForTimeout(2200);
  await gotoAndPause(page, "/jumbotron?track=city-hairpin&debug=1", 3500);
  await gotoAndPause(page, "/jumbotron/calibrator", 2500);
  await clickIfVisible(page, "button", "Add Lane");
  await clickIfVisible(page, "button", "Set Start / Finish at Scrubber");
  await page.waitForTimeout(1600);

  const video = page.video();
  await page.close();
  const tempVideoPath = video ? await video.path() : "";
  await context.close();
  await browser.close();

  if (!tempVideoPath) {
    throw new Error("Playwright did not produce a video artifact.");
  }

  await copyFile(tempVideoPath, outputPath);
  console.log(`saved ${outputPath}`);
}

async function gotoAndPause(page, path, timeoutMs) {
  await page.goto(new URL(path, baseUrl).toString(), {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(timeoutMs);
}

async function clickIfVisible(page, tagName, text) {
  const locator = page.locator(`${tagName}:has-text("${text}")`).first();
  if ((await locator.count()) > 0 && (await locator.isVisible())) {
    await locator.click();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
