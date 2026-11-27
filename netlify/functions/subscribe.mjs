// Startklar-Check: trägt die E-Mail-Adresse mit Double-Opt-in in die Brevo-Liste ein.
// Das Ergebnis wird zwischengespeichert und erst nach dem Klick auf den Bestätigungslink
// verschickt (siehe confirm.mjs). Ist die Adresse schon bestätigt in der Liste, geht es sofort raus.
//
// Umgebungsvariablen (in Netlify eintragen):
//   BREVO_API_KEY          API-Schlüssel aus Brevo
//   BREVO_LIST_ID          Nummer der Liste "Startklar-Check"
//   BREVO_DOI_TEMPLATE_ID  Nummer der Vorlage für die Bestätigungs-Mail (Double-Opt-in)
//   BREVO_DOI_TEMPLATE_ID_CHECKLISTE  optional, eigene Bestätigungs-Mail für die Checkliste zum Ausdrucken
//   BREVO_SENDER_EMAIL     bestätigte Absender-Adresse, z. B. hallo@juttareichenbach.com
//   BREVO_SENDER_NAME      z. B. Jutta Reichenbach
//   SITE_URL               Adresse der App, z. B. https://startklar.juttareichenbach.com
//   KENNENLERN_LINK        optional, Link zum Kennenlerngespräch für die Ergebnis-Mail
//   EXPOSE_CHECK_LINK      optional, Link zum Exposé-Check für die Ergebnis-Mail
//
// Optionale Kontakt-Attribute in Brevo (Typ Text): ZIELE, STARTKLAR, QUELLE.
// kind: "checkliste" = Anmeldung für die PDF zum Ausdrucken statt des Online-Ergebnisses.
// Fehlen sie, wird nur der Vorname gespeichert.

import { getStore } from "@netlify/blobs";
import { json, ZIELE, VERDICT, brevo, clean, getContact, inList, sendResult, newDownload, sendChecklist } from "../lib/startklar.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";
  if (!/^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email) || body?.consent !== true) return json({ error: "invalid" }, 400);
  if (!process.env.BREVO_API_KEY) return json({ error: "not_configured" }, 500);

  const pdf = body?.kind === "checkliste";
  const r = pdf ? null : clean(body?.result);
  const site = (process.env.SITE_URL || "").replace(/\/$/, "");
  const base = name ? { FIRSTNAME: name } : {};
  const extra = pdf ? { ...base, QUELLE: "Checkliste" }
    : { ...base, ZIELE: r.ziel.map((z) => ZIELE[z]).join(", "), STARTKLAR: VERDICT[r.verdict][2], QUELLE: "Online-Check" };

  // Schon bestätigt in der Liste? Dann gibt es keine neue Bestätigungsmail: Ergebnis sofort schicken.
  let contact = null;
  try { contact = await getContact(email); } catch (e) { console.error(e); }
  if (inList(contact)) {
    try {
      if (pdf) await sendChecklist(email, name, await newDownload(getStore("downloads"), email));
      else await sendResult(email, name, r);
      return json({ ok: true, confirmed: true });
    }
    catch (e) { console.error(e); return json({ error: "send_failed" }, 502); }
  }

  // Ergebnis zwischenspeichern; der Schlüssel steckt im Bestätigungslink.
  const id = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const store = getStore("ergebnisse");
  await store.setJSON(id, pdf ? { email, name, kind: "checkliste" } : { email, name, r }, { metadata: { ts: Date.now() } });

  const doi = (attributes) => brevo("/contacts/doubleOptinConfirmation", {
    email, attributes,
    includeListIds: [Number(process.env.BREVO_LIST_ID)],
    templateId: Number((pdf && process.env.BREVO_DOI_TEMPLATE_ID_CHECKLISTE) || process.env.BREVO_DOI_TEMPLATE_ID),
    redirectionUrl: `${site}/danke.html?e=${id}${pdf ? "&c=1" : ""}`,
  });
  try { await doi(extra); }
  catch (e) {
    console.error(e); // z. B. wenn die Attribute ZIELE/STARTKLAR/QUELLE in Brevo noch nicht angelegt sind
    try { await doi(base); }
    catch (e2) { console.error(e2); await store.delete(id).catch(() => {}); return json({ error: "send_failed" }, 502); }
  }
  return json({ ok: true, confirmed: false });
};

export const config = { path: "/api/subscribe" };
