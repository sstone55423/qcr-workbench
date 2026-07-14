# Datenschutz

> Übersetzung des englischen Originals (`DATA-PRIVACY.md`); die englische Fassung ist maßgeblich.

Die QCR Workbench ist so konzipiert, dass **Ihre Risikodaten Ihr Gerät nicht
verlassen können, ohne dass Sie selbst eine Aktion ausführen**. Dieses Dokument
ist die vollständige Bestandsaufnahme, wo Daten liegen und über welche Wege sie
übertragen werden können.

## Wo Daten liegen

| Daten | Speicherort | Schutz |
|---|---|---|
| Projekte, Szenarien, Schätzungen, Maßnahmen, Prüfprotokoll | IndexedDB des Browsers | AES-GCM-256, Schlüssel aus Ihrer Passphrase abgeleitet (PBKDF2-SHA-256, 250.000 Iterationen, zufälliges Salt) |
| App-Einstellungen inkl. KI-API-Schlüssel | Derselbe verschlüsselte Speicher (`AppSettings`-Datensatz) | Dieselbe Verschlüsselung; niemals in localStorage oder im Klartext |
| Speicher-Registry (Arbeitsbereichsnamen, optionale Hinweise) | localStorage | Bewusst nicht geheim; enthält **keine** Passphrasen und **keine** Risikodaten |
| Theme, sprachunabhängige UI-Einstellungen, Minuten bis zur automatischen Sperre | localStorage | Nicht geheim; wird benötigt, bevor der Tresor entsperrt ist |
| Optionale E-Mail für den Sperrbildschirm | localStorage | Wird **nur** geschrieben, wenn Sie „auf dem Sperrbildschirm anzeigen“ aktivieren; wird beim Deaktivieren gelöscht |

Der abgeleitete Verschlüsselungsschlüssel existiert nur im Arbeitsspeicher,
solange der Tresor entsperrt ist. Das Sperren des Tresors (manuell oder über
die automatische Sperre) verwirft ihn. **Eine vergessene Passphrase ist nicht
wiederherstellbar** — es gibt kein Zurücksetzen, keine Wiederherstellungs-E-Mail
und keinen Anbieter, der helfen könnte. Exportieren Sie Sicherungen.

## Jeder Netzwerkpfad, vollständig aufgezählt

Die App stellt von sich aus **null** Anfragen. Alle folgenden Vorgänge werden
vom Benutzer ausgelöst:

1. **Cloud-KI-Aufrufe** (optional): Wenn Sie eine KI-Aktion anklicken, geht der
   Prompt — Szenarionamen, Beschreibungen, Annahmen und bereits berechnete
   Zahlen — **direkt von Ihrem Browser an den von Ihnen konfigurierten
   Anbieter** (Anthropic, OpenAI, Google oder Alibaba), authentifiziert mit
   Ihrem eigenen Schlüssel. Es gibt keinen Proxy. Nutzen Sie KI auf dem Gerät
   (WebLLM oder die in Chrome integrierte KI) oder ein lokales Ollama, um auch
   dies auf Ihrem Rechner zu behalten.
2. **Modell-Download auf das Gerät** (optional, einmalig): Beim Aktivieren von
   WebLLM werden quantisierte Modellgewichte von dessen öffentlichem CDN
   heruntergeladen; der Browser speichert sie im Cache.
3. **Google Fonts**: Die beiden UI-Schriftarten werden vom CDN von Google
   geladen.
4. **Sonst nichts.** Keine Telemetrie, keine Analytik, keine Fehlerberichte,
   keine Update-Anfragen, keine eigene API.

## Sicherungen und Exporte

- **Verschlüsselte Sicherung** (empfohlen): eine JSON-Datei, verschlüsselt mit
  einer von Ihnen gewählten Passphrase (dasselbe PBKDF2-+-AES-GCM-Verfahren).
  Kann bedenkenlos überall abgelegt werden.
- **Unverschlüsselte Sicherung** (Opt-in, mit Warnung): Klartext-JSON von
  allem, einschließlich gespeicherter API-Schlüssel. Wird nur als letzte
  Absicherung gegen eine vergessene Passphrase angeboten. Behandeln Sie sie
  wie eine Passwortdatei.
- **Bericht (.md), Prüfprotokoll (.txt/.doc)**: naturgemäß Klartext — genau
  das ist der Zweck des Exports. Geben Sie sie bewusst weiter.

## Ihre Verantwortlichkeiten

- Wählen Sie eine starke Passphrase; sie ist die gesamte Sicherheitsgrenze.
- Wenn Ihre Szenarien regulierte oder als Verschlusssache eingestufte
  Informationen enthalten, bevorzugen Sie KI auf dem Gerät oder verzichten Sie
  auf KI, und behandeln Sie Exporte entsprechend.
- Nutzen Sie auf gemeinsam genutzten Rechnern die automatische Sperre
  (Einstellungen → Sicherheit) und sperren Sie den Tresor, wenn Sie den Platz
  verlassen.

Die sicherheitstechnischen Details (CSP, Kryptografie-Parameter, regulatorische
Einordnung) finden Sie in `SECURITY.md`.
