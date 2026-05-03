# Mariengymnasium Papenburg – Neue Homepage

Modernisierte HTML-Version der Schulhomepage mit beibehaltener Corporate Identity (Marineblau + Gold, klare Typografie, Cormorant Garamond + Inter).

## 📂 Dateien

- `index.html` – Die komplette Homepage (eine einzige Datei mit HTML, CSS und JavaScript)
- `ANLEITUNG.md` – Diese Datei

Es gibt **keine externen Abhängigkeiten** außer einem Lucide-Icon-Set und Google Fonts (werden automatisch geladen). Die Seite läuft auch lokal per Doppelklick.

---

## 📰 Wie füge ich einen NEUEN SCHULNEWS-BEITRAG hinzu?

Genau das war ja dein zentraler Wunsch. Es ist bewusst so gestaltet, dass man dafür **keine Programmierkenntnisse** braucht – nur ein Texteditor (z. B. Notepad, VS Code, oder direkt im Webspace).

### Schritt-für-Schritt

1. Öffne die Datei `index.html` in einem Texteditor
2. Suche (Strg+F) nach dem Wort **`newsData`** – du findest es ungefähr in der Mitte im `<script>`-Bereich
3. Du siehst dann ein Array (Liste) mit bestehenden Beiträgen, die so aussehen:

```javascript
const newsData = [
  {
    id: 1,
    date: "23.02.2026",
    dateISO: "2026-02-23",
    category: "schulleben",
    categoryLabel: "Schulleben",
    title: "Rosenmontag am Mariengymnasium...",
    excerpt: "Kurzbeschreibung...",
    content: `<p>Vollständiger Text...</p>`,
    author: "Schulleitung",
    image: null,
    featured: true
  },
  // ... weitere Beiträge
];
```

4. **Kopiere einen Block** (alles zwischen `{` und `},` inklusive Komma)
5. **Füge ihn oben in die Liste ein** (über die anderen Beiträge), damit der neuste Beitrag zuerst erscheint
6. Trage neue Werte ein:

| Feld | Was eintragen | Beispiel |
|------|--------------|----------|
| `id` | Eindeutige Nummer (einfach hochzählen) | `11` |
| `date` | Datum für die Anzeige | `"15.05.2026"` |
| `dateISO` | Datum für die Sortierung (Format: JJJJ-MM-TT) | `"2026-05-15"` |
| `category` | Eine von: `schulleben`, `wettbewerbe`, `kultur`, `sport`, `austausch` | `"sport"` |
| `categoryLabel` | Anzeige-Name | `"Sport"` |
| `title` | Überschrift | `"Sieg beim Bundesentscheid"` |
| `excerpt` | Kurzbeschreibung (1-3 Sätze) | `"Unser Team gewann..."` |
| `content` | Vollständiger Artikel mit HTML-Tags | siehe unten |
| `author` | Verfasser*in (optional) | `"Frau Schmidt"` |
| `image` | Bild-URL oder `null` | `null` |
| `featured` | `true` für den großen Hauptbeitrag (nur EINER), sonst `false` | `false` |

### HTML-Tags im `content`-Feld

Du kannst diese einfachen HTML-Befehle nutzen:

- `<p>Absatz</p>` – ein Absatz
- `<strong>fett</strong>` – fetter Text
- `<em>kursiv</em>` – kursiver Text
- `<br>` – Zeilenumbruch

Beispiel:

```javascript
content: `<p>Am Montag fand das <strong>große Sportfest</strong> statt.</p>
<p>Über 200 Schüler*innen nahmen daran teil und zeigten <em>tolle Leistungen</em>.</p>`,
```

### ⚠️ Wichtig

- Nach jedem Beitrag (`}`) muss ein **Komma** stehen – außer beim allerletzten
- Anführungszeichen innerhalb der Texte mit `\"` schreiben oder typografische („…") verwenden
- Datei speichern, Browser neu laden – fertig

---

## 🎨 Bilder einfügen

Lege Bilder im selben Verzeichnis ab (z. B. in `images/rosenmontag.jpg`) und ändere das `image`-Feld:

```javascript
image: "images/rosenmontag.jpg",
```

Statt `image: null` (was den farbigen Platzhalter zeigt).

**Empfohlen:** Bildgröße 800x600 Pixel, maximal 200 KB (JPG/WEBP), damit die Seite schnell lädt.

---

## 🎯 Filter & Kategorien

Es gibt 5 vordefinierte Kategorien, jede mit eigener Farbe:

- **Schulleben** (blau) — allgemeines Schulgeschehen
- **Wettbewerbe** (gold) — Schach, Mathe, Jugend forscht etc.
- **Kultur** (violett) — Musik, Konzerte, Theater
- **Sport** (grün) — Sportveranstaltungen, Turniere
- **Austausch** (orange) — Mottola, Albaida, Cork

Möchtest du eine Kategorie ergänzen oder anders benennen, sind Anpassungen an drei Stellen nötig (Filter-Buttons im HTML + `categoryColor`-Funktion + Icon-Map). Sag Bescheid, dann mache ich das gerne.

---

## 🌐 Hochladen aufs Webspace

1. Datei `index.html` per FTP/SFTP ins Hauptverzeichnis hochladen
2. Eventuelle Bilder in einen Unterordner `images/` legen
3. Fertig – die Seite ist online

---

## 🛠️ Technische Hinweise

- **Mobile-optimiert** (responsive bis 320px Breite)
- **Suchmaschinenoptimiert** (Meta-Tags vorhanden)
- **Barrierefreiheit** – semantisches HTML, ARIA-Labels, Tastaturnavigation
- **Performance** – keine schweren Frameworks, alles in einer Datei
- **Browserunterstützung** – Chrome, Firefox, Safari, Edge (alle aktuellen Versionen)

---

## 💡 Empfehlung für die Zukunft

Wenn die News-Sammlung **stark wächst** (z. B. >50 Beiträge), empfehle ich den Wechsel zu:

- einer separaten `news.json`-Datei (gleiche Struktur, aber in einer Extra-Datei)
- oder einem Headless CMS wie Strapi/Decap, sodass Lehrkräfte über eine Web-Oberfläche schreiben können

Bei Interesse setze ich das gerne um.

---

**Viel Erfolg mit der neuen Homepage!**
