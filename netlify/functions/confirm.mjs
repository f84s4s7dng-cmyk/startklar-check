// Wird von der Danke-Seite aufgerufen, nachdem jemand in der Bestätigungsmail
// auf „Ja, ich bin dabei“ geklickt hat. Schickt dann das zwischengespeicherte Ergebnis
// und löscht es danach. Bei der Checkliste gibt es stattdessen einen Download-Link (Seite und Mail). Verschickt wird nur, wenn die Adresse wirklich bestätigt in der Liste steht.
import { getStore } from "@netlify/blobs";
import { json, getContact, inList, sendResult, newDownload, sendChecklist } from "../lib/startklar.mjs";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const id = typeof body?.id === "string" ? body.id : "";
  if (!/^[a-f0-9]{64}$/.test(id)) return json({ error: "invalid" }, 400);

  const store = getStore("ergebnisse");
  const saved = await store.get(id, { type: "json" });
  if (!saved) return json({ ok: true, already: true }); // schon verschickt oder abgelaufen

  // Brevo trägt den Kontakt beim Klick ein. Zur Sicherheit kurz mehrfach nachsehen.
  let ok = false;
  for (let i = 0; i < 4 && !ok; i++) {
    try { ok = inList(await getContact(saved.email)); } catch (e) { console.error(e); }
    if (!ok) await wait(1500);
  }
  if (!ok) return json({ error: "not_confirmed" }, 409);

  await store.delete(id); // vorher löschen, damit ein zweiter Klick nichts doppelt schickt
  if (saved.kind === "checkliste") {
    const url = await newDownload(getStore("downloads"), saved.email);
    try { await sendChecklist(saved.email, saved.name, url); }
    catch (e) { console.error(e); } // Mail hat nicht geklappt: der Download auf der Danke-Seite geht trotzdem
    return json({ ok: true, download: url });
  }
  try { await sendResult(saved.email, saved.name, saved.r); }
  catch (e) { console.error(e); await store.setJSON(id, saved, { metadata: { ts: Date.now() } }); return json({ error: "send_failed" }, 502); }
  return json({ ok: true });
};

export const config = { path: "/api/confirm" };
