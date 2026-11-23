// Startklar-Check: trägt die E-Mail-Adresse mit Double-Opt-in in die Brevo-Liste ein
// und schickt das Ergebnis als E-Mail.
//
// Umgebungsvariablen (in Netlify eintragen):
//   BREVO_API_KEY          API-Schlüssel aus Brevo
//   BREVO_LIST_ID          Nummer der Liste "Startklar-Check"
//   BREVO_DOI_TEMPLATE_ID  Nummer der Vorlage für die Bestätigungs-Mail (Double-Opt-in)
//   BREVO_SENDER_EMAIL     bestätigte Absender-Adresse, z. B. hallo@juttareichenbach.com
//   BREVO_SENDER_NAME      z. B. Jutta Reichenbach
//   SITE_URL               Adresse der App, z. B. https://startklar.juttareichenbach.com
//   KENNENLERN_LINK        optional, Link zum Kennenlerngespräch für die Ergebnis-Mail
//   EXPOSE_CHECK_LINK      optional, Link zum Exposé-Check für die Ergebnis-Mail
//
// Optionale Kontakt-Attribute in Brevo (Typ Text): ZIELE, STARTKLAR.
// Fehlen sie, wird nur der Vorname gespeichert.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ZIELE = { rente: "Altersvorsorge", frei: "Finanzielle Unabhängigkeit", extra: "Zweites Einkommen", vermoegen: "Vermögen aufbauen", offen: "Noch offen" };
const VERDICT = {
  good: ["#15253A", "#F4C430", "Startklar"],
  warn: ["#D3DFD1", "#15253A", "Fast startklar"],
  todo: ["#9FB4A0", "#15253A", "Erst das Fundament"],
};
const PILL = { ok: ["passt", "#DDEBE1", "#2F7A4F"], fast: ["fast", "#FBEFC2", "#6A5200"], fehlt: ["fehlt noch", "#D3DFD1", "#15253A"] };

async function brevo(path, body) {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`brevo ${path} ${res.status} ${await res.text()}`);
}

function clean(r) {
  const verdict = VERDICT[r?.verdict] ? r.verdict : "warn";
  const areas = (Array.isArray(r?.areas) ? r.areas : []).slice(0, 5).map((a) => ({
    name: String(a?.name ?? "").slice(0, 60),
    st: PILL[a?.st] ? a.st : "fast",
    why: String(a?.why ?? "").slice(0, 300),
    step: String(a?.step ?? "").slice(0, 80),
    tip: String(a?.tip ?? "").slice(0, 600),
  }));
  const ziel = (Array.isArray(r?.ziel) ? r.ziel : []).filter((z) => ZIELE[z]);
  return { verdict, areas, ziel, zielText: String(r?.zielText ?? "").slice(0, 1200) };
}

function resultMail(name, r) {
  const [bg, fg, label] = VERDICT[r.verdict];
  const kennenlern = process.env.KENNENLERN_LINK || "https://www.instagram.com/juttareichenbach/", ctaText = process.env.KENNENLERN_LINK ? "Kennenlerngespräch buchen" : "Schreib mir auf Instagram", expose = process.env.EXPOSE_CHECK_LINK;
  const todo = r.areas.filter((a) => a.st !== "ok").sort((a, b) => (a.st === "fehlt" ? -1 : 0) - (b.st === "fehlt" ? -1 : 0));
  const btn = (href, text, yellow = true) => `<p style="margin:20px 0"><a href="${esc(href)}" style="background:${yellow ? "#F4C430" : "#15253A"};color:${yellow ? "#15253A" : "#FAF6EC"};padding:12px 18px;border-radius:12px;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;text-decoration:none;font-weight:bold">${text}</a></p>`;
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#FAF6EC;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;color:#15253A">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#15253A;border-radius:12px;margin-bottom:20px;padding:18px 24px"><img src="https://startklar.juttareichenbach.com/logo-mail.png" width="240" height="44" alt="Jutta Reichenbach" style="display:block;border:0;width:240px;height:44px"></div>
<h1 style="font-family:Outfit,Arial,Helvetica,sans-serif;font-weight:800;font-size:28px;line-height:1.1;margin:0 0 16px">Dein Startklar-Check</h1>
<p>Hallo${name ? ` ${esc(name)}` : ""},</p>
<p>hier ist dein Ergebnis zum Nachlesen.</p>
<div style="background:${bg};color:${fg};border-radius:12px;padding:16px 18px;margin:16px 0">
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${r.verdict === "good" ? "#D3DFD1" : fg}">Dein Ergebnis</div>
<div style="font-family:Outfit,Arial,Helvetica,sans-serif;font-size:30px;font-weight:800;margin-top:6px">${label}</div>
</div>
<table style="width:100%;border-collapse:collapse;font-size:14px">
${r.areas.map((a) => `<tr><td style="padding:8px 0;border-bottom:1px solid #E3DDCF"><b>${esc(a.name)}</b><br><span style="color:#56636F">${esc(a.why)}</span></td><td style="padding:8px 0 8px 10px;border-bottom:1px solid #E3DDCF;text-align:right;vertical-align:top"><span style="background:${PILL[a.st][1]};color:${PILL[a.st][2]};font-size:11px;font-weight:bold;text-transform:uppercase;padding:4px 6px;border-radius:999px;white-space:nowrap">${PILL[a.st][0]}</span></td></tr>`).join("")}
</table>
<h2 style="font-family:Outfit,Arial,Helvetica,sans-serif;font-weight:800;font-size:22px;margin:24px 0 8px">Dein Plan</h2>
${r.zielText ? `<p style="font-size:14px">${esc(r.zielText)}</p>` : ""}
${todo.length ? `<ol style="padding-left:20px;font-size:14px">${todo.map((a) => `<li style="margin-bottom:10px"><b>${esc(a.step)}</b><br>${esc(a.tip)}</li>`).join("")}</ol>` : `<p style="font-size:14px">Alles passt. Jetzt lohnt es sich, echte Wohnungen durchzurechnen.</p>`}
${expose && r.verdict !== "todo" ? btn(expose, "Zum Exposé-Check", false) : ""}
${kennenlern ? `<p style="font-size:14px">Du willst wissen, ob und wie du finanzierbar bist? Im kostenlosen Kennenlerngespräch schauen wir drauf, bevor du irgendetwas zahlst. Schreib mir einfach eine Nachricht mit dem Wort „Startklar“.</p>${btn(kennenlern, ctaText)}` : ""}
<p>Viele Grüße<br>Jutta</p>
<p style="font-size:11px;color:#56636F">Allgemeine Einschätzung, ersetzt keine Finanz- oder Steuerberatung. Jede Bank rechnet anders.</p>
</div></body></html>`;
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";
  if (!/^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email) || body?.consent !== true) return json({ error: "invalid" }, 400);
  if (!process.env.BREVO_API_KEY) return json({ error: "not_configured" }, 500);

  const r = clean(body?.result);
  const site = (process.env.SITE_URL || "").replace(/\/$/, "");
  const out = { newsletter: false, mail: false };

  const base = name ? { FIRSTNAME: name } : {};
  const extra = { ...base, ZIELE: r.ziel.map((z) => ZIELE[z]).join(", "), STARTKLAR: VERDICT[r.verdict][2] };
  const doi = (attributes) => brevo("/contacts/doubleOptinConfirmation", {
    email, attributes,
    includeListIds: [Number(process.env.BREVO_LIST_ID)],
    templateId: Number(process.env.BREVO_DOI_TEMPLATE_ID),
    redirectionUrl: `${site}/danke.html`,
  });
  try { await doi(extra); out.newsletter = true; }
  catch (e) {
    console.error(e); // z. B. wenn die Attribute ZIELE/STARTKLAR in Brevo noch nicht angelegt sind
    try { await doi(base); out.newsletter = true; } catch (e2) { console.error(e2); }
  }

  if (process.env.BREVO_SENDER_EMAIL) {
    try {
      await brevo("/smtp/email", {
        sender: { email: process.env.BREVO_SENDER_EMAIL, name: process.env.BREVO_SENDER_NAME || "Jutta Reichenbach" },
        to: [{ email }],
        subject: "Dein Startklar-Check",
        htmlContent: resultMail(name, r),
      });
      out.mail = true;
    } catch (e) { console.error(e); }
  }

  if (!out.newsletter && !out.mail) return json({ error: "send_failed" }, 502);
  return json({ ok: true, ...out });
};

export const config = { path: "/api/subscribe" };
