# Portfolio – React

React 19.3, Vite 8, Tailwind 4 und TypeScript 6. Die App verwendet ausschließlich die ASP.NET-API aus dem benachbarten `portfolio-backend`-Projekt.

```powershell
npm ci
npm run dev
```

Frontend: `http://localhost:5173`, API-Proxy: `http://localhost:5071`. Im Backend-Repository `dotnet run --project portfolio-backend --launch-profile http` starten. Für isolierte Beispieldaten `-- --Demo=true` ergänzen. Gegen die bestehende Datenbank `DB_CONNECTION` bzw. `ConnectionStrings__Portfolio` konfigurieren.

```powershell
npm run build
npm run preview
```

Die Produktionsdateien liegen unter `dist`. Der enthaltene Nginx-Container liefert sie aus und leitet `/api` an `portfolio-backend:8080` weiter. Die gemeinsame `compose.yml` liegt im Backend-Repository.

Die Benutzerwahl folgt den Besitzern der bestehenden Depots und benötigt kein Passwort. Ein neuer Besitzer entsteht durch Anlegen eines Depots mit neuem Besitzernamen. Käufe, Verkäufe, Dividenden und Auswertungen sind je Besitzer getrennt; Wertpapier-Stammdaten und Kursquellen sind gemeinsam.

Beim Anlegen eines Wertpapiers und im Kursquellenformular sucht „Auf boerse.de suchen“ ab zwei Zeichen nach Name, WKN oder ISIN. Ein Klick übernimmt die verfügbaren Stammdaten und Quellenlinks in bearbeitbare Felder. Beim neuen Wertpapier kann die Kursquelle per Checkbox direkt mitgespeichert werden. Im Kursquellenformular wird der Treffer einem bereits angelegten Wertpapier anhand der ISIN (ersatzweise WKN) zugeordnet. Gespeichert wird erst über „Speichern“. Suche und Kursabruf verwenden denselben Proxy-Pool im Backend (`WEBSHARE_AUTHTOKEN` oder `Scraper__ProxyUrls__0` usw.). Bei Anbieterfehlern bleibt die manuelle Eingabe möglich.

Unter „Transaktion erfassen → Tabelle importieren“ lassen sich bis zu 1000 Käufe für ein Depot und Wertpapier einfügen. Spaltenfolge: Datum (TT.MM.JJJJ), Stück/nominal, Einstandskurs, Gesamtwert, optional Vorabpauschale. Unterstützt werden Markdown-Tabellen, Tabulatoren und Semikolons mit deutschen Zahlen. Die Vorschau zeigt die erkannten Zeilen; Fehler verhindern den gesamten Import. Der Gesamtwert bestimmt den gespeicherten Kurs (Gesamtwert / Stückzahl). Ursprünglicher Kurs, Gesamtwert und Vorabpauschale bleiben in der Bemerkung erhalten; die Vorabpauschale fließt nicht in die Steuerschätzung ein. Buchungsdatum entspricht dem Datum, Spesen und Steuern sind null. Vorhandene Buchungen werden nicht auf Duplikate geprüft. Parser-Prüfungen: `npm run test:import`.

Die Oberfläche orientiert sich an `design-rules.md` und den dort referenzierten HIG-Grundlagen: Hierarchie, progressive Offenlegung, responsive Layouts, Tastaturbedienung und beschriftete Eingaben. Dashboard-Kacheln führen zu Positionen, Entwicklung und Dividenden. Nettowerte und Ausschüttungsprognosen sind ausdrücklich Schätzungen.

TypeScript bleibt vorerst auf 6.x, da der aktuelle TypeScript-ESLint-Stack 7.x noch nicht unterstützt. Die ursprünglichen, ungenutzten Tabellenkomponenten bleiben auf dem aktuellen kompatiblen TanStack-Table-8-Zweig. Lokale Änderungen an `src/lib/utils.ts` und `src/types/stock.tsx` wurden beibehalten.

Backend-Berechnung und API werden mit isolierten Integrationstests geprüft. Frontend: TypeScript- und Produktionsbuild, HTTP-Prüfung. Eine visuelle Browserprüfung war in der Arbeitsumgebung nicht möglich. `npm audit --omit=dev` meldete keine betroffenen Laufzeitpakete; der ESLint-Werkzeugbaum enthält noch eine moderate transitive minimatch-Meldung.

Dokumentation zu PDF-Import, PWA-Installation und mobilen Ansichten: [Mobile App und Import](docs/mobile-and-import.md).
