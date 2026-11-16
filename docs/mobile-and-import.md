# Dividenden-PDF und mobile App

## Dividenden importieren

Im Browser unter **Dividenden → Dividende erfassen** eine PDF auswählen. Der Import unterstützt das flatex-Abrechnungsformat des Beispielbelegs, sowohl als Text-PDF als auch als Scan. PDF.js und die deutsche Tesseract-Texterkennung laufen lokal; der Beleg wird nicht hochgeladen oder dauerhaft gespeichert. Maximal 20 MB und fünf Seiten pro Abrechnung.

Die Vorschau befüllt Ex-Tag, Valuta als Buchungsdatum, Stückzahl, Originalwährung, Ausschüttung je Stück, Wechselkurs, Brutto in EUR und den EUR-Endbetrag als Netto. Bei Fremdwährung wird die Bruttodividende durch den ausgewiesenen Devisenkurs geteilt und auf Cent gerundet; die steuerliche Bemessungsgrundlage ist kein Bruttobetrag. Alle Werte vor dem Speichern prüfen. Nicht erkannte Felder ergänzen. Depot und Wertpapier werden ausschließlich über eindeutige Depotnummer bzw. ISIN/WKN zugeordnet. Bei anonymisierten Kennungen manuell auswählen.

**Speichern** legt über die vorhandene Dividenden-API genau den angezeigten Eintrag an. Das erneute Importieren derselben Abrechnung wird nicht automatisch als Duplikat erkannt. Andere Bankformate können manuelle Korrekturen benötigen.

Die deutsche Sprachdatei liegt im Repository. `npm run dev` und `npm run build` kopieren die passenden OCR-Laufzeitdateien aus den installierten npm-Abhängigkeiten. Die Herkunft steht in `public/ocr/README.md`.

## PWA installieren

Die Produktionsversion über **HTTPS** öffnen. Unter Android im Browser „App installieren“ bzw. „Zum Startbildschirm hinzufügen“ wählen. Unter iOS in Safari über **Teilen → Zum Home-Bildschirm** hinzufügen. Für lokale Tests ist `localhost` zulässig; eine unverschlüsselte LAN-IP reicht auf dem Handy nicht aus.

Die installierte App erkennt den Standalone-Modus und zeigt reine Leseansichten: Übersicht, Positionen inklusive Details, Buchungen, Dividenden und Entwicklung. Besitzer, Depot, Bewertung und Zeitraum bleiben auswählbar. Erstellen, Bearbeiten, Löschen, Import, Export und Verwaltung bleiben der Browser-Version vorbehalten. Dies ist eine Oberflächenfunktion, keine zusätzliche API-Zugriffskontrolle.

Die mobile Oberfläche verwendet eine untere Navigation mit fünf Zielen, berücksichtigt die Safe Areas des Geräts und stellt breite Tabellen als beschriftete Einträge dar. Die Desktopansichten bleiben tabellarisch.

Der Service Worker speichert die App-Oberfläche und aktualisiert sie bei neuen Builds. Finanzdaten werden nicht dauerhaft offline gespeichert; aktuelle Statistiken benötigen die API-Verbindung. Nach einem Verbindungsabbruch bleiben bereits geladene Werte gegebenenfalls bis zum Schließen der App sichtbar und werden mit einem Offline-Hinweis versehen.

## Prüfung

`npm run test:import` prüft Tabellen- und PDF-Textparser. `npm run build` prüft TypeScript und erzeugt Manifest, Icons und Service Worker.

Zusätzlich wurde der Originalbeleg im lokalen Chrome über PDF.js und OCR bis zum Speichern in eine isolierte Demo-Datenbank geprüft. Alle sieben Ansichten wurden mit 320, 390, 768 und 1440 Pixeln Breite auf Seitenüberlauf geprüft; Standalone-Modus ohne Bearbeitungsaktionen und aktiver Service Worker wurden kontrolliert. Eine Installation auf einem physischen iOS-/Android-Gerät wurde nicht durchgeführt.
