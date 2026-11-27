// Baut die Druckversion als PDF: node druckversion/build.mjs
// Braucht Playwright mit Chromium. Ergebnis: druckversion/Startklar-Check.pdf (kompakt, 2 Seiten)
// Ausführliche Fassung (8 Seiten): node druckversion/build.mjs ausfuehrlich
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const dir = path.dirname(fileURLToPath(import.meta.url));
const lang = process.argv[2] === "ausfuehrlich";
const src = lang ? "startklar-check-ausfuehrlich.html" : "startklar-check.html";
const out = lang ? "Startklar-Check-ausfuehrlich.pdf" : "Startklar-Check.pdf";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(dir, src)).href);
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: path.join(dir, out), format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log("fertig: druckversion/" + out);
