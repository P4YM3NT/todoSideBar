# CLAUDE.md — Projektregeln für Todo Sidebar

Diese Datei wird von Claude Code automatisch geladen. Alle Regeln hier sind verbindlich.

---

## Projekt-Übersicht

Desktop Sidebar App für macOS (primär) und Windows.
Docs: [PLAN.md](PLAN.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [GIT_WORKFLOW.md](GIT_WORKFLOW.md)

**Stack:** Electron · React · TypeScript · Vite (electron-vite) · Tailwind CSS · pnpm  
**Persistenz:** electron-store · **Tests:** Vitest · React Testing Library · Playwright  
**Releases:** semantic-release via GitHub Actions

---

## Git — Absolute Regeln

- **Niemals direkt auf `main` oder `dev` committen oder pushen**
- Jedes Feature, jeder Fix, jede Änderung = eigener Branch von `dev`
- Branch-Namen: `feature/`, `fix/`, `chore/`, `docs/`, `ci/`
- **Commits immer im Conventional Commit Format** — kein Ausnahmen
- Niemals `git add .` oder `git add -A` — immer gezielt einzelne Dateien stagen
- Niemals `--force` auf `main` oder `dev`
- Niemals manuell Git-Tags erstellen — das macht semantic-release

**Commit-Format:**
```
<type>(<scope>): <beschreibung>
```
Typen: `feat` `fix` `perf` `refactor` `style` `test` `docs` `chore` `ci`  
Scopes: `electron` `ipc` `ui` `sidebar` `todos` `store` `ci` `deps`

Vollständige Dokumentation → [ARCHITECTURE.md](ARCHITECTURE.md#11-conventional-commits)

---

## Code-Stil

- **TypeScript strict** — kein `any`, kein `// @ts-ignore`
- **Keine Kommentare** außer wenn das Warum wirklich nicht aus dem Code hervorgeht
- Keine Docstrings, keine Multi-Zeilen-Kommentarblöcke
- Keine vorzeitigen Abstraktionen — drei ähnliche Zeilen sind besser als eine falsche Abstraktion
- Keine Features bauen die nicht im aktuellen Plan stehen
- Keine `console.log` im committed Code — stattdessen `logger` (electron-log)
- Tabs, keine Spaces (Prettier-Konfiguration)

---

## Architektur-Regeln

### Electron IPC
- Renderer hat **keinen direkten Node.js-Zugriff**
- Alle Main-Process-Calls laufen über `window.api.invoke()` (contextBridge)
- IPC-Channel-Namen und Payload-Typen sind in `electron/shared/ipc-types.ts` definiert
- Jeden IPC-Handler in try-catch wrappen, immer `{ success, data/error }` zurückgeben

### State Management (Zustand)
- State liegt in Zustand-Stores (`src/store/`)
- Stores sind der einzige Ort der IPC-Calls macht
- Komponenten lesen aus Stores, rufen Store-Actions auf — kein direktes `invoke()` in Komponenten

### Error Handling
- Main Process: `process.on('uncaughtException')` loggen
- IPC Handler: try-catch, Error-Response zurückgeben
- React: Error Boundaries um Haupt-Bereiche (`<TodoListBoundary>`, `<SidebarBoundary>`)
- Kein Crashen ohne Fallback-UI

### Logging
- `logger.error()` — unerwartete Fehler, IPC-Failures
- `logger.warn()` — degraded state
- `logger.info()` — App-Start, Window-Events
- `logger.debug()` — nur Development, IPC-Calls
- Kein `console.log`

---

## Design-Regeln

Orientierung: **Notion / Linear** — minimalistisch, kein visueller Lärm.

**Light Mode:** Background `#FFFFFF` · Surface `#F7F7F7` · Accent `#2563EB` (Blau)  
**Dark Mode:** Background `#141414` · Surface `#1E1E1E` · Accent `#EAB308` (Gelb)

- Dark/Light folgt OS-Einstellung automatisch
- Akzentfarbe sparsam einsetzen (Checkboxen, aktive States, primärer Button)
- Kein Glassmorphism, keine Transparenz — solider Hintergrund
- System Font: `-apple-system` / `Segoe UI` — kein externer Font
- Icons: ausschließlich `lucide-react`
- Border Radius: `6px` Cards · `12px` Pills/Buttons · `4px` Inputs
- Animationen: `150–200ms ease`

---

## Testing-Regeln

- Unit Tests für alle Business-Logik in `tests/unit/`
- Komponenten-Tests für interaktive UI in `tests/component/`
- E2E Tests für kritische User Flows in `tests/e2e/`
- Tests laufen in CI bei jedem PR — lokal: `pnpm test:all`
- Keine Tests mocken die eine echte Implementierung ersetzen könnten

---

## Was Claude niemals tun soll

- Nicht auf `main` oder `dev` committen
- Keine Features bauen die nicht im aktuellen Plan (PLAN.md) stehen
- Keinen Code für spätere Phasen vorbauen ("wäre später nützlich")
- Keine `any`-Typen verwenden
- Keine Backwards-Compatibility-Hacks (`_unused`, Re-Exports von gelöschtem Code)
- Keine `console.log` commits
- Nicht manuell Git-Tags erstellen
- Kein `git add -A` oder `git add .`
- Keinen Code signen oder Notarization-Steps einbauen (kein Apple Developer Account)
- Keine Kommentare die erklären WAS der Code macht — nur WARUM wenn nicht offensichtlich

---

## Phasen-Überblick

**Phase 1 (jetzt):** Electron-Fenster, Sidebar-Mechanik, Tray, Shortcut, Design-System, Todo-CRUD, Kategorien, Subtasks, Archiv  
**Phase 2 (später):** Drag & Drop, Suche, Filter, Wiederkehrende Todos, Notifications  
**Phase 3 (Zukunft):** Auto-Start, Sync, Auto-Update, App Stores, Windows-Optimierungen

Bei Unklarheit ob etwas in Phase 1 gehört → in PLAN.md nachschauen, nicht raten.
