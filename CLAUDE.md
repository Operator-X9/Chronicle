# CLAUDE.md — Chronicle Plugin Context

This file captures the architecture, design decisions, and full context for the
Chronicle Obsidian plugin. Read this before making any changes to the codebase.

---

## What Chronicle is

Chronicle is a from-scratch Obsidian plugin that replicates the look, feel, and
functionality of Apple Calendar and Apple Reminders — built for users who want
Obsidian to be their "everything app" for tasks, reminders, and calendar events.

It is **not** a fork of TaskNotes (callumalpass/tasknotes), though that plugin
was evaluated as a starting point. The decision to start from scratch was made
because TaskNotes's UI and data layers are tightly coupled, its modal-based UI
is fundamentally incompatible with the Apple design language, and the
Calendars-as-contexts system required root-level architectural changes that
would have meant replacing essentially every file anyway.

What we kept from the TaskNotes evaluation:
- The concept of file-per-note with YAML frontmatter
- FullCalendar as the calendar rendering library
- The general idea of using Obsidian's metadata cache for indexing

---

## Core design goals

1. **Two separate but connected systems** — Tasks and Events are distinct types.
   A Task is something to DO (has completion state). An Event is something that
   HAPPENS at a time (no completion, has a time slot on the calendar).

2. **Calendars as first-class contexts** — Calendars (Work, Church, Personal,
   Family, etc.) are full contexts, not just tags. Each has its own color,
   views, and eventually sync. Both tasks and events belong to a Calendar.

3. **Apple design language** — The UI targets the aesthetic and interaction
   patterns of macOS Apple Calendar and Apple Reminders specifically:
   - Persistent three-panel layout (sidebar + mini-month + main content)
   - Smart list tiles (Today, Scheduled, All, Flagged) in the Reminders style
   - Colored calendar dots in the sidebar
   - Event pills in a time grid
   - Full-page tabbed creation forms (not modal popups)
   - Inline new-task entry at the bottom of lists
   - Tasks grouped by Today / This Week / Later

4. **Open source, MIT licensed** — Published at
   https://github.com/Operator-X9/Chronicle

---

## File naming conventions

- **Tasks:** Title only — `Buy groceries.md`
  All metadata (date, status, priority, etc.) lives in frontmatter, never the filename.

- **Events:** Title only — `Team standup.md`
  All date and time information lives in frontmatter, never the filename.

Default folder locations (configurable in settings):
- Tasks → `Chronicle/Tasks/`
- Events → `Chronicle/Events/`

---

## Data model

### ChronicleCalendar

Calendars are stored in plugin settings (not as vault files). They are the
top-level organisational unit shared by both tasks and events.

```
id           string        — generated from name + timestamp (e.g. "work-abc123")
name         string        — display name (e.g. "Work")
color        CalendarColor — one of: blue, green, purple, orange, red, teal, pink, yellow, gray
description  string?
isVisible    boolean       — toggled in sidebar to show/hide that calendar's items
createdAt    string        — ISO 8601
```

### ChronicleTask (frontmatter field names)

```
id                   string     — "task-{timestamp36}-{random4}"
title                string
status               "todo" | "in-progress" | "done" | "cancelled"
priority             "none" | "low" | "medium" | "high"
due-date             YYYY-MM-DD?
due-time             HH:mm?
recurrence           RRULE string?  (e.g. "FREQ=WEEKLY;BYDAY=MO")
calendar-id          string?        — references a ChronicleCalendar id
tags                 string[]
contexts             string[]       — e.g. ["@home", "@work"]
projects             string[]
linked-notes         string[]       — wikilink paths e.g. ["Projects/Website"]
time-estimate        number?        — minutes
time-entries         {startTime: ISO, endTime?: ISO}[]
custom-fields        {key: string, value: string|number|boolean}[]
completed-instances  string[]       — YYYY-MM-DD, for recurring tasks
created-at           ISO 8601
completed-at         ISO 8601?
```

Body content of the note = the `notes` field (everything after the closing `---`).

### ChronicleEvent (frontmatter field names, in creation form order)

```
id                   string     — "event-{timestamp36}-{random4}"
title                string
location             string?
all-day              boolean
start-date           YYYY-MM-DD
start-time           HH:mm?     — undefined when all-day is true
end-date             YYYY-MM-DD
end-time             HH:mm?     — undefined when all-day is true
recurrence           RRULE string?
calendar-id          string?
alert                AlertOffset — "none"|"at-time"|"5min"|"10min"|"15min"|"30min"
                                   |"1hour"|"2hours"|"1day"|"2days"|"1week"
linked-task-ids      string[]   — Chronicle task IDs
completed-instances  string[]   — for recurring events
created-at           ISO 8601
```

Body content of the note = the `notes` field.

---

## Source structure

```
Chronicle/
├── src/
│   ├── main.ts                  Plugin entry point, loads all managers
│   ├── types/
│   │   └── index.ts             All TypeScript interfaces and DEFAULT_SETTINGS
│   ├── data/
│   │   ├── CalendarManager.ts   CRUD for calendars (in-memory, saved to settings)
│   │   ├── TaskManager.ts       CRUD for tasks (reads/writes .md files in vault)
│   │   └── EventManager.ts      CRUD for events (reads/writes .md files in vault)
│   ├── ui/                      (Phase 3+) Creation forms, modals
│   └── views/                   (Phase 2+) Sidebar, task list, calendar view
├── styles/
│   └── main.css                 All plugin CSS
├── manifest.json                Obsidian plugin manifest
├── versions.json                Min Obsidian version map
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── CLAUDE.md                    This file
```

---

## Tech stack

| Thing | Choice | Why |
|---|---|---|
| Language | TypeScript | Required for Obsidian plugins |
| Bundler | esbuild | Fast, used by the Obsidian plugin template |
| Calendar rendering | FullCalendar v6 | Same library TaskNotes uses, best-in-class for this |
| Date parsing | chrono-node v2 | Natural language date input ("tomorrow at 3pm") |
| Styling | Plain CSS (no framework) | Obsidian CSS variables handle theming/dark mode |

---

## Build & development

```bash
npm install          # install dependencies
npm run dev          # watch mode — rebuilds on every save
npm run build        # production build
```

**To test in Obsidian:**
1. Copy (or symlink) the plugin folder into your vault at
   `.obsidian/plugins/chronicle/`
2. Enable "Community plugins" in Obsidian settings
3. Enable Chronicle in the plugin list
4. Reload Obsidian after any build

The dev build includes inline source maps. The production build strips them and
tree-shakes unused code.

---

## Build phases

### Phase 1 — Data layer ✅ (complete)
Types, CalendarManager, TaskManager, EventManager, plugin shell.
All tasks and events serialise to / deserialise from YAML frontmatter in .md files.

### Phase 2 — Reminders-style task view (next)
- Left sidebar: smart list tiles (Today, Scheduled, All, Flagged) + My Lists
- Main panel: task rows grouped by Today / This Week / Later
- Inline new-task entry at the bottom of the list
- Task row: large circle checkbox, title, date badge, priority flag

### Phase 3 — Calendar-style event view
- Sidebar: calendar list with colored dots + mini month navigator
- Main panel: Day / Week / Month / Year views via FullCalendar
- Event pills colored by Calendar
- Click a time slot → open event creation form

### Phase 4 — Full-page creation forms
- Task form: full-page, all fields visible, keyboard-navigable with Tab
- Event form: same UX, fields in exact order:
  title → location → all-day toggle → start → end → repeat → calendar → alert → notes
- All-day toggle collapses/expands the time pickers

### Phase 5 — Cross-system connection
- Tasks with a due date appear on the Calendar view as pills
- Events can link to tasks (action items for a meeting, etc.)
- Unified "Today" view shows both due tasks and today's events

---

## Key technical decisions & why

**File-per-task, not a database**
Tasks and events are plain Markdown files with YAML frontmatter. This keeps data
portable, human-readable, and compatible with the rest of the user's Obsidian vault.
No plugin-specific SQLite or JSON database.

**Calendars in settings, not files**
Calendars are lightweight config objects. Storing them as vault files would add
complexity (parsing, path management) for no benefit — they have no body content.

**ID strategy**
IDs are generated as `{type}-{Date.now().toString(36)}-{random4}`. This avoids
collisions without requiring a UUID library, keeps IDs short, and embeds rough
creation-time ordering.

**RRULE for recurrence**
Both tasks and events use the RRULE standard (same as iCalendar / Google Calendar).
This makes future calendar sync (Google, iCloud) much easier and avoids inventing
a custom recurrence format.

**Obsidian metadataCache for reading**
TaskManager and EventManager use `app.metadataCache.getFileCache()` to read
frontmatter rather than parsing raw file content. This is faster (the cache is
already built) and is the idiomatic Obsidian approach. Raw file reads are only
used to extract the note body.

**esbuild external list**
All Obsidian internals and CodeMirror packages are marked external so they are
not bundled — Obsidian provides them at runtime. Bundling them would bloat the
output and cause version conflicts.

---

## Style & UI conventions

- Target: Apple Calendar + Apple Reminders aesthetic on macOS
- Font: system font stack (SF Pro on Mac via `-apple-system`)
- Colors: each Calendar has one of 9 named colors mapped to specific hex values
  (see `CalendarManager.colorToHex()`)
- Dark mode: supported via Obsidian CSS variables — never hardcode colors
- No third-party UI component libraries — plain HTML + CSS only
- Obsidian leaf/pane system used for view registration

---

## The user / project owner

- First-time plugin developer, learning as they go
- On macOS, using VS Code
- Has Node 24, npm 11, Git 2.50
- GitHub: https://github.com/Operator-X9/Chronicle
- Goal: a personal "everything app" inside Obsidian — tasks, reminders,
  calendar — that feels native and polished, not like a developer tool
