# Story-Vorlagen Startklar-Check

10 Instagram-Stories (1080 × 1920) im CI der App: Farben, Schriften (Outfit, Plus Jakarta Sans) und Logo wie in `public/`.

| Nr. | Datei | Link-Ziel | Foto |
| --- | --- | --- | --- |
| 01 | Die große Frage | Check | – |
| 02 | Drei Fragen | Check | – |
| 03 | Lieber auf Papier? (Checkliste als Bild) | Checkliste | – |
| 04 | Deine Zahlen bleiben bei dir | Checkliste | – |
| 05 | Mythos Eigenkapital | Check | – |
| 06 | Welche Stufe bist du? | Check | – |
| 07 | Mütze im Winter | Check | `fotos/muetze-winter.jpg` |
| 08 | Garderobe | Check | `fotos/garderobe.jpg` |
| 09 | Küche | Checkliste | `fotos/kueche.jpg` |
| 10 | Im Auto + Checkliste | Checkliste | `fotos/auto.jpg` |

## Links

- Check: `https://startklar.juttareichenbach.com`
- Checkliste: `https://startklar.juttareichenbach.com/#papier` (springt direkt zu „Lieber auf Papier?“)

In Instagram den **Link-Sticker** auf die Fläche unter „↓ …“ setzen. In `png-markiert/` ist diese Fläche rosa eingezeichnet. Die kleine Adresse darunter ist für WhatsApp-Status gedacht, wo es keinen Sticker gibt. Ändern lässt sie sich oben im Skript von `stories.html` (`LINKS`).

## Bauen

1. Fotos mit genau den Namen oben nach `stories/fotos/` legen (JPG, möglichst Hochformat). Fehlt eins, erscheint ein Platzhalter.
2. `node stories/build.mjs`
3. Fertige Bilder: `stories/png/`

Das Repository ist öffentlich. Fotos und fertige Bilder sind deshalb in `.gitignore` und werden nicht hochgeladen.
