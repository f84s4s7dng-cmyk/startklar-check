// Gemeinsame Bausteine für subscribe, confirm und cleanup.

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const ZIELE = { rente: "Altersvorsorge", frei: "Finanzielle Unabhängigkeit", extra: "Zweites Einkommen", vermoegen: "Vermögen aufbauen", offen: "Noch offen" };
export const VERDICT = {
  good: ["#15253A", "#F4C430", "Startklar"],
  warn: ["#D3DFD1", "#15253A", "Fast startklar"],
  todo: ["#9FB4A0", "#15253A", "Du hast ein Fundament"],
};
export const CTA = {
  good: "Deine Zahlen sind stark. Im kostenlosen Kennenlerngespräch schauen wir, welche Wohnung zu dir passt und wie deine Finanzierung aussehen kann.",
  warn: "Die letzten Stellschrauben drehen wir am schnellsten zusammen. Im kostenlosen Kennenlerngespräch schauen wir, welche zuerst dran ist, damit du bald loslegen kannst.",
  todo: "Dein Fundament steht. Im kostenlosen Kennenlerngespräch machen wir daraus einen Plan mit festen Etappen bis zu deiner ersten Wohnung.",
};
export const PROOF = "Ich habe selbst mit einer einzigen Wohnung angefangen, heute sind es mehr als 20. Schreib mir einfach eine Nachricht mit dem Wort „Startklar“.";
export const GOOD_STEP = { step: "Erste Wohnung durchrechnen", tip: "Deine Zahlen passen. Jetzt lohnt es sich, echte Wohnungen anzuschauen und durchzurechnen.", do: ["Such dir drei Wohnungsangebote in deiner Gegend heraus.", "Rechne bei jeder: Kaltmiete minus Bankrate minus nicht umlagefähiges Hausgeld.", "Bleibt ein Plus, meld dich bei mir, dann schauen wir sie zusammen an."] };
export const PILL = { ok: ["passt", "#DDEBE1", "#2F7A4F"], fast: ["fast", "#FBEFC2", "#6A5200"], fehlt: ["nächster Schritt", "#D3DFD1", "#15253A"] };

export async function brevo(path, body) {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`brevo ${path} ${res.status} ${await res.text()}`);
}

export function clean(r) {
  const verdict = VERDICT[r?.verdict] ? r.verdict : "warn";
  const areas = (Array.isArray(r?.areas) ? r.areas : []).slice(0, 5).map((a) => ({
    name: String(a?.name ?? "").slice(0, 60),
    st: PILL[a?.st] ? a.st : "fast",
    why: String(a?.why ?? "").slice(0, 300),
    step: String(a?.step ?? "").slice(0, 80),
    tip: String(a?.tip ?? "").slice(0, 700),
    do: (Array.isArray(a?.do) ? a.do : []).slice(0, 4).map((d) => String(d ?? "").slice(0, 220)),
  }));
  const ziel = (Array.isArray(r?.ziel) ? r.ziel : []).filter((z) => ZIELE[z]);
  return { verdict, verdictText: String(r?.verdictText ?? "").slice(0, 400), areas, ziel, zielText: String(r?.zielText ?? "").slice(0, 1200) };
}

export function resultMail(name, r) {
  const [bg, fg, label] = VERDICT[r.verdict];
  const kennenlern = process.env.KENNENLERN_LINK || "https://www.instagram.com/juttareichenbach/", ctaText = process.env.KENNENLERN_LINK ? "Kennenlerngespräch buchen" : "Schreib mir auf Instagram", expose = process.env.EXPOSE_CHECK_LINK;
  // Reihenfolge: erst "nächster Schritt", dann "fast"; innerhalb davon der Bereich mit dem größten Hebel zuerst
  const PRIO = { "Schulden und Schufa": 0, "Was übrig bleibt": 1, "Überblick und Zeit": 2, "Dein Polster": 3, "Gehalt und Job": 4 };
  const rank = (a) => (a.st === "fehlt" ? 0 : 10) + (PRIO[a.name] ?? 5);
  const todo = r.areas.filter((a) => a.st !== "ok").sort((a, b) => rank(a) - rank(b));
  const steps = todo.length ? todo : (r.verdict === "good" ? [GOOD_STEP] : []);
  const first = steps[0], rest = steps.slice(1);
  const doList = (d) => d && d.length ? `<ul style="list-style:none;padding:0;margin:6px 0 0">${d.map((x) => `<li style="font-size:14px;margin:4px 0;padding-left:24px;text-indent:-24px">&#9744;&nbsp;&nbsp;${esc(x)}</li>`).join("")}</ul>` : "";
  const btn = (href, text, yellow = true) => `<p style="margin:20px 0"><a href="${esc(href)}" style="background:${yellow ? "#F4C430" : "#15253A"};color:${yellow ? "#15253A" : "#FAF6EC"};padding:12px 18px;border-radius:12px;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;text-decoration:none;font-weight:bold">${text}</a></p>`;
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#FAF6EC;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;color:#15253A">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#15253A;border-radius:12px;margin-bottom:20px;padding:18px 24px"><img src="https://startklar.juttareichenbach.com/logo-mail.png" width="240" height="44" alt="Jutta Reichenbach" style="display:block;border:0;width:240px;height:44px"></div>
<h1 style="font-family:Outfit,Arial,Helvetica,sans-serif;font-weight:800;font-size:28px;line-height:1.1;margin:0 0 16px">Dein Startklar-Check</h1>
<p>Hallo${name ? ` ${esc(name)}` : ""},</p>
<p>schön, dass du den Check gemacht hast. Hier siehst du, wo du stehst und was als Nächstes dran ist.</p>
<div style="background:${bg};color:${fg};border-radius:12px;padding:16px 18px;margin:16px 0">
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${r.verdict === "good" ? "#D3DFD1" : fg}">Dein Ergebnis</div>
<div style="font-family:Outfit,Arial,Helvetica,sans-serif;font-size:30px;font-weight:800;margin-top:6px">${label}</div>
${r.verdictText ? `<p style="margin:8px 0 0;font-size:15px;line-height:1.5">${esc(r.verdictText)}</p>` : ""}
</div>
<table style="width:100%;border-collapse:collapse;font-size:14px">
${r.areas.map((a) => `<tr><td style="padding:8px 0;border-bottom:1px solid #E3DDCF"><b>${esc(a.name)}</b><br><span style="color:#56636F">${esc(a.why)}</span></td><td style="padding:8px 0 8px 10px;border-bottom:1px solid #E3DDCF;text-align:right;vertical-align:top"><span style="background:${PILL[a.st][1]};color:${PILL[a.st][2]};font-size:11px;font-weight:bold;text-transform:uppercase;padding:4px 6px;border-radius:999px;white-space:nowrap">${PILL[a.st][0]}</span></td></tr>`).join("")}
</table>
<h2 style="font-family:Outfit,Arial,Helvetica,sans-serif;font-weight:800;font-size:22px;margin:24px 0 8px">Dein Plan</h2>
${r.zielText ? `<p style="font-size:14px">${esc(r.zielText)}</p>` : ""}
${first ? `<div style="background:#D3DFD1;border-radius:12px;padding:16px 18px;margin:16px 0;border-left:5px solid #F4C430">
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase">Dein erster Schritt</div>
<div style="font-family:Outfit,Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;margin:6px 0 8px">${esc(first.step)}</div>
<p style="font-size:14px;margin:0 0 8px">${esc(first.tip)}</p>
${doList(first.do)}
<p style="font-size:14px;margin:8px 0 0"><b>Fang am besten noch diese Woche damit an.</b></p>
</div>` : ""}
${rest.length ? `<p style="font-size:14px;margin:18px 0 6px"><b>Danach geht es so weiter:</b></p><ol style="padding-left:20px;font-size:14px;margin:0">${rest.map((a) => `<li style="margin-bottom:14px"><b>${esc(a.step)}</b><br>${esc(a.tip)}${doList(a.do)}</li>`).join("")}</ol>` : ""}
${expose && r.verdict !== "todo" ? btn(expose, "Zum Exposé-Check", false) : ""}
${kennenlern ? `<h2 style="font-family:Outfit,Arial,Helvetica,sans-serif;font-weight:800;font-size:22px;margin:24px 0 8px">Lass uns draufschauen</h2><p style="font-size:14px">${CTA[r.verdict]} ${PROOF}</p>${btn(kennenlern, ctaText)}` : ""}
<p>Viele Grüße<br>Jutta</p>
<p style="font-size:11px;color:#56636F">Allgemeine Einschätzung, ersetzt keine Finanz- oder Steuerberatung. Jede Bank rechnet anders.</p>
</div></body></html>`;
}


// Kontakt in Brevo nachschlagen. null = gibt es nicht.
export async function getContact(email) {
  const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    headers: { "api-key": process.env.BREVO_API_KEY, accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`brevo contact ${res.status} ${await res.text()}`);
  return res.json();
}

export const inList = (contact) => !!contact && (contact.listIds || []).includes(Number(process.env.BREVO_LIST_ID));

export async function sendResult(email, name, r) {
  await brevo("/smtp/email", {
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: process.env.BREVO_SENDER_NAME || "Jutta Reichenbach" },
    to: [{ email }],
    subject: "Dein Ergebnis und dein Plan für die erste Wohnung",
    htmlContent: resultMail(name, r),
  });
}

// Zwischenspeicher für Ergebnisse, bis die Anmeldung bestätigt ist (max. 30 Tage)
export const KEEP_DAYS = 30;
