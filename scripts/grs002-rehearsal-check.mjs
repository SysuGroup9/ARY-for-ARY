const baseUrl = process.env.GRS002_BASE_URL ?? "http://127.0.0.1:3000";

const checks = [
  {
    path: "/jumbotron",
    requiredText: ["排序 Runner 演示赛", "Real-time TOP3", "Entry Inspect"],
  },
  {
    path: "/jumbotron?debug=1",
    requiredText: ["Vector Stable Sort", "Risk / Obs / Vio", "Track Mini Map"],
  },
  {
    path: "/jumbotron?track=city-hairpin&debug=1",
    requiredText: ["排序 Runner 演示赛", "Entry Inspect", "Risk / Obs / Vio"],
  },
  {
    path: "/jumbotron/calibrator",
    requiredText: ["Track Profile Calibrator", "Add Lane", "Set Start / Finish at Scrubber", "Export JSON"],
  },
];

async function main() {
  for (const check of checks) {
    const url = new URL(check.path, baseUrl);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${url} returned ${response.status}`);
    }

    const html = await response.text();
    const normalizedHtml = html.toLowerCase();
    for (const text of check.requiredText) {
      if (!normalizedHtml.includes(text.toLowerCase())) {
        throw new Error(`${url} is missing required text: ${text}`);
      }
    }

    console.log(`ok ${url}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
