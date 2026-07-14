# KI-Governance

> Übersetzung des englischen Originals (`AI-GOVERNANCE.md`); die englische Fassung ist maßgeblich.

Die QCR Workbench kann optional KI-Modelle nutzen. Im Rahmen des NIST AI RMF,
der ISO/IEC 42001 und des EU AI Act ist diese Anwendung ein **Betreiber
(Deployer)** von General-Purpose-Modellen Dritter, kein Anbieter: Sie liefert
kein Modell aus, trainiert nichts, und der Benutzer wählt jedes verwendete
Modell selbst aus und hinterlegt die zugehörigen Zugangsdaten.

## Grundsätze (im Code durchgesetzt, nicht nur als Richtlinie)

1. **KI rechnet niemals selbst.** Jedes quantitative Ergebnis —
   FAIR-Zerlegung, erwarteter Verlust, Monte-Carlo-Statistiken,
   Maßnahmenökonomie — wird deterministisch in `src/lib/qcr/` berechnet.
   KI-Prompts *betten* die bereits berechneten Zahlen *ein*
   (`src/lib/qcr/aiFeatures.js`) und weisen das Modell an, keine Zahlen zu
   erfinden oder neu zu berechnen. Ein KI-Ausfall ändert nichts an der Analyse.
2. **Mensch in der Schleife für alles, was in das Modell eingeht.**
   KI-vorgeschlagene Scoping-Annahmen werden in der Benutzeroberfläche
   zwischengelagert und gelangen erst dann in das Szenario, wenn der Benutzer
   jede einzelne bestätigt. Das KI-Narrativ ist ein gekennzeichneter Entwurf,
   der dem Bericht beigefügt wird; es verändert niemals Schätzungen,
   Ergebnisse oder das Scoping des Szenarios.
3. **Transparenz und Herkunftsnachweis** (Muster nach Art. 50 EU AI Act). Jede
   KI-Ausgabe wird mit einem ausdrücklichen KI-Hinweisbanner dargestellt;
   Anbieter, Modell und Zeitstempel werden auf dem gespeicherten Narrativ
   vermerkt, in der Benutzeroberfläche angezeigt, in das Prüfprotokoll
   geschrieben und in den Offenlegungsblock des heruntergeladenen Berichts
   aufgenommen.
4. **Erkennung veralteter Inhalte.** Das Narrativ speichert einen Hash der
   Eingaben, aus denen es entworfen wurde; ändern sich danach das Modell oder
   die Annahmen, kennzeichnet die Benutzeroberfläche das Narrativ als
   veraltet, bis es neu entworfen wird (und Änderungen an den
   FAIR-Schätzungen löschen es vollständig).
5. **Datenschutz durch Architektur.** KI-Aufrufe gehen direkt vom Browser an
   den vom Benutzer gewählten Anbieter mit dem eigenen Schlüssel des Benutzers
   — kein Proxy, kein Mittelsmann, keine Protokollierungsschicht. Vollständig
   lokale Optionen (WebLLM über WebGPU, in Chrome integrierte KI, lokales
   Ollama) sind gleichwertig unterstützt und halten alle Inhalte auf dem
   Gerät. Siehe `DATA-PRIVACY.md`.
6. **Prüfbarkeit.** Jede KI-Generierung schreibt ein `AuditEvent` (Kategorie
   `ai`) mit dem Namen des Anbieters, sodass ein Prüfer rekonstruieren kann,
   was KI-gestützt war.

## Wofür KI verwendet wird

| Funktion | Gesendete Eingaben | Umgang mit der Ausgabe |
|---|---|---|
| Entwurf des Management-Narrativs | Scoping-Text des Szenarios + berechnete Zahlen | Mit Herkunftsangaben + Eingaben-Hash gespeichert; mit Offenlegung dargestellt; dem Berichtsexport unter einer ausdrücklichen Offenlegungsüberschrift angefügt |
| Annahmen-Vorschläge | Scoping-Text des Szenarios + bestehende Annahmen | Zwischengelagert; jeder Vorschlag erfordert die ausdrückliche Bestätigung des Benutzers |
| Maßnahmen-Vorschläge | Scoping-Text des Szenarios + berechnete Basiszahlen + Namen bestehender Maßnahmen | Zwischengelagert; das Annehmen eines Vorschlags öffnet ihn vorausgefüllt im Maßnahmenformular, damit der Analyst ihn prüft, anpasst und ausdrücklich speichert (im Prüfprotokoll erfasst); die Maßnahmenökonomie wird stets deterministisch aus dem Gespeicherten neu berechnet |

## Wofür KI **nicht** verwendet wird

- Schätzen oder Verändern der fünf FAIR-Faktoren
- Jegliche Berechnung, Simulation oder jeglicher Vergleich
- Alles Automatische oder Zeitgesteuerte — jeder KI-Aufruf ist ein Klick des
  Benutzers

## Restrisiken, die der Benutzer akzeptiert

- **Modellfehler**: Narrative können die berechneten Ergebnisse falsch
  darstellen; das Hinweisbanner weist darauf hin, und die Zahlen in den
  Berichtstabellen bleiben maßgeblich.
- **Offenlegung gegenüber dem Anbieter**: Die Nutzung eines Cloud-Anbieters
  sendet Szenariotext an diesen Anbieter im Rahmen der eigenen Vereinbarung
  des Benutzers mit ihm. Für regulierte Inhalte sollten die Optionen auf dem
  Gerät verwendet werden.
