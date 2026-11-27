// Baut die Druckversion als PDF: node druckversion/build.mjs
// Braucht Playwright mit Chromium. Ergebnis: druckversion/Startklar-Check.pdf
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(dir, "startklar-check.html")).href);
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: path.join(dir, "Startklar-Check.pdf"), format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log("fertig: druckversion/Startklar-Check.pdf");
