// Läuft einmal am Tag: löscht zwischengespeicherte Ergebnisse, die nach 30 Tagen
// noch nicht bestätigt wurden, und Download-Links für die Checkliste nach einem Jahr.
import { getStore } from "@netlify/blobs";
import { KEEP_DAYS, DOWNLOAD_DAYS } from "../lib/startklar.mjs";

async function sweep(name, days) {
  const store = getStore(name);
  const limit = Date.now() - days * 86400000;
  const { blobs } = await store.list();
  let removed = 0;
  for (const { key } of blobs) {
    const meta = await store.getMetadata(key);
    if (!meta || Number(meta.metadata?.ts || 0) < limit) { await store.delete(key); removed++; }
  }
  return removed;
}

export default async () => {
  console.log(`cleanup: ${await sweep("ergebnisse", KEEP_DAYS)} Ergebnisse, ${await sweep("downloads", DOWNLOAD_DAYS)} Download-Links gelöscht`);
};

export const config = { schedule: "@daily" };
