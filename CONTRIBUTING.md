# Contributing

## Voraussetzungen

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)

## Setup

```bash
git clone <repo-url>
cd todoSideBar
pnpm install
pnpm dev
```

## Entwicklungs-Workflow

1. Von `dev` aus einen Feature-Branch erstellen:
   ```bash
   git checkout dev && git pull origin dev
   git checkout -b feature/mein-feature
   ```

2. Entwickeln und committen (Conventional Commits):
   ```bash
   git add src/datei.tsx
   git commit -m "feat(todos): add subtask support"
   ```

3. Push und PR öffnen → `feature/*` → `dev`

Vollständiger Workflow → [GIT_WORKFLOW.md](GIT_WORKFLOW.md)  
Commit-Format → [ARCHITECTURE.md](ARCHITECTURE.md#11-conventional-commits)

## Scripts

| Script | Beschreibung |
|---|---|
| `pnpm dev` | App im Dev-Modus starten |
| `pnpm build` | Electron-App bauen |
| `pnpm typecheck` | TypeScript prüfen |
| `pnpm lint` | ESLint ausführen |
| `pnpm format` | Prettier formatieren |
| `pnpm test:unit` | Unit Tests |
| `pnpm test:component` | Komponenten-Tests |
| `pnpm test:e2e` | E2E Tests (Playwright) |
| `pnpm test:all` | Alle Tests |
