# Startklar-Check

Kostenloses Tool (Freebie) von Jutta Reichenbach: „Bist du startklar für deine erste Immobilie?“ Neun Fragen mit Schiebereglern und Antworten zum Antippen. Nach Eingabe der E-Mail-Adresse (Double-Opt-in über Brevo) sieht man das Ergebnis in fünf Bereichen und einen Plan mit den nächsten Schritten. Den Plan gibt es zusätzlich per Mail. Wer startklar oder fast startklar ist, wird zum Exposé-Check weitergeleitet.

Die Angaben werden im Browser ausgewertet. Gespeichert wird nur, was in Brevo landet: Vorname, E-Mail, gewählte Ziele, Ergebnis.

## Aufbau

| Datei | Wofür |
| --- | --- |
| `public/index.html` | Die App. Oben im Skript stehen unter `CONFIG` die Links (Kennenlerngespräch, Impressum, Datenschutz, Exposé-Check), darunter unter `T` die internen Grenzwerte. |
| `public/danke.html` | Seite nach dem Bestätigen der Anmeldung |
| `public/og.png`, `public/icon.png` | Vorschaubild für geteilte Links und App-Symbol |
| `netlify/functions/subscribe.mjs` | Trägt die Adresse mit Double-Opt-in in Brevo ein und schickt die Ergebnis-Mail |
| `netlify.toml` | Einstellungen für Netlify |

## Einstellungen in Netlify (Site configuration → Environment variables)

| Variable | Inhalt |
| --- | --- |
| `BREVO_API_KEY` | API-Schlüssel aus Brevo (derselbe wie beim Exposé-Check geht) |
| `BREVO_LIST_ID` | Nummer der Liste „Startklar-Check“ in Brevo |
| `BREVO_DOI_TEMPLATE_ID` | Nummer der Vorlage für die Bestätigungs-Mail |
| `BREVO_SENDER_EMAIL` | In Brevo bestätigte Absender-Adresse, z. B. `hallo@juttareichenbach.com` |
| `BREVO_SENDER_NAME` | `Jutta Reichenbach` |
| `SITE_URL` | Adresse der App, z. B. `https://startklar.juttareichenbach.com` |
| `KENNENLERN_LINK` | optional, Link zum Kennenlerngespräch in der Ergebnis-Mail |
| `EXPOSE_CHECK_LINK` | optional, Link zum Exposé-Check in der Ergebnis-Mail |

In Brevo unter Kontakte → Einstellungen → Kontakt-Attribute zwei Attribute vom Typ Text anlegen: `ZIELE` und `STARTKLAR`. Dann lässt sich die Liste später nach Zielen und Ergebnis filtern. Ohne die Attribute läuft die App trotzdem, gespeichert wird dann nur der Vorname.

Schlüssel gehören nur in diese Netlify-Einstellungen, nie in den Code.

## Vorschau-Modus

`CONFIG.preview: true` in `public/index.html` zeigt das Ergebnis ohne Versand an (zum Testen ohne Brevo).
