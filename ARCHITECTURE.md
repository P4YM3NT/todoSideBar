# Todo Sidebar — Architecture

## Inhaltsverzeichnis
1. [Prozess-Architektur (Electron)](#1-prozess-architektur)
2. [State Management](#2-state-management)
3. [IPC-Architektur](#3-ipc-architektur)
4. [Error Handling & Logging](#4-error-handling--logging)
5. [Ordnerstruktur](#5-ordnerstruktur)
6. [Umgebungs-Konfiguration](#6-umgebungs-konfiguration)
7. [Branching-Strategie](#7-branching-strategie)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Testing-Strategie](#9-testing-strategie)
10. [Code-Qualität](#10-code-qualität)
11. [Conventional Commits](#11-conventional-commits)
12. [Versionierung & Releases](#12-versionierung--releases)

---

## 1. Prozess-Architektur

Electron-Apps bestehen aus zwei isolierten Prozessen. Das ist keine Konvention — es ist eine Sicherheitsgrenze.

```
┌─────────────────────────────────────────────────────────────┐
│  Main Process (Node.js)                                     │
│  ─────────────────────                                      │
│  window.ts       → BrowserWindow erstellen & konfigurieren  │
│  tray.ts         → System Tray Icon & Menü                  │
│  shortcuts.ts    → Globale Keyboard Shortcuts               │
│  store.ts        → electron-store (Datei-Persistenz)        │
│  logger.ts       → electron-log Setup                       │
│  ipc/            → IPC Handler (empfangen & antworten)      │
└──────────────────────────┬──────────────────────────────────┘
                           │  contextBridge (preload.ts)
                           │  Einzige erlaubte Brücke
┌──────────────────────────▼──────────────────────────────────┐
│  Renderer Process (Chromium + React)                        │
│  ────────────────────────────────                           │
│  Kein direkter Zugriff auf Node.js APIs                     │
│  Kommuniziert nur via window.api.* (contextBridge)          │
│  Zustand liegt in Zustand-Stores (Zustand-Library)          │
│  Daten werden via IPC zum Main Process geschrieben          │
└─────────────────────────────────────────────────────────────┘
```

### Warum diese Trennung wichtig ist
Der Renderer lädt externe Inhalte (Links in Todos). Würde er direkten Node.js-Zugriff haben, wäre jeder Link eine potenzielle Code-Execution-Lücke. Das Preload-Script ist die kontrollierte, typisierte Grenze.

---

## 2. State Management

**Library: [Zustand](https://github.com/pmndrs/zustand)**

Zustand ist minimalistisch (kein Boilerplate wie Redux), funktioniert ohne Provider-Wrapper und ist einfach zu testen. Jeder Store ist unabhängig und synchronisiert sich via IPC mit electron-store.

### Store-Struktur

```
src/store/
├── todos.ts        # Todo CRUD, Archiv
├── categories.ts   # Kategorie CRUD
├── sidebar.ts      # Position, isOpen, Dimensionen
├── settings.ts     # Theme, Shortcuts
└── ipc.ts          # Typisierte IPC-Wrapper-Funktionen
```

### Datenfluss

```
User-Aktion (React)
      │
      ▼
Zustand Store Action
      │
      ├── State lokal aktualisieren (optimistic update)
      │
      └── IPC-Call → Main Process → electron-store (Datei)
                                         │
                                         └── Bestätigung → Store finalisiert
```

### Beispiel-Store-Schnittstelle

```typescript
// src/store/todos.ts
interface TodoStore {
  todos: Todo[];
  archivedTodos: Todo[];
  add: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: string, changes: Partial<Todo>) => Promise<void>;
  archive: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  deletePermanently: (id: string) => Promise<void>;
  hydrate: () => Promise<void>; // Lädt initalen State vom Main Process
}
```

---

## 3. IPC-Architektur

### Prinzip
Alle IPC-Calls sind **Promise-basiert** (`ipcMain.handle` / `ipcRenderer.invoke`). Kein Fire-and-Forget. Jeder Call hat einen typisierten Request und Response.

### Typen-Definition (geteilt zwischen Main & Renderer)

```typescript
// electron/shared/ipc-types.ts
export type IpcChannels = {
  'store:get':              { req: void;              res: AppState };
  'store:set':              { req: Partial<AppState>; res: void };
  'sidebar:setPosition':    { req: SidebarPosition;  res: void };
  'sidebar:resize':         { req: { width?: number; height?: number }; res: void };
  'sidebar:toggle':         { req: void;              res: boolean };
  'app:getTheme':           { req: void;              res: 'light' | 'dark' };
  'app:onThemeChange':      { req: void;              res: 'light' | 'dark' }; // Main → Renderer push
};

// Typsicherer invoke-Wrapper im Renderer
export async function invoke<K extends keyof IpcChannels>(
  channel: K,
  payload?: IpcChannels[K]['req']
): Promise<IpcChannels[K]['res']> {
  return window.api.invoke(channel, payload);
}
```

### Preload-Script (contextBridge)

```typescript
// electron/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, payload?: unknown) =>
    ipcRenderer.invoke(channel, payload),
  on: (channel: string, callback: (data: unknown) => void) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners(channel); // Cleanup
  },
});
```

### IPC-Handler-Struktur im Main Process

```
electron/main/ipc/
├── index.ts        # Registriert alle Handler
├── store.ts        # store:get, store:set
├── sidebar.ts      # sidebar:setPosition, sidebar:resize, sidebar:toggle
└── app.ts          # app:getTheme, app:onThemeChange
```

---

## 4. Error Handling & Logging

### Logging mit electron-log

**Log-Dateien:**
- macOS: `~/Library/Logs/TodoSideBar/main.log`
- Windows: `%APPDATA%\TodoSideBar\logs\main.log`

**Konfiguration:**
```typescript
// electron/main/logger.ts
import log from 'electron-log/main';

log.transports.file.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn';
log.transports.file.maxSize = 10 * 1024 * 1024; // 10 MB
log.transports.file.archiveLog = true;           // Rotation
log.transports.console.level = 'debug';          // Im Dev immer alles in Konsole

export default log;
```

**Log-Level-Verwendung:**
| Level | Wann |
|---|---|
| `error` | Unerwartete Fehler, IPC-Failures, Store-Fehler |
| `warn`  | Degraded state, fehlende optionale Daten |
| `info`  | App-Start, Window-Events, State-Saves |
| `debug` | IPC-Calls, Store-Reads, nur in Development |

### Error-Handling-Schichten

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1 — Main Process                                      │
│ process.on('uncaughtException')  → loggen + Dialog zeigen   │
│ process.on('unhandledRejection') → loggen + weiter          │
├─────────────────────────────────────────────────────────────┤
│ Layer 2 — IPC Handler                                       │
│ try-catch in jedem Handler → Fehler loggen → Error-Response │
│ { success: false, error: string } zurückgeben               │
├─────────────────────────────────────────────────────────────┤
│ Layer 3 — Zustand Store                                     │
│ try-catch um IPC-Calls → Fehler-State im Store setzen       │
│ Komponenten reagieren auf error-State                        │
├─────────────────────────────────────────────────────────────┤
│ Layer 4 — React Error Boundaries                            │
│ <TodoListBoundary>   → fängt Render-Fehler im Todo-Bereich  │
│ <SidebarBoundary>    → fängt Fehler in der Sidebar-Shell    │
│ Zeigt Fallback-UI statt App-Crash                           │
└─────────────────────────────────────────────────────────────┘
```

### IPC-Response-Konvention

Jeder IPC-Handler gibt ein einheitliches Response-Objekt zurück:

```typescript
type IpcResponse<T> =
  | { success: true;  data: T }
  | { success: false; error: string };
```

---

## 5. Ordnerstruktur

```
todoSideBar/
│
├── .github/
│   └── workflows/
│       ├── pr.yml              # PR-Pipeline: Lint, Test, Preview-Build
│       └── release.yml         # Release-Pipeline: Build + semantic-release
│
├── electron/
│   ├── main/
│   │   ├── index.ts            # Entry Point, App-Lifecycle
│   │   ├── window.ts           # BrowserWindow, Snap-Logik, Resize
│   │   ├── tray.ts             # System Tray
│   │   ├── shortcuts.ts        # Globale Keyboard Shortcuts
│   │   ├── store.ts            # electron-store Instanz & Schema
│   │   ├── logger.ts           # electron-log Konfiguration
│   │   └── ipc/
│   │       ├── index.ts        # Alle Handler registrieren
│   │       ├── store.ts        # store:get, store:set
│   │       ├── sidebar.ts      # sidebar:* Handler
│   │       └── app.ts          # app:* Handler
│   ├── preload/
│   │   └── index.ts            # contextBridge — window.api
│   └── shared/
│       └── ipc-types.ts        # Geteilte IPC-Typen (Main + Renderer)
│
├── src/
│   ├── main.tsx                # React Entry Point
│   ├── App.tsx                 # Root mit Error Boundary + Theme
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx         # Shell, Position, Resize-Logik
│   │   │   ├── CollapsePill.tsx    # Streifen + Pfeil-Toggle
│   │   │   └── DragHandle.tsx      # Drag-to-Reposition
│   │   ├── navigation/
│   │   │   ├── CategoryNav.tsx     # Alle / Kategorien
│   │   │   └── ArchiveView.tsx     # Archiv-Ansicht
│   │   ├── todos/
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   ├── TodoDetail.tsx
│   │   │   ├── TodoForm.tsx
│   │   │   ├── SubtaskList.tsx
│   │   │   └── PriorityBadge.tsx
│   │   └── ui/                     # Generische UI-Primitives
│   │       ├── Checkbox.tsx
│   │       ├── Button.tsx
│   │       ├── DatePicker.tsx
│   │       ├── TimePicker.tsx
│   │       ├── Input.tsx
│   │       └── ErrorBoundary.tsx
│   ├── store/
│   │   ├── todos.ts
│   │   ├── categories.ts
│   │   ├── sidebar.ts
│   │   ├── settings.ts
│   │   └── ipc.ts              # Typisierte invoke-Wrapper
│   ├── hooks/
│   │   ├── useTheme.ts         # OS-Theme Detection + Wechsel
│   │   └── useKeyboard.ts      # Lokale Keyboard-Events
│   └── types.ts                # Alle App-Typen
│
├── tests/
│   ├── unit/                   # Vitest Unit Tests
│   │   ├── todos.test.ts
│   │   └── categories.test.ts
│   ├── component/              # React Testing Library
│   │   ├── TodoItem.test.tsx
│   │   └── TodoForm.test.tsx
│   └── e2e/                    # Playwright E2E Tests
│       ├── sidebar.spec.ts
│       └── todos.spec.ts
│
├── public/
│   ├── tray-icon.png
│   └── tray-icon@2x.png
│
├── .env.development
├── .env.production
├── .eslintrc.cjs
├── .prettierrc
├── electron-builder.yml
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── CONTRIBUTING.md
├── CHANGELOG.md                # Auto-generiert von semantic-release
└── package.json
```

---

## 6. Umgebungs-Konfiguration

### .env.development
```env
VITE_APP_ENV=development
VITE_LOG_LEVEL=debug
VITE_APP_VERSION=dev
```

### .env.production
```env
VITE_APP_ENV=production
VITE_LOG_LEVEL=warn
```

### Zugriff im Code
```typescript
// Renderer (Vite)
const isDev = import.meta.env.VITE_APP_ENV === 'development';

// Main Process (Node.js)
const isDev = process.env.NODE_ENV === 'development';
```

### .gitignore-Ergänzung
`.env.local` und `.env.*.local` werden nie committed — für lokale Overrides.

---

## 7. Branching-Strategie

### Struktur

```
main          ← Produktion. Nur via PR. Branch Protection aktiv.
  └── dev     ← Integration. Feature-Branches laufen hier zusammen.
       ├── feature/sidebar-snap
       ├── feature/todo-form
       ├── fix/tray-icon-macos
       └── chore/update-deps
```

### Regeln

| Branch | Push | Merge via | Auslöser |
|---|---|---|---|
| `main` | Nie direkt | PR von `dev` | Release |
| `dev` | Nie direkt | PR von Feature-Branch | Integration |
| `feature/*` | Frei | PR → `dev` | Neue Features |
| `fix/*` | Frei | PR → `dev` | Bug Fixes |
| `chore/*` | Frei | PR → `dev` | Maintenance |

### Branch Protection auf `main`
- Kein direkter Push
- Mindestens 1 PR-Review (kann sich selbst reviewen als Solo-Dev — dient als Checkpoint)
- Status Checks müssen grün sein (PR-Pipeline)
- Branch muss aktuell sein vor Merge

### Namenskonvention
```
feature/todo-subtasks
feature/sidebar-resize
fix/electron-tray-macos-14
chore/bump-electron-32
docs/update-contributing
```

---

## 8. CI/CD Pipeline

### Übersicht

```
PR öffnen (→ dev oder →main)          Push auf main
         │                                    │
   ┌─────▼──────┐                     ┌──────▼──────┐
   │  PR-Pipeline│                    │Release-Pipeline│
   │             │                    │               │
   │ 1. Quality  │                    │ 1. Quality    │
   │ 2. Test     │                    │ 2. Test       │
   │ 3. Preview  │                    │ 3. Build macOS│
   │    Build    │                    │ 4. Build Win  │
   └─────────────┘                    │ 5. Release    │
                                      └───────────────┘
```

### Datei: `.github/workflows/pr.yml`

```yaml
name: PR Check

on:
  pull_request:
    branches: [dev, main]

jobs:
  quality:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    name: Tests
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit
      - run: pnpm test:component
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e

  preview-build:
    name: Preview Build
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          NODE_ENV: production
          CSC_IDENTITY_AUTO_DISCOVERY: false  # Kein Code-Signing im PR
      - uses: actions/upload-artifact@v4
        with:
          name: preview-macos-${{ github.sha }}
          path: dist/*.dmg
          retention-days: 3
```

### Datei: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  quality:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    name: Tests
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit
      - run: pnpm test:component
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e

  build-macos:
    name: Build macOS
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          NODE_ENV: production
          CSC_IDENTITY_AUTO_DISCOVERY: false
      - uses: actions/upload-artifact@v4
        with:
          name: release-macos
          path: dist/*.dmg

  build-windows:
    name: Build Windows
    needs: test
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          NODE_ENV: production
      - uses: actions/upload-artifact@v4
        with:
          name: release-windows
          path: dist/*.exe

  release:
    name: semantic-release
    needs: [build-macos, build-windows]
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0           # Gesamte History für semantic-release
          persist-credentials: false
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - uses: actions/download-artifact@v4
        with:
          name: release-macos
          path: dist/
      - uses: actions/download-artifact@v4
        with:
          name: release-windows
          path: dist/
      - run: pnpm semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### semantic-release Konfiguration (`.releaserc.json`)

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", {
      "changelogFile": "CHANGELOG.md"
    }],
    ["@semantic-release/github", {
      "assets": [
        { "path": "dist/*.dmg", "label": "macOS" },
        { "path": "dist/*.exe", "label": "Windows" }
      ]
    }],
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]"
    }]
  ]
}
```

> **Zu Frage 7:** Mit semantic-release braucht es keine separate tag-triggered Pipeline. semantic-release erstellt den Tag selbst als Teil des Release-Prozesses (`chore(release): v1.2.0`). Der `[skip ci]`-Marker verhindert eine Endlosschleife.

---

## 9. Testing-Strategie

### Test-Pyramide

```
         ╱╲
        ╱E2E╲         ← Wenige, hochwertiger Smoke-Tests
       ╱──────╲           (Playwright + Electron)
      ╱Component╲     ← Mittlere Anzahl
     ╱────────────╲       (React Testing Library + Vitest)
    ╱  Unit Tests   ╲  ← Viele, schnelle Tests
   ╱──────────────────╲   (Vitest, keine UI)
```

### Unit Tests (Vitest)

Für reine Business-Logik ohne UI — schnell, isoliert.

**Was wird getestet:**
- Todo-CRUD-Logik (add, update, archive, restore)
- Kategorie-Logik
- Datums-/Zeit-Utilities
- IPC-Response-Validierung

```typescript
// tests/unit/todos.test.ts
import { describe, it, expect } from 'vitest';
import { createTodo, archiveTodo } from '../../src/store/todos';

describe('Todo Store Logic', () => {
  it('creates todo with correct defaults', () => {
    const todo = createTodo({ text: 'Test', priority: 'medium' });
    expect(todo.done).toBe(false);
    expect(todo.archived).toBe(false);
    expect(todo.subtasks).toEqual([]);
  });
});
```

### Komponenten-Tests (Vitest + React Testing Library)

Für UI-Komponenten — testet Verhalten aus Nutzersicht, nicht Implementierung.

**Was wird getestet:**
- TodoItem: Checkbox-Interaktion, Priorität-Anzeige
- TodoForm: Validierung, Submit
- CategoryNav: Wechsel zwischen Listen

```typescript
// tests/component/TodoItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoItem } from '../../src/components/todos/TodoItem';

it('marks todo as done on checkbox click', async () => {
  const onArchive = vi.fn();
  render(<TodoItem todo={mockTodo} onArchive={onArchive} />);
  fireEvent.click(screen.getByRole('checkbox'));
  expect(onArchive).toHaveBeenCalledWith(mockTodo.id);
});
```

### E2E Tests (Playwright + Electron)

Testet die echte App — öffnet Electron, klickt durch die UI.

**Was wird getestet:**
- App startet und zeigt Sidebar
- Todo hinzufügen end-to-end
- Sidebar kollabieren und öffnen
- Archiv-Flow

```typescript
// tests/e2e/todos.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';

test('can add and archive a todo', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();

  await window.click('[data-testid="add-todo-input"]');
  await window.fill('[data-testid="add-todo-input"]', 'E2E Test Todo');
  await window.press('[data-testid="add-todo-input"]', 'Enter');

  await expect(window.locator('text=E2E Test Todo')).toBeVisible();
  await window.click('[data-testid="todo-checkbox"]');
  await expect(window.locator('text=E2E Test Todo')).not.toBeVisible();

  await app.close();
});
```

### Scripts in package.json

```json
{
  "scripts": {
    "test:unit":      "vitest run tests/unit",
    "test:component": "vitest run tests/component",
    "test:e2e":       "playwright test tests/e2e",
    "test:all":       "pnpm test:unit && pnpm test:component && pnpm test:e2e",
    "test:watch":     "vitest watch"
  }
}
```

---

## 10. Code-Qualität

### ESLint (`.eslintrc.cjs`)

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

### Prettier (`.prettierrc`)

```json
{
  "useTabs": true,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

### Scripts

```json
{
  "scripts": {
    "lint":      "eslint . --ext .ts,.tsx --report-unused-disable-directives",
    "lint:fix":  "eslint . --ext .ts,.tsx --fix",
    "format":    "prettier --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 11. Conventional Commits

### Format

```
<type>(<scope>): <beschreibung>

[optionaler body]

[optionaler footer]
```

### Typen & Version-Auswirkung

| Typ | Beschreibung | Version-Bump |
|---|---|---|
| `feat` | Neues Feature | `minor` (1.0.0 → 1.1.0) |
| `fix` | Bug Fix | `patch` (1.0.0 → 1.0.1) |
| `perf` | Performance-Verbesserung | `patch` |
| `refactor` | Code-Umbau (kein Feature, kein Fix) | — |
| `style` | Formatting, kein Logik-Change | — |
| `test` | Tests hinzufügen/anpassen | — |
| `docs` | Dokumentation | — |
| `chore` | Build, Deps, Tooling | — |
| `ci` | CI/CD Änderungen | — |

**Breaking Change → `major`-Bump (1.0.0 → 2.0.0):**
```
feat(ipc): change store:get response shape

BREAKING CHANGE: AppState schema changed, old electron-store data incompatible.
```

### Scopes für dieses Projekt

| Scope | Bereich |
|---|---|
| `electron` | Main Process, Window, Tray |
| `ipc` | IPC-Kanäle, Preload |
| `ui` | React-Komponenten allgemein |
| `sidebar` | Sidebar-Mechanik |
| `todos` | Todo-Logik und -Komponenten |
| `store` | Zustand + electron-store |
| `ci` | GitHub Actions |
| `deps` | Dependency Updates |

### Beispiele

```bash
# Feature
feat(todos): add subtask support with progress indicator

# Bug Fix
fix(sidebar): prevent window jumping on snap to right edge on macOS 14

# Breaking Change
feat(store): redesign AppState schema for category support

BREAKING CHANGE: Existing electron-store data will be migrated automatically on first launch.

# Chore
chore(deps): bump electron from 31.0.0 to 32.1.0

# CI
ci: add Windows build job to release pipeline

# Refactor ohne Version-Bump
refactor(ipc): extract handler registration into separate modules
```

### Commit-Nachricht schreiben

1. Imperativ, Gegenwart: `add`, nicht `added` oder `adds`
2. Kein Punkt am Ende der Beschreibung
3. Beschreibung unter 72 Zeichen
4. Body für das **Warum**, nicht das **Was**

---

## 12. Versionierung & Releases

### Semantic Versioning

```
MAJOR.MINOR.PATCH
  │      │     └── Backwards-kompatible Bug Fixes (fix:, perf:)
  │      └──────── Backwards-kompatible neue Features (feat:)
  └─────────────── Breaking Changes (BREAKING CHANGE:)
```

### Release-Ablauf

```
1. Feature-Branch auf dev mergen (PR)
       │
2. dev auf main mergen (PR)
       │
3. GitHub Actions: quality → test → build-macos → build-windows
       │
4. semantic-release analysiert Commits seit letztem Release
       │
5. Version-Bump berechnen (patch / minor / major)
       │
6. CHANGELOG.md generieren & commiten
       │
7. package.json Version updaten & commiten
       │
8. Git-Tag erstellen (z.B. v1.3.0)
       │
9. GitHub Release erstellen mit:
   - Auto-generierte Release Notes
   - .dmg (macOS) als Download
   - .exe (Windows) als Download
```

### CHANGELOG.md (Beispiel-Output)

```markdown
## [1.3.0] - 2026-05-15

### Features
- **todos:** add subtask support with progress indicator
- **sidebar:** add drag-to-reposition between snap positions

### Bug Fixes
- **sidebar:** prevent window jumping on snap to right edge on macOS 14

## [1.2.1] - 2026-05-10
...
```
