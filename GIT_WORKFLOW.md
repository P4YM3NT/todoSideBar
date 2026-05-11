# Git Workflow

## Branch-Struktur

```
main        ← Produktion. Nur Releases landen hier. Niemals direkt pushen.
  └── dev   ← Integration. Alle Feature-Branches laufen hier zusammen.
       ├── feature/sidebar-snap
       ├── feature/todo-form
       ├── fix/tray-icon-macos
       └── chore/update-deps
```

---

## Wann welchen Branch-Typ?

| Typ | Wann | Beispiel |
|---|---|---|
| `feature/` | Neues Feature aus PLAN.md Phase 1/2 | `feature/todo-subtasks` |
| `fix/` | Bug der in dev oder main gefunden wurde | `fix/sidebar-jump-on-snap` |
| `chore/` | Deps updaten, Tooling, Config | `chore/bump-electron-32` |
| `docs/` | Nur Dokumentation | `docs/update-contributing` |
| `ci/` | Pipeline-Änderungen | `ci/add-windows-build` |

---

## Schritt-für-Schritt Workflow

### 1. Neues Feature starten

```bash
# Immer von dev aus starten, niemals von main
git checkout dev
git pull origin dev

# Feature-Branch erstellen
git checkout -b feature/todo-form
```

### 2. Entwickeln & Committen

Commits klein halten — ein Commit = eine logische Einheit.

```bash
# Status prüfen
git status

# Gezielt stagen (nie git add .)
git add src/components/todos/TodoForm.tsx
git add src/components/todos/TodoForm.test.tsx

# Commit mit Conventional Commit Format
git commit -m "feat(todos): add todo creation form with priority selector"
```

**Commit-Format:**
```
<type>(<scope>): <beschreibung>
```

Vollständige Typen & Scopes → siehe [ARCHITECTURE.md](ARCHITECTURE.md#11-conventional-commits)

### 3. Regelmäßig pushen

```bash
# Ersten Push des Branches
git push -u origin feature/todo-form

# Folge-Pushes
git push
```

Mindestens einmal täglich pushen — auch wenn noch nicht fertig. Backup und Sichtbarkeit.

### 4. dev auf dem aktuellen Stand halten

Wenn `dev` sich während der Arbeit weiterentwickelt hat:

```bash
git fetch origin
git rebase origin/dev
# Konflikte lösen falls nötig, dann:
git rebase --continue
```

Rebase statt Merge — hält die Feature-Branch-History linear und lesbar.

### 5. Pull Request öffnen (Feature → dev)

Wenn das Feature fertig ist:

1. Letzten Push: `git push`
2. Auf GitHub → **New Pull Request**
3. Base: `dev` ← Compare: `feature/todo-form`
4. Titel = Conventional Commit Stil: `feat(todos): add todo creation form`
5. Beschreibung: Was wurde gebaut, wie testen, Screenshots wenn UI

PR-Checklist vor dem Öffnen:
- [ ] Lint läuft durch (`pnpm lint`)
- [ ] TypeCheck grün (`pnpm typecheck`)
- [ ] Tests grün (`pnpm test:all`)
- [ ] Keine console.log vergessen
- [ ] Commits sind sauber (kein "wip", "fix2", "asdf")

### 6. Nach PR-Merge: Branch aufräumen

```bash
git checkout dev
git pull origin dev
git branch -d feature/todo-form
```

---

## Release (dev → main)

Wenn ein Set an Features bereit für ein Release ist:

```bash
# PR öffnen: dev → main
# Titel: "Release: sidebar MVP" o.ä.
# Nach Merge: semantic-release läuft automatisch via CI
```

semantic-release übernimmt dann:
- Version berechnen (aus Commit-History)
- Tag erstellen (`v1.0.0`)
- CHANGELOG.md generieren
- GitHub Release mit .dmg + .exe erstellen

**Niemals manuell taggen.** Das macht semantic-release.

---

## Commit-History sauber halten

### Was einen guten Commit ausmacht
- Eine logische Änderung pro Commit
- Titel erklärt das **Was**, Body das **Warum**
- Kein "WIP", "fix", "test123" in der History

### Commits vor dem PR aufräumen (optional)

Wenn während der Entwicklung schlechte Commits entstanden sind:

```bash
# Letzten N Commits interaktiv zusammenfassen
git rebase -i HEAD~4
# Im Editor: pick → squash für Commits die zusammengehören
```

Nur auf dem eigenen Feature-Branch machen — niemals auf dev oder main.

---

## Was niemals tun

```bash
# NICHT auf main pushen
git push origin main          # ← Nie

# NICHT direkt auf dev committen
git checkout dev
git commit ...                # ← Nie, immer Feature-Branch

# NICHT mit -A stagen (übersieht .env etc.)
git add -A                    # ← Nie, immer gezielt stagen

# NICHT force-pushen auf main oder dev
git push --force origin main  # ← Nie
```

---

## Schnell-Referenz

```bash
# Neues Feature
git checkout dev && git pull origin dev
git checkout -b feature/mein-feature

# Commit
git add src/datei.tsx
git commit -m "feat(scope): beschreibung"

# Push
git push -u origin feature/mein-feature  # (erster Push)
git push                                  # (folgende)

# Mit dev sync bleiben
git fetch origin && git rebase origin/dev

# Fertig → PR auf GitHub öffnen: feature/mein-feature → dev
```
