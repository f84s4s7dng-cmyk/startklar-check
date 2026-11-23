// Läuft einmal am Tag: löscht zwischengespeicherte Ergebnisse, die nach 30 Tagen
// noch nicht bestätigt wurden.
import { getStore } from "@netlify/blobs";
import { KEEP_DAYS } from "../lib/startklar.mjs";

export default async () => {
  const store = getStore("ergebnisse");
  const limit = Date.now() - KEEP_DAYS * 86400000;
  const { blobs } = await store.list();
  let removed = 0;
  for (const { key } of blobs) {
    const meta = await store.getMetadata(key);
    if (!meta || Number(meta.metadata?.ts || 0) < limit) { await store.delete(key); removed++; }
  }
  console.log(`cleanup: ${removed} gelöscht`);
};

export const config = { schedule: "@daily" };
