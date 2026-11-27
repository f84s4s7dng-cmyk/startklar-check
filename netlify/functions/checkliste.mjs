// Liefert die Checkliste (PDF) über den persönlichen Link aus der Mail bzw. von der Danke-Seite aus.
// Ohne gültigen Link gibt es keine PDF. Die Datei kommt aus druckversion/ (siehe netlify.toml, included_files).
import { getStore } from "@netlify/blobs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DOWNLOAD_DAYS } from "../lib/startklar.mjs";

const FILE = "druckversion/Startklar-Check.pdf";
let pdf;
async function load() {
  if (pdf) return pdf;
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const base of [process.cwd(), process.env.LAMBDA_TASK_ROOT, path.join(here, "../.."), path.join(here, "..")].filter(Boolean)) {
    try { return (pdf = await readFile(path.join(base, FILE))); } catch {}
  }
  throw new Error("checkliste: PDF nicht gefunden");
}

const gone = () => new Response(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link abgelaufen</title><meta name="robots" content="noindex"></head>
<body style="margin:0;background:#FAF6EC;color:#15253A;font:17px/1.55 Arial,sans-serif"><main style="max-width:520px;margin:0 auto;padding:48px 16px">
<h1 style="font-size:32px;line-height:1.1">Dieser Link gilt nicht mehr</h1><p>Hol dir die Checkliste einfach neu, das dauert eine Minute.</p>
<p><a href="/#papier" style="display:inline-block;background:#F4C430;color:#15253A;font-weight:bold;text-decoration:none;padding:14px 20px;border-radius:12px">Checkliste anfordern</a></p></main></body></html>`,
  { status: 404, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } });

export default async (req) => {
  const t = new URL(req.url).searchParams.get("t") || "";
  if (!/^[a-f0-9]{48}$/.test(t)) return gone();
  const meta = await getStore("downloads").getMetadata(t);
  if (!meta || Number(meta.metadata?.ts || 0) < Date.now() - DOWNLOAD_DAYS * 86400000) return gone();
  return new Response(await load(), { headers: {
    "content-type": "application/pdf",
    "content-disposition": 'inline; filename="Startklar-Checkliste.pdf"',
    "cache-control": "private, no-store",
    "x-robots-tag": "noindex",
  } });
};

export const config = { path: "/api/checkliste" };
