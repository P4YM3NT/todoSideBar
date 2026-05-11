# Todo Sidebar — Desktop App Plan

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Desktop-Shell | **Electron** |
| UI | **React + TypeScript** |
| Build | **Vite** via `electron-vite` |
| Persistenz | **electron-store** |
| Packaging | **electron-builder** |
| Styling | **Tailwind CSS** |
| Plattform (Prio) | macOS zuerst, dann Windows |

---

## Phasen-Übersicht

| Phase | Inhalt | Status |
|---|---|---|
| **1 — MVP** | Fenster, Sidebar-Mechanik, Tray, Shortcut, Design-System, Todo-Kern | Jetzt |
| **2 — Komfort** | Drag & Drop, Suche, Filter, Wiederkehrende Todos, Notifications | Später |
| **3 — Integration** | Auto-Start beim Login, Sync (iCloud/Dropbox), Export | Später |

---

## Phase 1 — MVP (Detailliert)

### 1.1 Electron-Fenster & Sidebar-Mechanik

#### Fenster-Konfiguration
- **Frameless** (`frame: false`) — kein OS-Titelleiste, eigenes Drag-Handle
- **Always on Top** — dauerhaft aktiv, kein Toggle nötig
- **Transparent** (`transparent: false`) — solider Hintergrund, kein Glassmorphism
- **macOS Spaces**: `visibleOnAllWorkspaces: true` — Sidebar bleibt auf allen Desktops sichtbar (Mission Control kompatibel)
- **Resizable**: ja — via Edge-Drag oder Scroll-Handle (siehe unten)

#### Snap-Positionen
Drei vordefinierte Positionen, Fenster rastet am Bildschirmrand ein:
```
LEFT   → linker Bildschirmrand, volle Höhe
RIGHT  → rechter Bildschirmrand, volle Höhe
TOP    → oberer Bildschirmrand, volle Breite
```
Position wird beim Start wiederhergestellt (gespeichert in electron-store).

#### Drag-to-Reposition
- Sidebar hat einen **Drag-Handle** (oberer Bereich der Sidebar)
- Beim Gedrückthalten + Ziehen zur nächsten Seite → Sidebar "springt" in die neue Position (snap)
- Kein freies Platzieren — nur zwischen den 3 Positionen wechselbar

#### Kollabierter Zustand
Wenn die Sidebar zugeklappt ist:
- Nur ein **schmaler Streifen** bleibt sichtbar (~16px breit bei links/rechts, ~16px hoch bei oben)
- In der **Mitte des Streifens** ein **abgerundetes Rechteck** (Pill-Shape) mit einem Pfeil-Icon (`›` / `‹` / `˄`)
- Das Pill fließt harmonisch in den Streifen ein — kein hartes Element, wirkt wie Teil der Kante
- Klick auf das Pill → Sidebar klappt auf
- Animation: smooth slide-in/out (CSS transition ~200ms)

```
Kollabiert (links):    Geöffnet (links):
┌──┐                   ┌────────────┐
│  │                   │            │
│  │                   │  Todo      │
│ ›│◄── Pill           │  Liste     │
│  │                   │            │
│  │                   │            │
└──┘                   └────────────┘
```

#### Resize-Mechanik
- **Edge-Drag**: Maus an die gegenüberliegende Kante der Sidebar halten → Cursor wechselt zu Resize-Cursor → Drag ändert Breite/Höhe
- Mindestbreite: 220px, Maximalbreite: 480px (links/rechts)
- Mindesthöhe: 200px, Maximalhöhe: 60% der Bildschirmhöhe (oben)
- Größe wird gespeichert und beim Start wiederhergestellt

---

### 1.2 System-Integration

#### System Tray
- Einfaches Tray-Icon in der Menüleiste (macOS) / Taskleiste (Windows)
- Rechtsklick-Menü:
  - "Sidebar öffnen / schließen"
  - "Beenden"
- Klick auf Tray-Icon → Sidebar toggle

#### Globaler Keyboard-Shortcut
- Default: `Cmd+Shift+T` (macOS) / `Ctrl+Shift+T` (Windows)
- Funktioniert systemweit, auch wenn App nicht im Vordergrund
- Shortcut custom anpassbar (Phase 2)

---

### 1.3 Todo-Datenmodell

```typescript
type Priority = 'extreme' | 'high' | 'medium' | 'low';

type Subtask = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

type Todo = {
  id: string;
  text: string;
  description?: string;
  links?: string[];
  done: boolean;
  archived: boolean;
  priority: Priority;
  categoryId?: string;
  subtasks: Subtask[];
  dueDate?: number;      // Unix-Timestamp (Datum)
  dueTime?: string;      // "HH:mm" — optional, nur wenn dueDate gesetzt
  createdAt: number;
  updatedAt: number;
};

type Category = {
  id: string;
  name: string;
  createdAt: number;
};

type SidebarConfig = {
  position: 'left' | 'right' | 'top';
  isOpen: boolean;
  width: number;         // px — für left/right
  height: number;        // px — für top
};

type Settings = {
  theme: 'light' | 'dark' | 'system';
  globalShortcut: string;
};

type AppState = {
  todos: Todo[];
  categories: Category[];
  sidebar: SidebarConfig;
  settings: Settings;
};
```

---

### 1.4 Todo-Features (Phase 1)

#### Erstellen
- **Text** (Pflichtfeld)
- **Beschreibung** (optionales Textfeld, mehrzeilig)
- **Links** (eine oder mehrere URLs hinzufügen, klickbar)
- **Fälligkeitsdatum** (optional, Datepicker)
- **Fälligkeitszeit** (optional, nur wenn Datum gesetzt, Timepicker)
- **Priorität** wählen: Extrem / Hoch / Mittel / Niedrig
- **Kategorie** zuweisen (optional)
- **Subtasks** hinzufügen (+ Button, beliebig viele)

#### Anzeige & Interaktion
- Todos in der Listenansicht: kompakt mit Checkbox, Text, Priorität-Indikator, Fälligkeitsdatum
- Klick auf Todo → klappt auf / öffnet Detailansicht (inline oder Modal)
- Subtask-Fortschritt als kleiner Indicator (z.B. "2/5")
- Checkbox → Todo als erledigt markieren → wandert ins Archiv

#### Kategorien / Listen
- Sidebar-Navigation oben: "Alle" + je eine Zeile pro Kategorie
- Kategorie erstellen / umbenennen / löschen
- Todos können einer Kategorie zugewiesen werden (optional)
- Ansicht "Alle" zeigt Todos aus allen Kategorien

#### Archiv
- Erledigte Todos landen im Archiv (nicht gelöscht)
- Archiv-Ansicht über separaten Tab/Bereich
- Aus dem Archiv: wiederherstellen oder endgültig löschen

#### Prioritäts-Visualisierung
```
Extrem  → rote Markierung (kleiner Balken/Dot links)
Hoch    → orange
Mittel  → blau (light) / gelb (dark)
Niedrig → grau / kein Marker
```

---

### 1.5 Design-System

#### Grundprinzip
Minimalistisch, clean — orientiert an Notion / Linear.
Kein visueller Lärm. Klare Typografie. Großzügiges Whitespace.

#### Farbpalette

**Light Mode:**
```
Background:   #FFFFFF
Surface:      #F7F7F7  (Sidebar-BG, Cards)
Border:       #E5E5E5
Text primary: #1A1A1A
Text muted:   #8A8A8A
Accent:       #2563EB  (Blau — sparsam einsetzen)
```

**Dark Mode:**
```
Background:   #141414
Surface:      #1E1E1E
Border:       #2A2A2A
Text primary: #F0F0F0
Text muted:   #6B6B6B
Accent:       #EAB308  (Gelb — sparsam einsetzen)
```

**Akzentfarbe-Einsatz** (minimal):
- Checkboxen (checked state)
- Aktive Kategorie-Highlight
- "Hinzufügen"-Button
- Priorität "Mittel"-Marker
- Focus-Ringe bei Inputs

#### Typografie
- System Font: `-apple-system` (macOS) / `Segoe UI` (Windows) — kein externer Font-Import
- Größen: 13px Base, 11px Muted/Labels, 15px Headings

#### Komponenten-Stil
- Border Radius: `6px` für Cards, `12px` für Pill/Buttons, `4px` für Inputs
- Shadows: keine oder sehr subtil (`0 1px 3px rgba(0,0,0,0.06)`)
- Übergänge: `150–200ms ease`
- Icons: `lucide-react` (konsistentes, minimales Icon-Set)

---

### 1.6 Projektstruktur

```
todoSideBar/
├── electron/
│   ├── main.ts            # Window erstellen, Tray, Shortcuts, IPC-Handler
│   ├── preload.ts         # Sichere IPC-Brücke (contextBridge)
│   └── store.ts           # electron-store Setup & Typen
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Sidebar-Shell, Position, Toggle, Resize
│   │   │   ├── CollapsePill.tsx     # Der Pfeil-Streifen zum Aufklappen
│   │   │   └── DragHandle.tsx       # Drag-to-Reposition Handle
│   │   ├── navigation/
│   │   │   ├── CategoryNav.tsx      # Alle / Kategorie-Liste
│   │   │   └── ArchiveTab.tsx       # Archiv-Ansicht
│   │   ├── todos/
│   │   │   ├── TodoList.tsx         # Liste aller Todos
│   │   │   ├── TodoItem.tsx         # Kompakte Zeile
│   │   │   ├── TodoDetail.tsx       # Aufgeklappte Detailansicht
│   │   │   ├── TodoForm.tsx         # Erstellen / Bearbeiten
│   │   │   ├── SubtaskList.tsx      # Subtasks innerhalb eines Todos
│   │   │   └── PriorityBadge.tsx    # Priorität-Anzeige
│   │   └── ui/
│   │       ├── Checkbox.tsx
│   │       ├── DatePicker.tsx
│   │       ├── TimePicker.tsx
│   │       └── Button.tsx
│   ├── hooks/
│   │   ├── useTodos.ts              # Todo CRUD, Archiv
│   │   ├── useCategories.ts         # Kategorie CRUD
│   │   ├── useSidebar.ts            # Position, Toggle, Resize
│   │   └── useTheme.ts              # OS-Theme Detection
│   ├── store/
│   │   └── ipc.ts                   # IPC-Wrapper (invoke-Calls)
│   └── types.ts                     # Alle TypeScript-Typen
├── public/
│   ├── tray-icon.png
│   └── tray-icon@2x.png
├── electron-builder.yml
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

### 1.7 IPC-Kanäle (Main ↔ Renderer)

| Channel | Richtung | Beschreibung |
|---|---|---|
| `store:get` | Renderer → Main | Gesamten AppState laden |
| `store:set` | Renderer → Main | AppState speichern |
| `sidebar:setPosition` | Renderer → Main | Fenster an neue Position snappen |
| `sidebar:resize` | Renderer → Main | Fensterbreite/-höhe anpassen |
| `sidebar:toggle` | Renderer → Main | Auf/Zuklappen |
| `app:getTheme` | Renderer → Main | OS-Theme abfragen (light/dark) |
| `app:onThemeChange` | Main → Renderer | OS-Theme hat gewechselt (push) |

---

## Phase 2 — Spätere Features

- **Drag & Drop** Todos umsortieren
- **Suche** über alle Todos
- **Filter** innerhalb Kategorien (nach Priorität, Datum, Status)
- **Wiederkehrende Todos** (täglich, wöchentlich, monatlich, custom)
- **Desktop-Benachrichtigungen** bei Fälligkeit
- **Globalen Shortcut** in den Settings anpassbar
- **Keyboard Navigation** innerhalb der Sidebar

---

## Phase 3 — Zukunft

- **Auto-Start** beim Login (macOS Login Items / Windows Registry)
- **Sync** zwischen Geräten (iCloud-Datei / Dropbox / eigener Server)
- **Windows-Optimierungen** (nachdem macOS stabil)
- **Auto-Update** in der App (electron-updater — Nutzer bekommt Update-Prompt)
- **Mac App Store** Distribution
- **Microsoft Store** Distribution

---

## Setup-Reihenfolge (Phase 1)

1. Projekt init mit `electron-vite` + React + TypeScript + Tailwind
2. Electron Main: Frameless Window, Always on Top, macOS Spaces
3. Snap-Logik: drei Positionen, Fenster positionieren
4. Kollaps-Mechanik: schmaler Streifen + CollapsePill
5. Resize per Edge-Drag
6. electron-store: AppState Persistenz
7. IPC Preload Bridge
8. System Tray (simpel)
9. Globaler Keyboard-Shortcut
10. Design-System: Tailwind Config, Theme (OS-Detection), Farben
11. UI-Komponenten: Navigation, TodoList, TodoItem, TodoForm
12. Todo-Logik: CRUD, Subtasks, Kategorien, Archiv
13. Prioritäten, Datepicker, Timepicker
14. Feinschliff: Animationen, Übergänge, Edge Cases
