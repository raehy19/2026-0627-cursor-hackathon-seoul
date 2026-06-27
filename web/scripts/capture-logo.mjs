import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../public/logo.png");
const url = process.env.LOGO_CAPTURE_URL ?? "http://localhost:3002/logo-capture";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });

await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForSelector("#logo-capture-frame canvas", { timeout: 60_000 });
await page.waitForTimeout(2500);

const frame = page.locator("#logo-capture-frame");
const box = await frame.boundingBox();
if (!box || box.width !== 1024 || box.height !== 1024) {
  throw new Error(`Unexpected frame size: ${JSON.stringify(box)}`);
}

await frame.screenshot({ path: outPath, type: "png", omitBackground: false });
await browser.close();

console.log(`Saved ${outPath} (${box.width}x${box.height})`);
