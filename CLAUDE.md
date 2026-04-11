# CLAUDE.md — Chronicle Plugin Context

This file captures the architecture, design decisions, and full context for the
Chronicle Obsidian plugin. Read this before making any changes to the codebase.

---

## What Chronicle is

Chronicle is a from-scratch Obsidian plugin that replicates the look and
functionality of Apple Calendar and Apple Reminders — built for users who want
Obsidian to be their "everything app" for tasks, reminders, and calendar events.

It is **not** a fork of TaskNotes (callumalpass/tasknotes), though that plugin
was evaluated as a starting point. The decision to start from scratch was made
because TaskNotes's UI and data layers are tightly coupled, its modal-based UI
is fundamentally incompatible with the Apple design language, and the
Calendars-as-contexts system required root-level architectural changes that
would have meant replacing essentially every file anyway.

---

## Core design goals

1. **Two separate but connected systems** — Tasks and Events are distinct types.
   A Task is something to DO (has completion state). An Event is something that
   HAPPENS at a time (no completion, has a time slot on the calendar).

2. **Calendars as first-class contexts** — Calendars (Work, Church, Personal,
   Family, etc.) are full contexts with their own color, views, and visibility.
   Both tasks and events belong to a Calendar.

3. **Apple design language** — The UI targets the aesthetic and interaction
   patterns of macOS Apple Calendar and Apple Reminders specifically:
   - Persistent sidebar + main content layout
   - Smart list tiles (Today, Scheduled, All, Flagged) in the Reminders style
   - Colored calendar dots in the sidebar
   - Event pills in a time grid
   - Popup modal for quick creation, expand button opens full-page form
   - Tasks grouped by Today / This Week / Later

4. **Open source, MIT licensed** — https://github.com/Operator-X9/Chronicle

---

## File naming conventions

- **Tasks:** Title only — `Buy groceries.md`
- **Events:** Title only — `Team standup.md`

All metadata lives in frontmatter, never in filenames.

Default folder locations (configurable in settings):
- Tasks → `Chronicle/Tasks/`
- Events → `Chronicle/Events/`

---

## Source structure

```
Chronicle/
├── src/
│   ├── main.ts                    Plugin entry point
│   ├── types/
│   │   └── index.ts               All TypeScript interfaces + DEFAULT_SETTINGS
│   ├── data/
│   │   ├── CalendarManager.ts     CRUD for calendars (in-memory, saved to settings)
│   │   ├── TaskManager.ts         CRUD for tasks (.md files in vault)
│   │   ├── EventManager.ts        CRUD for events (.md files in vault)
│   │   └── AlertManager.ts        Polls for due alerts, fires notifications
│   ├── ui/
│   │   ├── TaskModal.ts           Quick-create/edit popup for tasks
│   │   ├── EventModal.ts          Quick-create/edit popup for events
│   │   └── SettingsTab.ts         Obsidian settings panel (4 tabs)
│   └── views/
│       ├── TaskView.ts            Task dashboard (smart lists, sidebar, cards)
│       ├── TaskFormView.ts        Full-page task creation/editing form
│       ├── CalendarView.ts        Calendar (day/week/month/year)
│       └── EventFormView.ts       Full-page event creation/editing form
├── styles/
│   └── main.css                   All plugin CSS
├── manifest.json
├── versions.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── CLAUDE.md
```

---

## Data model

### ChronicleCalendar (stored in plugin settings, not vault files)

```
id           string        — generated from name + timestamp
name         string
color        string        — hex value (e.g. "#378ADD") or legacy named color
isVisible    boolean       — toggled in sidebar
createdAt    string        — ISO 8601
```

### ChronicleTask (frontmatter field names)

```
id                   string     — "task-{timestamp36}-{random4}"
title                string
status               "todo" | "in-progress" | "done" | "cancelled"
priority             "none" | "low" | "medium" | "high"
location             string?
due-date             YYYY-MM-DD?
due-time             HH:mm?
recurrence           RRULE string?
alert                AlertOffset
calendar-id          string?
tags                 string[]
projects             string[]
linked-notes         string[]
time-estimate        number?    — minutes
time-entries         {startTime: ISO, endTime?: ISO}[]
custom-fields        {key: string, value: string|number|boolean}[]
completed-instances  string[]   — YYYY-MM-DD, for recurring tasks
created-at           ISO 8601
completed-at         ISO 8601?
```

Note: `contexts` field has been removed and is no longer used.
Note: Custom fields UI has been removed. The field still exists in the type
for backwards compatibility but is no longer exposed in the UI.

### ChronicleEvent (frontmatter field names, in creation form order)

```
id                   string     — "event-{timestamp36}-{random4}"
title                string
location             string?
all-day              boolean
start-date           YYYY-MM-DD
start-time           HH:mm?
end-date             YYYY-MM-DD
end-time             HH:mm?
recurrence           RRULE string?
calendar-id          string?
alert                AlertOffset
tags                 string[]
linked-notes         string[]
linked-task-ids      string[]
completed-instances  string[]
created-at           ISO 8601
```

Note: `notes` field is only shown in the full-page form, not the popup modal.

### AlertOffset type

```
"none" | "at-time" | "5min" | "10min" | "15min" | "30min"
| "1hour" | "2hours" | "1day" | "2days" | "1week"
```

---

## ChronicleSettings (all fields)

```typescript
tasksFolder:           string           // "Chronicle/Tasks"
eventsFolder:          string           // "Chronicle/Events"
calendars:             ChronicleCalendar[]
defaultCalendarId:     string
defaultTaskStatus:     TaskStatus
defaultTaskPriority:   TaskPriority
defaultAlert:          AlertOffset
startOfWeek:           0 | 1 | 6       // 0=Sun, 1=Mon, 6=Sat
timeFormat:            "12h" | "24h"
defaultCalendarView:   "day"|"week"|"month"|"year"
showTodayList:         boolean          // renamed from showTodayCount
showScheduledList:     boolean          // renamed from showScheduledCount
showAllList:           boolean
showFlaggedList:       boolean          // Flagged smart list (no settings toggle — always visible if used)
showCompletedList:     boolean          // renamed from showCompletedCount
smartListOrder:        string[]         // drag-to-reorder persistence, e.g. ["today","scheduled","all","flagged","completed"]
smartListColors:       Record<string, string>  // per-tile hex color, e.g. { today: "#FF3B30", ... }
notifMacOS:            boolean          // Native macOS notification
notifObsidian:         boolean          // In-app Obsidian toast
notifSound:            boolean          // Two-tone chime
notifEvents:           boolean          // Alerts for events
notifTasks:            boolean          // Alerts for tasks
defaultEventDuration:  number           // minutes
density:               "compact"|"comfortable"
showTaskCountSubtitle: boolean
defaultCustomFields:   {key, type}[]    // Reserved, UI removed
```

---

## UI patterns

### Creation/editing flow (both tasks and events)
1. Default: popup modal opens (TaskModal / EventModal)
2. Expand button (⤢) in modal header → closes modal, opens full-page form tab
3. Full-page form: TaskFormView / EventFormView
4. Both save via their respective Manager classes

### Task popup (TaskModal) fields
title, location, status, priority, date, time, calendar, repeat, alert, tags

### Task full-page form (TaskFormView) fields  
All popup fields + linked notes, time estimate, projects, notes

### Event popup (EventModal) fields
title, location, all-day toggle, start date, end date, start time, end time,
repeat, calendar, alert, tags

### Event full-page form (EventFormView) fields
All popup fields + linked notes, notes

### Notes field
Only shown in full-page forms, not popups. This is intentional.

---

## Alert system (AlertManager)

- Polls every 30 seconds via `window.setInterval`
- Also re-checks immediately when any relevant file changes via `metadataCache`
- First check is delayed 3 seconds after startup to let vault load
- Fired alerts tracked in `firedAlerts: Set<string>` (session only, resets on restart)
- Alert key format: `event-{id}-{startDate}-{alert}` / `task-{id}-{dueDate}-{alert}`
- Window: 5 minutes (fires if within 5 min past the alert time)
- Tasks with no dueDate but with dueTime use today's date

### Notification channels (all configurable in settings)
1. **macOS native** — via `osascript` (most reliable, works in background)
2. **Obsidian toast** — via `new Notice(...)` 
3. **Sound** — two-tone chime via Web Audio API (880Hz + 1108Hz)

### CalendarManager.colorToHex
Now accepts both hex values (pass-through) and legacy named colors.
Calendars created after the color picker update store hex values directly.

---

## Settings page (SettingsTab.ts)

Opens inside Obsidian's native settings panel (gear icon → Chronicle).
Four horizontal tabs matching Obsidian's native tab style:

- **General** — folder paths, time format, notification channel toggles, test button
- **Calendar** — start of week, default view, default calendar, event duration,
  event alert, calendar management (add/rename/recolor/delete). No colored dot
  shown next to calendar rows (removed as redundant).
- **Reminders** — default status/priority/alert/calendar, smart list visibility.
  Smart List Visibility section: per-tile color picker + show/hide toggle for each
  tile (Today, Scheduled, All, Completed). No colored dot shown next to rows
  (removed as redundant). "Show Flagged List" toggle was removed.
- **Appearance** — density, show/hide subtitle and completed count

---

## Auto-refresh pattern

Both TaskView and CalendarView use `metadataCache.on("changed")` to auto-refresh
when any file in their respective folders changes. This is the correct Obsidian
pattern — it fires after frontmatter is fully parsed so data is always fresh.

Direct `this.render()` calls after write operations have been removed from most
handlers to avoid double-renders and race conditions. The metadataCache listener
handles all re-renders automatically.

---

## Tech stack

| Thing | Choice | Why |
|---|---|---|
| Language | TypeScript | Required for Obsidian plugins |
| Bundler | esbuild (context API) | Fast, watch mode via context.watch() |
| Date parsing | chrono-node v2 | Natural language input |
| Styling | Plain CSS | Obsidian CSS variables handle theming |

---

## Build & development

```bash
npm install
npm run dev          # watch mode
npm run build        # production build
./deploy.sh          # copy to Obsidian vault for testing
```

Vault location: `/Users/local_disk/Desktop/Chronicle/CORE Obsidian Vault Testing`
Plugin installs to: `.obsidian/plugins/chronicle/`

After deploying: toggle Chronicle off then on in Obsidian Settings →
Community plugins to reload.

---

## Build phases

### Phase 1 — Data layer ✅
Types, managers, plugin shell.

### Phase 2 — Task dashboard ✅
Smart list tiles, sidebar, task cards, auto-refresh, completed archive.

### Phase 3 — Calendar view ✅
Day/Week/Month/Year, all-day shelf, recurrence expansion, auto-refresh.

### Phase 4 — Creation forms ✅
Task modal + full-page form. Event modal + full-page form.
Expand button on both modals. Delete from modals and context menus.

### Phase 5 — Alerts ✅
macOS notifications (osascript), Obsidian toast, two-tone chime.
Per-channel and per-type toggles in settings.

### Phase 6 — Settings page ✅
Four-tab settings panel inside Obsidian native settings.
Calendar management with custom color picker.

### Phase 7 — Polish pass ✅ (ongoing)
- Completed smart list tile (moved from sidebar row into the smart list tile grid)
- Smart list visibility toggles wired to actual show/hide behavior
- Drag-to-reorder smart list tiles (HTML5 drag-and-drop, persisted to settings)
- Per-tile color pickers in settings Smart List Visibility section
- Smart list and regular list title text always `var(--text-normal)` (not tile color)
- Rounded corners on both Reminders and Calendar main panes
- Full theme compatibility: entire CSS rewritten to use Obsidian CSS variables
  (colors, fonts, border-radius, interactive states — responds to themes and accent color)
- "New Reminder" button uses `--interactive-normal` (matches all other plugin buttons)
- Removed redundant colored dots from My Lists, My Calendars, and Smart List rows in settings
- "Show Flagged List" toggle removed from settings

### Phase 8 — Remaining (not yet built)
- Events linking to tasks (action items for a meeting)

---

## Key technical decisions

**CalendarColor is now `string`** — changed from a union of named colors to
allow hex values from the color picker. `colorToHex()` handles both formats.

**RRULE for recurrence** — both tasks and events use RRULE standard.
`EventManager.getInRangeWithRecurrence()` expands recurring events into
individual occurrences for a given date range before rendering.

**Contexts removed** — the `contexts` field has been removed from the UI
entirely. The field may still exist in older task files but is ignored.

**Notes popup exclusion** — notes field intentionally excluded from popup
modals. Only available in full-page forms. This keeps the popup lightweight.

**esbuild context API** — uses `esbuild.context()` + `context.watch()` instead
of the deprecated `build({ watch: true })` pattern. Required for esbuild 0.17+.

**Smart list tiles are data-driven** — built from an `allTiles` map keyed by id
(`today`, `scheduled`, `all`, `flagged`, `completed`). Order comes from
`settings.smartListOrder`, colors from `settings.smartListColors`, visibility
from per-list boolean flags. Drag-and-drop reorders `smartListOrder` and saves.

**Theme compatibility via CSS variables** — `styles/main.css` uses no hardcoded
colors or fonts. All values come from Obsidian's CSS custom properties:
`--color-red/green/orange`, `--interactive-accent`, `--text-on-accent`,
`--font-interface`, `--radius-s/m/l`, `--background-primary/secondary`,
`--text-normal/muted/faint`, `--interactive-normal/hover`. Alpha variants use
`color-mix(in srgb, var(--color-X) N%, transparent)` — supported in Obsidian's
Chromium/Electron. Tile count/label text and toggle thumbs intentionally keep
`#fff` as they are on user-set or semantic backgrounds.

**Layout rounded corners** — `.chronicle-layout` / `.chronicle-cal-layout` have
`background: var(--background-secondary)` and `padding: 8px 8px 8px 0`. The
main pane has `border-radius: var(--radius-m)`, making the secondary color show
as a backdrop — mirroring how the Obsidian settings modal works.

**`experimental` branch** — created for testing major changes. Merges back to
`main` via `git checkout main && git merge experimental && git push`.

---

## The user / project owner

- First-time plugin developer, learning as they go
- On macOS, using VS Code
- Has Node 24, npm 11, Git 2.50
- GitHub: https://github.com/Operator-X9/Chronicle
- Goal: a personal "everything app" inside Obsidian — tasks, reminders,
  calendar — that feels native and polished, not like a developer tool
