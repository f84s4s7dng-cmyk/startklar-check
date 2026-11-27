// Baut die 10 Story-Vorlagen als PNG (1080 x 1920): node stories/build.mjs
// Ergebnis: stories/png/ (fertig zum Posten, Sticker-Fläche leer)
//      und  stories/png-markiert/ (Sticker-Fläche rosa markiert, zur Orientierung)
// Fotos vorher nach stories/fotos/ legen (Namen siehe README im Ordner).
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdirSync } from "node:fs";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const dir = path.dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(path.join(dir, "stories.html")).href;
const browser = await chromium.launch();
for (const [ordner, hash] of [["png", ""], ["png-markiert", "#markiert"]]) {
  mkdirSync(path.join(dir, ordner), { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 2000 } });
  await page.goto(url + hash);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  for (const el of await page.locator(".story").all()) {
    const id = await el.getAttribute("id");
    await el.screenshot({ path: path.join(dir, ordner, id + ".png") });
  }
  await page.close();
}
await browser.close();
console.log("fertig: stories/png/ und stories/png-markiert/");
