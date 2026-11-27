// Baut die 10 Story-Vorlagen als PNG (1080 x 1920): node stories/build.mjs
// Ergebnis: stories/png/ (fertig zum Posten, Sticker-Fläche leer)
//      und  stories/png-markiert/ (Sticker-Fläche rosa markiert, zur Orientierung)
//      und  stories/png-ohne-foto/ (07–10 durchsichtig, Foto in Instagram selbst darunterlegen)
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
// Foto-Stories (07–10) als durchsichtige PNGs ohne Foto, zum Darüberlegen in Instagram
mkdirSync(path.join(dir, "png-ohne-foto"), { recursive: true });
const p2 = await browser.newPage({ viewport: { width: 1200, height: 2000 } });
await p2.goto(url + "#ohne-foto");
await p2.evaluate(() => document.fonts.ready);
for (const el of await p2.locator(".story:has(.foto)").all()) {
  const id = await el.getAttribute("id");
  await el.screenshot({ path: path.join(dir, "png-ohne-foto", id + "-ohne-foto.png"), omitBackground: true });
}
await browser.close();
console.log("fertig: stories/png/ und stories/png-markiert/");
